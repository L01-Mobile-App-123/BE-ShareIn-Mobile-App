import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MessageType } from '@common/enums/message-type.enum';

// --- Request DTOs ---

export class FindOrCreateConversationDto {
  @ApiProperty({ 
    description: 'ID của người dùng muốn chat cùng',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsNotEmpty()
  recipient_id: string;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'ID cuộc trò chuyện' })
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @ApiProperty({ description: 'Nội dung tin nhắn', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  message_type: MessageType = MessageType.TEXT;
}

export class GetMessagesQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number;
}

// --- Response DTOs ---

export class UserSummaryDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty({ required: false })
  avatar_url?: string;
}

export class FindOrCreateConversationResponseDto {
  @ApiProperty()
  conversation_id: string;

  @ApiProperty()
  message: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message_id: string;

  @ApiProperty()
  conversation_id: string;

  @ApiProperty()
  sender_id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  message_type: MessageType;

  @ApiProperty()
  sent_at: Date;

  @ApiProperty({ type: UserSummaryDto })
  sender: UserSummaryDto;
}

export class GetConversationsResponseDto {
  @ApiProperty()
  conversation_id: string;

  @ApiProperty({ type: UserSummaryDto, description: 'Thông tin người chat cùng (đối phương)' })
  partner: UserSummaryDto;

  @ApiProperty({ description: 'Tin nhắn cuối cùng', required: false })
  last_message?: string;

  @ApiProperty({ description: 'Thời gian tin nhắn cuối cùng' })
  last_message_at: Date;

  @ApiProperty({ description: 'Số tin nhắn chưa đọc' })
  unread_count: number;
}

export class PaginatedMessagesResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  data: MessageResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class MarkAsReadResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class BlockUserDto {
  @ApiProperty({ description: 'ID của người dùng muốn chặn/bỏ chặn' })
  @IsUUID()
  @IsNotEmpty()
  target_user_id: string;
}

export class BlockUserResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}