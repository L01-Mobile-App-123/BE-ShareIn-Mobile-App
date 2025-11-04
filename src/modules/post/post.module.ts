import { Module } from '@nestjs/common';
import { QuickPostController } from './post.controller';
import { QuickPostService } from './post.service';

@Module({
  controllers: [QuickPostController],
  providers: [QuickPostService],
})
export class PostModule {}
