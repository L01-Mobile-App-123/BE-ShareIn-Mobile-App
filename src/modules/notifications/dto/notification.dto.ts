import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'ID thông báo',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  notification_id: string;

  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'Có bài đăng mới'
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung thông báo',
    example: 'Có một bài đăng mới trong danh mục bạn quan tâm'
  })
  content: string;

  @ApiProperty({
    description: 'Loại thông báo',
    example: 'NEW_POST_IN_INTEREST'
  })
  notification_type: string;

  @ApiProperty({
    description: 'ID bài đăng liên quan (nếu có)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true
  })
  post_id?: string;

  @ApiProperty({
    description: 'ID danh mục liên quan (nếu có)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    nullable: true
  })
  category_id?: string;

  @ApiProperty({
    description: 'Đã đọc chưa',
    example: false
  })
  is_read: boolean;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2025-12-11T12:00:00Z'
  })
  created_at: Date;
}

export class PaginatedNotificationsDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: 'Danh sách thông báo'
  })
  data: NotificationResponseDto[];

  @ApiProperty({
    example: 1
  })
  page: number;

  @ApiProperty({
    example: 20
  })
  limit: number;

  @ApiProperty({
    example: 50
  })
  total: number;

  @ApiProperty({
    example: 3
  })
  totalPages: number;

  @ApiProperty({
    example: true
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: false
  })
  hasPreviousPage: boolean;
}

export class MarkNotificationAsReadDto {
  @ApiProperty({
    description: 'Đánh dấu đã đọc',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  is_read?: boolean = true;
}

export class MarkAllNotificationsAsReadDto {
  @ApiProperty({
    description: 'Đánh dấu tất cả đã đọc',
    example: true
  })
  @IsBoolean()
  is_read: boolean = true;
}
