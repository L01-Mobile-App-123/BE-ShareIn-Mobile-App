// src/category/dto/category.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO đại diện cho cấu trúc Category được trả về cho client.
 */
export class CategoryDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'ID duy nhất của danh mục (UUID).',
  })
  category_id: string;

  @ApiProperty({
    example: 'Công nghệ thông tin',
    description: 'Tên của danh mục. Tối đa 100 ký tự.',
    maxLength: 100,
  })
  category_name: string;

  @ApiProperty({
    example: 'Bao gồm các bài viết và nội dung liên quan đến lập trình, AI, và an ninh mạng.',
    description: 'Mô tả chi tiết về danh mục.',
    nullable: true,
  })
  description: string | null;
}