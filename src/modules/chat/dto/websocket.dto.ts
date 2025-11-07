import { IsUUID, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { MessageType } from '@common/enums/message-type.enum';
import { Transform } from 'class-transformer';

// DTO cho sự kiện gửi tin nhắn qua WebSocket
export class WsCreateMessageDto {
    @IsUUID()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @Transform(({ value }) => value?.toLowerCase())
    @IsEnum(MessageType)
    @IsOptional()
    messageType: MessageType = MessageType.TEXT;
}

// DTO cho sự kiện đánh dấu đã đọc qua WebSocket
export class WsMarkReadDto {
    @IsUUID()
    @IsNotEmpty()
    conversationId: string;
}

// Payload trả về khi có tin nhắn mới
export class MessagePayload {
    message_id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: MessageType;
    sent_at: Date;
    sender: {
        userId: string;
        username: string;
    };
}

// Payload trả về khi có thông báo đã đọc
export class ReadReceiptPayload {
    conversation_id: string;
    user_id: string;
    read_at: Date;
}

// Payload trả về khi user bắt đầu typing
export class TypingPayload {
    conversation_id: string;
    user_id: string;
    username: string;
    is_typing: boolean;
}

// DTO cho sự kiện typing qua WebSocket
export class WsTypingDto {
    @IsUUID()
    @IsNotEmpty()
    conversationId: string;

    @IsNotEmpty()
    isTyping: boolean;
}

// Response payload chung cho WebSocket
export class WsResponsePayload<T = any> {
    event: string;
    data: T;
    timestamp: Date;
    success: boolean;
    message?: string;
}

// Error payload cho WebSocket
export class WsErrorPayload {
    event: string;
    error: string;
    message: string;
    timestamp: Date;
}