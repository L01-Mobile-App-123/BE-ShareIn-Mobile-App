import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { MessageType } from '../../common/enums/message-type.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  message_id: string;

  @Index()
  @Column('uuid')
  conversation_id: string;

  @Index()
  @Column('uuid')
  sender_id: string;

  @Column('text')
  content: string;
  
  @Column({ type: 'text', nullable: true })
  last_message_content: string | null;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  message_type: MessageType;

  @CreateDateColumn({ name: 'sent_at' })
  sent_at: Date;

  // --- Quan hệ ---

  @ManyToOne(() => Conversation, (convo) => convo.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, (user) => user.messages_sent, { 
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}