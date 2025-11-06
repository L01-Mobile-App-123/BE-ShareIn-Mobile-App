import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, Req, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { 
  FindOrCreateConversationDto, 
  CreateMessageDto,
  MessageResponseDto,
  GetConversationsResponseDto
} from './dto/chat.dto';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { type UserRequest } from '@common/interfaces/userRequest.interface';
import { ApiResponseDto } from '@common/dto/api-response.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  
  // POST /conversations: Tạo hoặc lấy hội thoại
  @Post()
  @ApiOperation({ summary: 'Tạo hoặc lấy Conversation giữa hai user trong ngữ cảnh một Post' })
  @ApiBody({ type: FindOrCreateConversationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Trả về Conversation ID và trạng thái (tạo mới/đã tồn tại).',
    schema: {
      properties: {
        conversation_id: { type: 'string', example: 'd19c3c5d-85d8-4a9f-a0c0-6d9b4b0e5b3e' },
        message: { type: 'string', example: 'Lấy cuộc trò chuyện đã tồn tại' }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Conflict: Người dùng đang cố tự chat với chính mình.' })
  async findOrCreate(
    @Body() findOrCreateDto: FindOrCreateConversationDto,
    @Req() req: UserRequest,
  ) {
    const currentUserId = req.user.userId;
    const conversation = await this.chatService.findOrCreateConversation(
      currentUserId,
      findOrCreateDto,
    );
    return { 
      conversation_id: conversation.conversation_id, 
      // Kiểm tra nếu conversation được tạo mới hoàn toàn (last_message_at == created_at)
      message: conversation.created_at.getTime() === conversation.last_message_at.getTime() 
        ? 'Tạo cuộc trò chuyện mới thành công' 
        : 'Lấy cuộc trò chuyện đã tồn tại',
    };
  }

  // GET /conversations: Lấy danh sách hội thoại
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả Conversation của người dùng hiện tại' })
  @ApiResponse({ status: 200, type: GetConversationsResponseDto, isArray: true, description: 'Danh sách Conversation kèm tin nhắn cuối và số tin chưa đọc.' })
  async findAll(@Req() req: UserRequest) {
    const currentUserId = req.user.userId;
    return this.chatService.getConversations(currentUserId);
  }
  
  // GET /conversations/:id/messages: Lấy lịch sử tin nhắn
  @Get(':id/messages')
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn chi tiết của một Conversation (Phân trang)' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: 'string' })
  @ApiQuery({ name: 'page', description: 'Trang cần lấy (mặc định là 1)', required: false, type: 'number' })
  @ApiResponse({ status: 200, type: MessageResponseDto, isArray: true, description: 'Danh sách tin nhắn trong trang hiện tại.' })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    return this.chatService.getMessages(conversationId, page);
  }
  
  // POST /conversations/messages: Gửi tin nhắn mới (REST fallback)
  @Post('messages')
  @HttpCode(201)
  @ApiOperation({ summary: 'Gửi tin nhắn mới (REST fallback/non-realtime)', description: 'Trong ứng dụng mobile, chức năng này thường được thay thế bằng WebSocket.' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, type: MessageResponseDto, description: 'Tin nhắn đã được tạo và lưu vào DB.' })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: UserRequest,
  ) {
    const senderId = req.user.userId;
    const message = await this.chatService.createMessage(senderId, createMessageDto);
    return message;
  }
  
  // PATCH /conversations/:id/read: Đánh dấu cuộc trò chuyện đã đọc
  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Đánh dấu tất cả tin nhắn trong Conversation là đã đọc cho user hiện tại.' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Cập nhật thành công (không trả về nội dung).' })
  @ApiResponse({ status: 404, description: 'Conversation không tồn tại.' })
  async markAsRead(
    @Param('id') conversationId: string,
    @Req() req: UserRequest,
  ) {
    const userId = req.user.userId;
    await this.chatService.markConversationAsRead(userId, conversationId);
    return;
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