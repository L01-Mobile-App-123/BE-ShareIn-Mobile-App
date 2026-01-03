import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Notification } from './notification.entity';
import { Conversation } from './conversation.entity';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';
import { PostStatus } from '@common/enums/post-status.enum';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  post_id: string;

  @Index()
  @Column('uuid')
  user_id: string;

  @Index()
  @Column('uuid')
  category_id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @Column({
    type: 'enum',
    enum: PostTransactionType,
    default: PostTransactionType.SELL,
  })
  transaction_type: PostTransactionType;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.POSTED,
  })
  status: PostStatus;

  @Column({
    type: 'json',
    nullable: true,
  })
  image_urls: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // --- Quan hệ ---

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.posts, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Notification, (notification) => notification.post)
  notifications: Notification[];

  @OneToMany(() => Conversation, (conversation) => conversation.post)
  conversations: Conversation[];
}