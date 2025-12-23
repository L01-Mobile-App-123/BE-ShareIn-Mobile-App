import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Rating } from '@modules/entities/rating.entity';
import { User } from '@modules/entities/user.entity';
import { Post } from '@modules/entities/post.entity';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, User, Post]), CloudinaryModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}