import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LikePostDto {
  @ApiProperty({ description: 'ID của bài đăng cần like', example: 'uuid' })
  @IsUUID()
  post_id: string;
}

export class SavePostDto {
  @ApiProperty({ description: 'ID của bài đăng cần save', example: 'uuid' })
  @IsUUID()
  post_id: string;
}

export class SavedPostResponseDto {
  @ApiProperty({ description: 'ID của bài đăng' })
  post_id: string;

  @ApiProperty({ description: 'Tiêu đề bài đăng' })
  title: string;

  @ApiProperty({ description: 'Mô tả' })
  description: string;

  @ApiProperty({ description: 'Giá' })
  price: number;

  @ApiProperty({ description: 'Địa điểm' })
  location: string;

  @ApiProperty({ description: 'Loại giao dịch' })
  transaction_type: string;

  @ApiProperty({ description: 'Danh sách URL ảnh' })
  image_urls: string[];

  @ApiProperty({ description: 'Số lượt xem' })
  view_count: number;

  @ApiProperty({ description: 'Số người like' })
  like_count: number;

  @ApiProperty({ description: 'Điểm đánh giá trung bình của người đăng bài' })
  poster_rating: number;

  @ApiProperty({ description: 'Thông tin người đăng' })
  user: {
    user_id: string;
    full_name: string;
    avatar_url: string;
  };

  @ApiPropertyOptional({ description: 'Thông tin category' })
  category?: {
    category_id: string;
    name: string;
  } | null;

  @ApiProperty({ description: 'Ngày tạo' })
  created_at: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  updated_at: Date;
}
