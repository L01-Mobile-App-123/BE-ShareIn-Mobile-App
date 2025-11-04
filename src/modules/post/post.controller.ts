import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuickPostService } from './post.service';
import { CreateQuickPostDto } from './dto/createPost.dto';

@Controller('quick-post')
export class QuickPostController {
  constructor(private readonly service: QuickPostService) {}

  @Post()
  create(@Body() dto: CreateQuickPostDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
