import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Category } from './category.entity'; 
import { NotificationType } from './enums/notification-type.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  notification_id: string;

  @Index()
  @Column('uuid')
  user_id: string;

  @Index()
  @Column('uuid', { nullable: true }) // Liên quan đến 1 bài post cụ thể
  post_id: string;

  @Index()
  @Column('uuid', { nullable: true }) // Liên quan đến 1 danh mục (vd: post mới trong mục)
  category_id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  notification_type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, (post) => post.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Category, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}