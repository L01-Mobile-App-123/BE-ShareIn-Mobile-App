import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Conversation } from '@modules/entities/conversation.entity';
import { Message } from '@modules/entities/message.entity';
import { FindOrCreateConversationDto, CreateMessageDto } from './dto/chat.dto';
import { UsersService } from '@modules/users/user.service';
import { MessageType } from '@common/enums/message-type.enum'
import { User } from '@modules/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    public conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User) // Inject User Repository
    private userRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  /**
   * Tạo hoặc tìm kiếm cuộc trò chuyện 1-1
   */
  async findOrCreateConversation(
    currentUserId: string,
    dto: FindOrCreateConversationDto,
  ): Promise<Conversation> {
    const { recipient_id } = dto;
    
    if (currentUserId === recipient_id) {
        throw new ConflictException('Không thể tự chat với chính mình');
    }

    // Đảm bảo chỉ có một thứ tự chuẩn (canonical order) để query
    const [user1Id, user2Id] = [currentUserId, recipient_id].sort();
    
    // 1. Tìm kiếm Conversation đã tồn tại giữa 2 người
    let conversation = await this.conversationRepository.findOne({
      where: {
        initiator_id: user1Id,
        recipient_id: user2Id,
      },
      relations: ['initiator', 'recipient'],
    });

    if (conversation) {
      return conversation;
    }

    // 2. Nếu chưa có, kiểm tra User tồn tại
    await this.usersService.findOne(recipient_id);

    // 3. Tạo Conversation mới
    conversation = this.conversationRepository.create({
      initiator_id: user1Id,
      recipient_id: user2Id,
      last_message_at: new Date(), 
    });

    await this.conversationRepository.save(conversation);
    return conversation;
  }

  /**
   * Lấy danh sách cuộc trò chuyện của người dùng hiện tại
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.find({
      where: [
        { initiator_id: userId },
        { recipient_id: userId },
      ],
      relations: ['initiator', 'recipient'], // Bỏ relation 'post'
      order: {
        last_message_at: 'DESC', 
      },
    });
    
    // Xử lý tính toán unread count
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (convo) => ({
            ...convo,
            unread_count: await this.countUnreadMessages(convo, userId), 
        }))
    );
    
    return conversationsWithUnread as Conversation[];
  }

  /**
   * Gửi tin nhắn mới
   */
  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const { conversation_id, content, message_type } = dto;

    const conversation = await this.conversationRepository.findOne({
        where: { conversation_id },
        relations: ['initiator', 'recipient']
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }
    
    // Xác định người nhận
    const recipientId = conversation.initiator_id === senderId 
        ? conversation.recipient_id 
        : conversation.initiator_id;

    // Kiểm tra chặn
    const isBlocked = await this.checkBlockRelation(senderId, recipientId);
    if (isBlocked) {
        throw new ForbiddenException('Không thể gửi tin nhắn do có chặn từ một trong hai phía.');
    }

    // ... (phần còn lại giữ nguyên)
    const message = this.messageRepository.create({
      conversation_id,
      sender_id: senderId,
      content,
      message_type: dto.message_type.toLowerCase() as MessageType,
    });

    await this.messageRepository.save(message);

    const now = message.sent_at;
    await this.conversationRepository.update(conversation_id, {
      last_message_at: now,
      ...(conversation.initiator_id === senderId 
          ? { initiator_last_read: now }
          : { recipient_last_read: now }),
    });
    
    return message;
  }
  
  /**
   * Lấy lịch sử tin nhắn
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    return this.messageRepository.find({
        where: { conversation_id: conversationId },
        order: { sent_at: 'DESC' }, 
        take: limit,
        skip: (page - 1) * limit,
        relations: ['sender'],
    });
  }

  /**
   * Lấy lịch sử tin nhắn kèm tổng số (phục vụ phân trang)
   */
  async getMessagesPaginated(conversationId: string, page: number = 1, limit: number = 50): Promise<{ data: Message[]; total: number }> {
    const [data, total] = await this.messageRepository.findAndCount({
      where: { conversation_id: conversationId },
      order: { sent_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['sender'],
    });

    return { data, total };
  }

  /**
   * Đánh dấu cuộc trò chuyện đã đọc (cập nhật last_read)
   */
  async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
        where: { conversation_id: conversationId }
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }

    const now = new Date();
    
    let updateObject = {};
    if (conversation.initiator_id === userId) {
        updateObject = { initiator_last_read: now };
    } else if (conversation.recipient_id === userId) {
        updateObject = { recipient_last_read: now };
    } else {
        throw new ConflictException('Bạn không thuộc cuộc trò chuyện này.');
    }

    await this.conversationRepository.update(conversationId, updateObject);
  }
  
  /**
   * Tính toán số lượng tin nhắn chưa đọc
   */
  async countUnreadMessages(conversation: Conversation, userId: string): Promise<number> {
    const isInitiator = conversation.initiator_id === userId;
    const lastReadTime = isInitiator 
        ? conversation.initiator_last_read 
        : conversation.recipient_last_read;
    
    // Nếu tin nhắn cuối cùng mới hơn thời điểm đọc cuối cùng
    if (!lastReadTime || conversation.last_message_at > lastReadTime) {
      return this.messageRepository.count({
          where: {
              conversation_id: conversation.conversation_id,
              sender_id: Not(userId), // Tin nhắn gửi bởi người khác
              ...(lastReadTime && { sent_at: Not(lastReadTime) }) // Tin nhắn sau thời điểm đọc cuối cùng
          },
      });
    }
    
    return 0;
  }

  /**
   * Chặn người dùng
   */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new ConflictException('Không thể tự chặn chính mình');
    }

    const blocker = await this.userRepository.findOne({
      where: { user_id: blockerId },
      relations: ['blockedUsers'],
    });

    if (!blocker) {
      throw new NotFoundException('Người dùng thực hiện chặn không tồn tại');
    }

    const blocked = await this.userRepository.findOne({ where: { user_id: blockedId } });
    if (!blocked) throw new NotFoundException('Người dùng bị chặn không tồn tại');

    // Kiểm tra xem đã chặn chưa
    if (!blocker.blockedUsers) {
        blocker.blockedUsers = [];
    }

    const isAlreadyBlocked = blocker.blockedUsers.some(u => u.user_id === blockedId);
    if (isAlreadyBlocked) {
      throw new ConflictException('Bạn đã chặn người dùng này rồi');
    }

    blocker.blockedUsers.push(blocked);
    await this.userRepository.save(blocker);
  }

  /**
   * Bỏ chặn người dùng
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const blocker = await this.userRepository.findOne({
      where: { user_id: blockerId },
      relations: ['blockedUsers'],
    });

    if (!blocker) {
      throw new NotFoundException('Người dùng thực hiện bỏ chặn không tồn tại');
    }

    if (!blocker.blockedUsers) {
        throw new NotFoundException('Bạn chưa chặn người dùng này');
    }

    const blockedIndex = blocker.blockedUsers.findIndex(u => u.user_id === blockedId);
    if (blockedIndex === -1) {
      throw new NotFoundException('Bạn chưa chặn người dùng này');
    }

    blocker.blockedUsers.splice(blockedIndex, 1);
    await this.userRepository.save(blocker);
  }

  /**
   * Kiểm tra quan hệ chặn (2 chiều)
   */
  async checkBlockRelation(user1Id: string, user2Id: string): Promise<boolean> {
    const user1 = await this.userRepository.findOne({
      where: { user_id: user1Id },
      relations: ['blockedUsers', 'blockedBy'],
    });

    if (!user1) {
        return false;
    }

    // Kiểm tra user1 có chặn user2 không
    const hasBlocked = user1.blockedUsers?.some(u => u.user_id === user2Id) || false;
    // Kiểm tra user1 có bị user2 chặn không
    const isBlockedBy = user1.blockedBy?.some(u => u.user_id === user2Id) || false;

    return hasBlocked || isBlockedBy;
  }
}