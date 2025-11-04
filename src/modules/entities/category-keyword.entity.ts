import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('category_keywords')
@Index(['category_id', 'keyword'], { unique: true }) // Đảm bảo keyword là duy nhất trong 1 category
export class CategoryKeyword {
  @PrimaryGeneratedColumn('uuid')
  keyword_id: string;

  @Index()
  @Column('uuid')
  category_id: string;

  @Column({ length: 100 })
  keyword: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---

  @ManyToOne(() => Category, (category) => category.keywords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}