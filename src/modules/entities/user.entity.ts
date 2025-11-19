import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Post } from './post.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';
import { Rating } from './rating.entity';
import { UserInterest } from './user-interest.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Index({ unique: true })
  @Column({ length: 128 })
  firebase_uid: string; // <-- Cột để liên kết với Firebase Auth

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ length: 100 })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ length: 255, nullable: true })
  school_name: string;

  @Column({ length: 255, nullable: true })
  dormitory: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'int', nullable: true })
  academic_year: number;

  @Column({ type: 'int', default: 0 })
  reputation_score: number;

  @Column({ type: 'int', default: 0 })
  total_votes_up: number;

  @Column({ type: 'int', default: 0 })
  total_votes_down: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // --- Quan hệ ---

  @ManyToMany(() => User, (user) => user.blockedBy)
  @JoinTable({
    name: 'user_blocks', // Tên bảng phụ
    joinColumn: {
      name: 'blocker_id',
      referencedColumnName: 'user_id',
    },
    inverseJoinColumn: {
      name: 'blocked_id',
      referencedColumnName: 'user_id',
    },
  })
  blockedUsers: User[];

  // Danh sách những người ĐÃ chặn user này
  @ManyToMany(() => User, (user) => user.blockedUsers)
  blockedBy: User[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Conversation, (convo) => convo.initiator)
  conversations_initiated: Conversation[];

  @OneToMany(() => Conversation, (convo) => convo.recipient)
  conversations_as_recipient: Conversation[];

  @OneToMany(() => Message, (message) => message.sender)
  messages_sent: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => UserInterest, (interest) => interest.user)
  user_interests: UserInterest[];

  @OneToMany(() => Rating, (rating) => rating.rater)
  ratings_given: Rating[];

  @OneToMany(() => Rating, (rating) => rating.rated_user)
  ratings_received: Rating[];
}