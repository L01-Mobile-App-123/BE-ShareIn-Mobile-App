import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('post_likes')
@Unique(['user_id', 'post_id']) // Mỗi user chỉ like 1 lần cho mỗi post
export class PostLike {
  @PrimaryGeneratedColumn('uuid')
  like_id: string;

  @Index()
  @Column('uuid')
  user_id: string;

  @Index()
  @Column('uuid')
  post_id: string;

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
