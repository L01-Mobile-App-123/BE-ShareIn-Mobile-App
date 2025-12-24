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

@Entity('post_saves')
@Unique(['user_id', 'post_id']) // Mỗi user chỉ save 1 lần cho mỗi post
export class PostSave {
  @PrimaryGeneratedColumn('uuid')
  save_id: string;

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
