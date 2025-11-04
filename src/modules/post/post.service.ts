import { Injectable } from '@nestjs/common';
import { CreateQuickPostDto } from './dto/createPost.dto';

export interface QuickPostEntity {
  id: string;
  title: string;
  description?: string;
  category?: string;
  createdAt: string;
}

@Injectable()
export class QuickPostService {
  private items: QuickPostEntity[] = [];

  create(dto: CreateQuickPostDto) {
    const item: QuickPostEntity = {
      id: Date.now().toString(),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      createdAt: new Date().toISOString(),
    };
    this.items.push(item);
    return item;
  }

  findOne(id: string) {
    return this.items.find((i) => i.id === id) || null;
  }
}
