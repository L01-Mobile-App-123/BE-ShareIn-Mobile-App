import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from './post.entity';
import { UserInterest } from './user-interest.entity';
import { CategoryKeyword } from './category-keyword.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  category_id: string;

  @Column({ length: 100 })
  category_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  icon_url: string;

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];

  @OneToMany(() => UserInterest, (interest) => interest.category)
  user_interests: UserInterest[];

  // CẬP NHẬT: Xóa 'keywords' (simple-array) và thay bằng quan hệ 1:N
  @OneToMany(() => CategoryKeyword, (keyword) => keyword.category)
  keywords: CategoryKeyword[];
}