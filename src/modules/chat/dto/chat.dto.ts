import { IsUUID, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@common/enums/message-type.enum'; // Giả định path

// --- DTO dùng cho Request Body (Input) ---

export class FindOrCreateConversationDto {
  @ApiProperty({ description: 'ID của bài viết làm ngữ cảnh.', example: 'f8d3b4a6-9c4d-4e1f-8e5a-7f6d5c4b3a2e' })
  @IsUUID()
  @IsNotEmpty()
  post_id: string;

  @ApiProperty({ description: 'ID của người nhận tin nhắn (người đăng bài hoặc người quan tâm).', example: 'e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c' })
  @IsUUID()
  @IsNotEmpty()
  recipient_id: string;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'ID của Conversation mà tin nhắn thuộc về.', example: 'd19c3c5d-85d8-4a9f-a0c0-6d9b4b0e5b3e' })
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @ApiProperty({ description: 'Nội dung tin nhắn (text, hoặc URL file/image).', example: 'Phòng trọ còn không bạn?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: MessageType, description: 'Loại tin nhắn (TEXT, IMAGE, FILE).', example: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsNotEmpty()
  message_type: MessageType;
}

class SimpleUserDto {
  @ApiProperty({ example: 'e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c' })
  userId: string;
  
  @ApiProperty({ example: 'Nguyen Van A' })
  username: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'msg-4d9f-a0c0-6d9b4b0e5b3e' })
  message_id: string;

  @ApiProperty({ example: 'd19c3c5d-85d8-4a9f-a0c0-6d9b4b0e5b3e' })
  conversation_id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  sender_id: string;

  @ApiProperty({ example: 'Cảm ơn bạn đã quan tâm!' })
  content: string;
  
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  message_type: MessageType;

  @ApiProperty({ example: '2023-10-27T10:30:00.000Z' })
  sent_at: Date;

  @ApiProperty({ type: SimpleUserDto })
  sender?: SimpleUserDto;
}

export class GetConversationsResponseDto {
  @ApiProperty({ example: 'd19c3c5d-85d8-4a9f-a0c0-6d9b4b0e5b3e' })
  conversation_id: string;

  @ApiProperty({ example: 'post-id-cua-bai-viet' })
  post_id: string;
  
  @ApiProperty({ example: '2023-10-27T10:45:00.000Z' })
  last_message_at: Date;

  @ApiProperty({ example: 'Tin nhắn cuối cùng trong cuộc trò chuyện.' })
  last_message_content: string;

  @ApiProperty({ example: 3, description: 'Số tin nhắn chưa đọc của người dùng hiện tại.' })
  unread_count: number;

  @ApiProperty({ type: SimpleUserDto, description: 'Thông tin của người dùng còn lại trong Conversation.' })
  other_user: SimpleUserDto;
  
  @ApiProperty({ example: true, description: 'Trạng thái hoạt động (chưa bị ẩn/xóa mềm)' })
  is_active: boolean;
}

export class ConversationResponseDto extends GetConversationsResponseDto {}