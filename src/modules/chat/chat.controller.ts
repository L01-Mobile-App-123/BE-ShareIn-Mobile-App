import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, Req, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatMapperService } from './chat.mapper.service';
import { 
  FindOrCreateConversationDto, 
  CreateMessageDto,
  MessageResponseDto,
  GetConversationsResponseDto,
  FindOrCreateConversationResponseDto,
  PaginatedMessagesResponseDto,
  GetMessagesQueryDto,
  MarkAsReadResponseDto
} from './dto/chat.dto';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { type UserRequest } from '@common/interfaces/userRequest.interface';
import { ApiResponseDto } from '@common/dto/api-response.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMapper: ChatMapperService,
  ) {}
  
  
  // POST /conversations: Tạo hoặc lấy hội thoại
  @Post()
  @ApiOperation({ summary: 'Tạo hoặc lấy Conversation giữa hai user trong ngữ cảnh một Post' })
  @ApiBody({ type: FindOrCreateConversationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về Conversation ID và trạng thái (tạo mới/đã tồn tại).',
    type: FindOrCreateConversationResponseDto
  })
  @ApiResponse({ status: 409, description: 'Conflict: Người dùng đang cố tự chat với chính mình.' })
  async findOrCreate(
    @Body() findOrCreateDto: FindOrCreateConversationDto,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<FindOrCreateConversationResponseDto>> {
    const currentUserId = req.user.userId;
    const conversation = await this.chatService.findOrCreateConversation(
      currentUserId,
      findOrCreateDto,
    );
    
    const message = conversation.created_at.getTime() === conversation.last_message_at.getTime() 
      ? 'Tạo cuộc trò chuyện mới thành công' 
      : 'Lấy cuộc trò chuyện đã tồn tại';
    
    return new ApiResponseDto<FindOrCreateConversationResponseDto>(
      message,
      {
        conversation_id: conversation.conversation_id,
        message,
      }
    );
  }

  // GET /conversations: Lấy danh sách hội thoại
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả Conversation của người dùng hiện tại' })
  @ApiResponse({ 
    status: 200, 
    type: GetConversationsResponseDto,
    description: 'Danh sách Conversation kèm tin nhắn cuối và số tin chưa đọc.' 
  })
  async findAll(@Req() req: UserRequest): Promise<ApiResponseDto<GetConversationsResponseDto[]>> {
    const currentUserId = req.user.userId;
    const conversations = await this.chatService.getConversations(currentUserId);
  const mapped = conversations.map((c) => this.chatMapper.mapConversationToDto(c, currentUserId));
    return new ApiResponseDto<GetConversationsResponseDto[]>(
      'Lấy danh sách cuộc trò chuyện thành công',
      mapped,
    );
  }
  
  // GET /conversations/:id/messages: Lấy lịch sử tin nhắn
  @Get(':id/messages')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn chi tiết của một Conversation (Phân trang)' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: 'string' })
  @ApiQuery({ name: 'page', description: 'Trang cần lấy (mặc định là 1)', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', description: 'Số tin nhắn mỗi trang (mặc định là 20)', required: false, type: 'number' })
  @ApiResponse({ 
    status: 200, 
    type: PaginatedMessagesResponseDto,
    description: 'Danh sách tin nhắn phân trang.' 
  })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query() queryDto: GetMessagesQueryDto,
  ): Promise<ApiResponseDto<PaginatedMessagesResponseDto>> {
    const { page = 20, limit = 1 } = queryDto;
    const { data, total } = await this.chatService.getMessagesPaginated(conversationId, page, limit);
    const items = data.map((m) => this.chatMapper.mapMessageToDto(m));
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    const paginated: PaginatedMessagesResponseDto = {
      data: items,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return new ApiResponseDto<PaginatedMessagesResponseDto>(
      'Lấy lịch sử tin nhắn thành công',
      paginated,
    );
  }
  
  // POST /conversations/messages: Gửi tin nhắn mới (REST fallback)
  @Post('messages')
  @HttpCode(201)
  @ApiOperation({ summary: 'Gửi tin nhắn mới (REST fallback/non-realtime)', description: 'Trong ứng dụng mobile, chức năng này thường được thay thế bằng WebSocket.' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ 
    status: 201, 
    type: MessageResponseDto,
    description: 'Tin nhắn đã được tạo và lưu vào DB.' 
  })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<MessageResponseDto>> {
    const senderId = req.user.userId;
    const message = await this.chatService.createMessage(senderId, createMessageDto);
  const mapped = this.chatMapper.mapMessageToDto(message);
    return new ApiResponseDto<MessageResponseDto>(
      'Gửi tin nhắn thành công',
      mapped,
    );
  }
  
  // PATCH /conversations/:id/read: Đánh dấu cuộc trò chuyện đã đọc
  @Patch(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đánh dấu tất cả tin nhắn trong Conversation là đã đọc cho user hiện tại.' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    type: MarkAsReadResponseDto,
    description: 'Cập nhật thành công.' 
  })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async markAsRead(
    @Param('id') conversationId: string,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<MarkAsReadResponseDto>> {
    const userId = req.user.userId;
    await this.chatService.markConversationAsRead(userId, conversationId);
    return new ApiResponseDto<MarkAsReadResponseDto>(
      'Đánh dấu tất cả tin nhắn là đã đọc thành công',
      {
        success: true,
        message: 'Đã đánh dấu tất cả tin nhắn là đã đọc',
      },
    );
  }

  // DELETE /conversations/:id: Xóa hoặc ẩn hội thoại
  // @Delete(':id')
  // @ApiOperation({ summary: 'Xóa (Soft Delete/Ẩn) một Conversation khỏi danh sách của user hiện tại.' })
  // @ApiParam({ name: 'id', description: 'Conversation ID', type: 'string' })
  // @ApiResponse({ status: 200, description: 'Đánh dấu Conversation đã bị ẩn/xóa mềm thành công.' })
  // async remove(@Param('id') id: string, @Req() req: UserRequest) {
  //   // Để hoàn thiện, bạn cần thêm logic soft delete/hide vào ChatService.
  //   const userId = req.user.userId; 
    
  //   // Ví dụ về lỗi nếu chưa triển khai:
  //   // throw new NotFoundException('Tính năng xóa/ẩn mềm chưa được triển khai.');
    
  //   return { message: `Tính năng xóa/ẩn mềm cho conversation ${id} bởi user ${userId} cần triển khai trong ChatService.` };
  // }
}