import { 
    WebSocketGateway, 
    SubscribeMessage, 
    MessageBody, 
    ConnectedSocket, 
    WebSocketServer, 
    OnGatewayConnection, 
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsCreateMessageDto, WsMarkReadDto, MessagePayload } from './dto/websocket.dto';
import { ConflictException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Conversation } from '@modules/entities/conversation.entity';

// Giả định cổng và CORS cho WebSocket
@WebSocketGateway({
    cors: {
        origin: '*', 
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    
    // Map lưu trữ User ID -> Socket ID(s)
    private userSocketMap = new Map<string, string[]>();

    constructor(private readonly chatService: ChatService) {}
    
    // --- Authentication và Quản lý kết nối ---

    handleConnection(client: Socket, ...args: any[]) {
        const userId = client.handshake.query.userId as string; 
        
        if (!userId) {
            client.emit('error', 'Authentication failed: Missing User ID.');
            client.disconnect();
            return;
        }
        
        (client as any).userId = userId;

        if (this.userSocketMap.has(userId)) {
            this.userSocketMap.get(userId)!.push(client.id);
        } else {
            this.userSocketMap.set(userId, [client.id]);
        }
        
        console.log(`[WS] Client connected: ${client.id}. User ID: ${userId}`);
        this.server.emit('user_status', { userId, is_online: true });
    }

    handleDisconnect(client: Socket) {
        const userId = (client as any).userId;
        
        if (userId && this.userSocketMap.has(userId)) {
            const sockets = this.userSocketMap.get(userId)!.filter(id => id !== client.id); 
            if (sockets.length === 0) {
                this.userSocketMap.delete(userId);
                this.server.emit('user_status', { userId, is_online: false });
            } else {
                this.userSocketMap.set(userId, sockets);
            }
        }
        console.log(`[WS] Client disconnected: ${client.id}`);
    }
    
    // Hàm tiện ích: Lấy socket IDs của người nhận
    private async getRecipientSockets(conversation: Conversation, currentUserId: string): Promise<string[]> {
        const recipientId = conversation.initiator_id === currentUserId 
            ? conversation.recipient_id 
            : conversation.initiator_id;
            
        return this.userSocketMap.get(recipientId) || [];
    }

    // --- Xử lý sự kiện gửi tin nhắn (send_message) ---

    @UsePipes(new ValidationPipe())
    @SubscribeMessage('send_message')
    async handleMessage(
        @MessageBody() dto: WsCreateMessageDto,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const senderId = (client as any).userId;
        
        try {
            // 1. Lưu tin nhắn vào DB và cập nhật Conversation (dùng Service)
            const message = await this.chatService.createMessage(senderId, {
                conversation_id: dto.conversationId,
                content: dto.content,
                message_type: dto.messageType,
            });
            
            // 2. Lấy thông tin Conversation và người nhận. Cần load relations để lấy thông tin User
            const conversation = await this.chatService.conversationRepository.findOne({
                where: { conversation_id: dto.conversationId },
                relations: ['initiator', 'recipient'] // Yêu cầu load relations
            });

            if (!conversation) {
                throw new NotFoundException('Conversation not found during message sending.');
            }

            // 3. Chuẩn bị payload (Kiểm tra null khi truy cập relations)
            // Lấy thông tin người gửi:
            const senderRelation = conversation.initiator_id === senderId 
                ? conversation.initiator 
                : conversation.recipient;
            
            // Kiểm tra senderRelation có bị null/undefined không (do TypeORM relations có thể lazy-loaded hoặc null)
            const senderUsername = senderRelation?.full_name ?? 'System User';
            
            const payload: MessagePayload = {
                message_id: message.message_id,
                conversation_id: message.conversation_id,
                sender_id: message.sender_id,
                content: message.content,
                message_type: message.message_type,
                sent_at: message.sent_at,
                sender: { 
                    userId: senderId, 
                    username: senderUsername 
                },
            };

            // 4. Phát sự kiện cho người gửi (để hiển thị ngay lập tức)
            client.emit('message_sent', payload); 
            
            // 5. Phát sự kiện cho người nhận (nếu online)
            const recipientSockets = await this.getRecipientSockets(conversation, senderId);
            recipientSockets.forEach(socketId => {
                this.server.to(socketId).emit('new_message', payload);
            });
            
        } catch (error) {
            client.emit('error_message', {
                conversationId: dto.conversationId,
                // Trả về thông báo lỗi an toàn hơn
                error: `Lỗi khi gửi tin nhắn: ${(error as Error).message || 'Lỗi không xác định'}`,
            });
        }
    }
    
    // --- Xử lý sự kiện đọc tin nhắn (mark_read) ---
    
    @UsePipes(new ValidationPipe())
    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @MessageBody() dto: WsMarkReadDto,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const userId = (client as any).userId;

        try {
            // 1. Cập nhật trạng thái đọc trong DB
            await this.chatService.markConversationAsRead(userId, dto.conversationId);
            
            // 2. Lấy Conversation để biết người kia là ai
            const conversation = await this.chatService.conversationRepository.findOne({
                where: { conversation_id: dto.conversationId }
            });
            
            if (!conversation) {
                // Nếu không tìm thấy, log lỗi nhưng vẫn báo thành công cho client gửi
                // Hoặc throw NotFoundException để Catch block xử lý
                throw new NotFoundException('Conversation not found during read process.');
            }

            // 3. Phát sự kiện cho người khác trong cuộc trò chuyện (để đồng bộ "Đã đọc")
            const recipientSockets = await this.getRecipientSockets(conversation, userId);
            
            recipientSockets.forEach(socketId => {
                this.server.to(socketId).emit('conversation_read', {
                    conversationId: dto.conversationId,
                    readerId: userId,
                    readAt: new Date().toISOString(),
                });
            });
            
            client.emit('read_sync_success', { conversationId: dto.conversationId });
            
        } catch (error) {
            client.emit('error_read', {
                conversationId: dto.conversationId,
                error: `Lỗi khi đánh dấu đã đọc: ${(error as Error).message || 'Lỗi không xác định'}`,
            });
        }
    }
}