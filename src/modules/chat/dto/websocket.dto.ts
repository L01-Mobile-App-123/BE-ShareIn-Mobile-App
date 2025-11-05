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