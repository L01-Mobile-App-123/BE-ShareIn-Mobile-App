import { Injectable } from '@nestjs/common';
import { MessageResponseDto, GetConversationsResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatMapperService {
  mapUserToSimple(user: any) {
    if (!user) return null;
    return {
      userId: user.user_id || user.userId || user.id,
      username: user.full_name || user.username || user.name,
    };
  }

  mapMessageToDto(message: any): MessageResponseDto {
    return {
      message_id: message.message_id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type,
      sent_at: message.sent_at,
      sender: this.mapUserToSimple(message.sender) || undefined,
    } as MessageResponseDto;
  }

  mapConversationToDto(convo: any, currentUserId: string): GetConversationsResponseDto {
    const otherUser = convo.initiator_id === currentUserId ? convo.recipient : convo.initiator;
    return {
      conversation_id: convo.conversation_id,
      post_id: convo.post_id,
      last_message_at: convo.last_message_at,
      last_message_content: convo.last_message_content ?? null,
      unread_count: convo.unread_count ?? 0,
      other_user: this.mapUserToSimple(otherUser),
      is_active: typeof convo.is_active === 'boolean' ? convo.is_active : true,
    } as GetConversationsResponseDto;
  }
}
