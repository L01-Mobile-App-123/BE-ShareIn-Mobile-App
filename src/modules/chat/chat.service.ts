import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Conversation } from '@modules/entities/conversation.entity';
import { Message } from '@modules/entities/message.entity';
import { FindOrCreateConversationDto, CreateMessageDto } from './dto/chat.dto';
import { UsersService } from '@modules/users/user.service';
import { PostService } from '@modules/post/post.service';
import { MessageType } from '@common/enums/message-type.enum'

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    public conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private usersService: UsersService,
    private postsService: PostService,
  ) {}

  /**
   * Tạo hoặc tìm kiếm cuộc trò chuyện
   * Đảm bảo thứ tự Initiator/Recipient không quan trọng
   */
  async findOrCreateConversation(
    currentUserId: string,
    dto: FindOrCreateConversationDto,
  ): Promise<Conversation> {
    const { post_id, recipient_id } = dto;
    
    if (currentUserId === recipient_id) {
        throw new ConflictException('Không thể tự chat với chính mình');
    }

    // Đảm bảo chỉ có một thứ tự chuẩn (canonical order) để query
    const [user1Id, user2Id] = [currentUserId, recipient_id].sort();
    
    // 1. Tìm kiếm Conversation đã tồn tại
    let conversation = await this.conversationRepository.findOne({
      where: {
        post_id: post_id,
        initiator_id: user1Id,
        recipient_id: user2Id,
      },
      relations: ['initiator', 'recipient', 'post'],
    });

    if (conversation) {
      return conversation;
    }

    // 2. Nếu chưa có, kiểm tra tính hợp lệ của User và Post
    // Đây là bước quan trọng để đảm bảo ID tồn tại trong hệ thống
    await this.usersService.findOne(recipient_id);
    await this.postsService.findOne(post_id);

    // 3. Tạo Conversation mới
    conversation = this.conversationRepository.create({
      post_id,
      initiator_id: user1Id,
      recipient_id: user2Id,
      // Thiết lập last_message_at về thời gian tạo để có thể sắp xếp
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
      relations: ['post', 'initiator', 'recipient'], 
      order: {
        last_message_at: 'DESC', 
      },
    });
    
    // Xử lý tính toán unread count
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (convo) => ({
            ...convo,
            // Thêm trường ảo unread_count để trả về cho client
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

    // 1. Kiểm tra Conversation
    const conversation = await this.conversationRepository.findOne({
        where: { conversation_id }
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }
    
    if (conversation.initiator_id !== senderId && conversation.recipient_id !== senderId) {
        throw new ConflictException('Bạn không thuộc cuộc trò chuyện này.');
    }

    // 2. Tạo Message
    const message = this.messageRepository.create({
      conversation_id,
      sender_id: senderId,
      content,
      message_type: dto.message_type.toLowerCase() as MessageType,
    });

    await this.messageRepository.save(message);

    // 3. Cập nhật Conversation (last_message_at và last_read của người gửi)
    const now = message.sent_at;
    await this.conversationRepository.update(conversation_id, {
      last_message_at: now,
      // Cập nhật last_read của CHÍNH người gửi để tin nhắn vừa gửi không bị tính là "chưa đọc"
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
}