import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Rating } from '@modules/entities/rating.entity';
import { User } from '@modules/entities/user.entity';
import { Post } from '@modules/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, User, Post])],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}