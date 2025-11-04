import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
// CẬP NHẬT: Đổi tên index
@Index(['initiator_id', 'recipient_id'], { unique: true }) // Đảm bảo hội thoại là duy nhất
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  conversation_id: string;

  @Index()
  @Column('uuid')
  initiator_id: string;

  @Index()
  @Column('uuid')
  recipient_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_message_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // --- Quan hệ ---

  @ManyToOne(() => User, (user) => user.conversations_initiated, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'initiator_id' })
  initiator: User;

  @ManyToOne(() => User, (user) => user.conversations_as_recipient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}