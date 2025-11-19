import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['initiator_id', 'recipient_id'], { unique: true }) 
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  conversation_id: string;
  
  @Index()
  @Column('uuid')
  initiator_id: string;

  @Index()
  @Column('uuid')
  recipient_id: string;

  @Column({ type: 'timestamp', nullable: true, default: null }) 
  initiator_last_read: Date | null; 

  @Column({ type: 'timestamp', nullable: true, default: null }) 
  recipient_last_read: Date | null; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn({ name: 'last_message_at', type: 'timestamp' }) 
  last_message_at: Date;

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