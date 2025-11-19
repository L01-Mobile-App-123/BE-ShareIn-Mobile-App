import { Injectable } from '@nestjs/common';
import { Conversation } from '@modules/entities/conversation.entity';
import { Message } from '@modules/entities/message.entity';
import { GetConversationsResponseDto, MessageResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatMapperService {
  
  mapConversationToDto(conversation: Conversation, currentUserId: string): GetConversationsResponseDto {
    // Xác định đối phương là ai
    const partner = conversation.initiator_id === currentUserId 
      ? conversation.recipient 
      : conversation.initiator;

    // Lấy tin nhắn cuối cùng (nếu có, thường cần join hoặc query thêm, 
    // nhưng ở đây giả sử logic lấy list đã sort theo last_message_at)
    // Lưu ý: Entity Conversation hiện tại không lưu nội dung tin nhắn cuối, 
    // chỉ lưu thời gian. Nếu muốn hiển thị nội dung, cần query thêm Message mới nhất.
    // Ở đây tôi để placeholder hoặc null nếu bạn chưa implement logic lấy content.
    
    return {
      conversation_id: conversation.conversation_id,
      partner: {
        user_id: partner.user_id,
        full_name: partner.full_name,
        avatar_url: partner.avatar_url,
      },
      last_message: undefined, // Cần query thêm message mới nhất nếu muốn hiển thị preview
      last_message_at: conversation.last_message_at,
      unread_count: (conversation as any).unread_count || 0,
    };
  }

  mapMessageToDto(message: Message): MessageResponseDto {
    return {
      message_id: message.message_id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type,
      sent_at: message.sent_at,
      sender: {
        user_id: message.sender.user_id,
        full_name: message.sender.full_name,
        avatar_url: message.sender.avatar_url,
      },
    };
  }
}
