import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Post } from '@modules/entities/post.entity';
import { UsersModule } from '@modules/users/users.module';
import { SearchHistory } from '@modules/entities/search-history.entity';
import { PostLike } from '@modules/entities/post-like.entity';
import { PostSave } from '@modules/entities/post-save.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, SearchHistory, PostLike, PostSave]), UsersModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
