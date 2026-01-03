import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, MoreThan } from 'typeorm';
import { Conversation } from '@modules/entities/conversation.entity';
import { Message } from '@modules/entities/message.entity';
import { FindOrCreateConversationDto, CreateMessageDto } from './dto/chat.dto';
import { UsersService } from '@modules/users/user.service';
import { MessageType } from '@common/enums/message-type.enum'
import { User } from '@modules/entities/user.entity';
import { Post as PostEntity } from '@modules/entities/post.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    public conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User) // Inject User Repository
    private userRepository: Repository<User>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    private usersService: UsersService,
  ) {}

  /**
   * Tạo hoặc tìm kiếm cuộc trò chuyện 1-1
   */
  async findOrCreateConversation(
    currentUserId: string,
    dto: FindOrCreateConversationDto,
  ): Promise<Conversation> {
    const { recipient_id, post_id } = dto;
    
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
        post_id,
      },
      relations: ['initiator', 'recipient', 'post'],
    });

    if (conversation) {
      return conversation;
    }

    // 2. Nếu chưa có, kiểm tra User tồn tại
    await this.usersService.findOne(recipient_id);

    // 2.1. Kiểm tra Post tồn tại
    const post = await this.postRepository.findOne({ where: { post_id } });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    // 3. Tạo Conversation mới
    conversation = this.conversationRepository.create({
      initiator_id: user1Id,
      recipient_id: user2Id,
      post_id,
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
      relations: ['initiator', 'recipient', 'post'],
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

    if (conversation.is_locked) {
      throw new ForbiddenException('Cuộc trò chuyện đã bị khóa sau khi hoàn tất giao dịch');
    }
    
    // Xác định người nhận
    const recipientId = conversation.initiator_id === senderId 
        ? conversation.recipient_id 
        : conversation.initiator_id;


    // ... (phần còn lại giữ nguyên)
    const message = this.messageRepository.create({
      conversation_id,
      sender_id: senderId,
      content,
      message_type: dto.message_type.toLowerCase() as MessageType,
    });

    await this.messageRepository.save(message);

    // Reload saved message with sender relation so mapper can access sender.user_id
    const savedMessage = await this.messageRepository.findOne({
      where: { message_id: message.message_id },
      relations: ['sender'],
    });

    const now = (savedMessage || message).sent_at;
    await this.conversationRepository.update({ conversation_id }, {
      last_message_at: now,
      ...(conversation.initiator_id === senderId 
          ? { initiator_last_read: now }
          : { recipient_last_read: now }),
    });
    
    return savedMessage || message;
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
    // Trim potential leading/trailing whitespace (clients may send URL-encoded spaces)
    const trimmedId = (conversationId || '').trim();

    // Basic UUID v4 format validation
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(trimmedId)) {
      throw new BadRequestException('Invalid conversation id');
    }

    const conversation = await this.conversationRepository.findOne({
        where: { conversation_id: trimmedId }
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

    await this.conversationRepository.update({ conversation_id: conversationId }, updateObject);
  }
  
  /**
   * Tính toán số lượng tin nhắn chưa đọc
   */
  async countUnreadMessages(conversation: Conversation, userId: string): Promise<number> {
    const isInitiator = conversation.initiator_id === userId;
    const lastReadTime = isInitiator 
        ? conversation.initiator_last_read 
        : conversation.recipient_last_read;
    
    // Nếu không có thời điểm đọc trước đó: đếm tất cả tin nhắn do người khác gửi
    if (!lastReadTime) {
      return this.messageRepository.count({
        where: {
          conversation_id: conversation.conversation_id,
          sender_id: Not(userId),
        },
      });
    }

    // Nếu có lastReadTime: đếm tin nhắn được gửi sau lastReadTime bởi người khác
    if (conversation.last_message_at > lastReadTime) {
      return this.messageRepository.count({
        where: {
          conversation_id: conversation.conversation_id,
          sender_id: Not(userId),
          sent_at: MoreThan(lastReadTime),
        },
      });
    }

    return 0;
  }

  /**
   * Hoàn thành/Xác nhận giao dịch
   */
  async completeTransaction(
    conversationId: string,
    userId: string,
    finalPrice?: number,
    notes?: string,
  ): Promise<{ conversation_id: string; status: string; completed_at: Date; message: string }> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversation_id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }

    // Kiểm tra user có phải là một trong hai người trong cuộc trò chuyện không
    if (conversation.initiator_id !== userId && conversation.recipient_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này.');
    }

    // Tạo tin nhắn xác nhận giao dịch
    const confirmationMessage = this.messageRepository.create({
      conversation_id: conversationId,
      sender_id: userId,
      content: notes || '✅ Giao dịch đã hoàn thành',
      message_type: MessageType.TEXT,
    });

    await this.messageRepository.save(confirmationMessage);

    const completedAt = new Date();

    conversation.is_locked = true;
    await this.conversationRepository.save(conversation);

    return {
      conversation_id: conversationId,
      status: 'completed',
      completed_at: completedAt,
      message: 'Giao dịch đã được xác nhận thành công',
    };
  }
}