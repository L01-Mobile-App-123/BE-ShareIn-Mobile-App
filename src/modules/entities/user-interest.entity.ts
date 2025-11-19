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
import { Category } from './category.entity';

@Entity('user_interests')
@Index(['user_id', 'category_id'], { unique: true })
export class UserInterest {
  @PrimaryGeneratedColumn('uuid')
  interest_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  category_id: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[]; 

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---

  @ManyToOne(() => User, (user) => user.user_interests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.user_interests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}