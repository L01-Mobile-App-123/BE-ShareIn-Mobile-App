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

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  rating_id: string;

  @Index()
  @Column('uuid')
  rater_id: string;

  @Index()
  @Column('uuid')
  rated_user_id: string;

  @Column({ type: 'int' })
  rating_score: number; // 1-5 sao

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'json', nullable: true })
  proof_image_urls: string[];

  @CreateDateColumn()
  created_at: Date;

  // --- Quan hệ ---
  @ManyToOne(() => User, (user) => user.ratings_given, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @ManyToOne(() => User, (user) => user.ratings_received, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rated_user_id' })
  rated_user: User;
}