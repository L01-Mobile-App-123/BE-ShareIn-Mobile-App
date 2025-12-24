import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CloudinaryModule} from '@modules/cloudinary/cloudinary.module';
import { Post } from '@modules/entities/post.entity';
import { PostLike } from '@modules/entities/post-like.entity';
import { PostSave } from '@modules/entities/post-save.entity';
import { Rating } from '@modules/entities/rating.entity';
import { User } from '@modules/entities/user.entity';
import { UsersModule } from '@modules/users/users.module';
import { CategoryModule } from '@modules/category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike, PostSave, Rating, User]), CloudinaryModule, UsersModule, CategoryModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
