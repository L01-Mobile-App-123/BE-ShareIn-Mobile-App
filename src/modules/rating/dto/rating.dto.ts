import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose, Type } from 'class-transformer';

// --- Helper DTOs (Phải đặt lên trước để RatingResponseDto có thể tham chiếu) ---

export class RaterInfoDto {
  @ApiProperty()
  @Expose()
  user_id: string;

  @ApiProperty()
  @Expose()
  full_name: string;

  @ApiProperty()
  @Expose()
  avatar_url?: string;
}

export class RatedUserInfoDto {
  @ApiProperty()
  @Expose()
  user_id: string;

  @ApiProperty()
  @Expose()
  full_name: string;

  @ApiProperty()
  @Expose()
  avatar_url?: string;
}

// --- Main DTOs ---

export class CreateRatingDto {
  @ApiProperty({ 
    description: 'ID người được đánh giá',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  rated_user_id: string;

  @ApiProperty({ 
    description: 'ID bài đăng liên quan (tùy chọn)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  post_id?: string;

  @ApiProperty({ 
    description: 'Điểm đánh giá (1-5 sao)', 
    minimum: 1, 
    maximum: 5,
    example: 5
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating_score: number;

  @ApiProperty({ 
    description: 'Nhận xét chi tiết (tùy chọn, tối đa 500 ký tự)',
    example: 'Người bán rất nhiệt tình và sản phẩm đúng như mô tả.',
    required: false,
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}

export class RatingResponseDto {
  @ApiProperty({ description: 'ID đánh giá' })
  @Expose()
  rating_id: string;

  @ApiProperty({ description: 'ID người đánh giá' })
  @Expose()
  rater_user_id: string;

  @ApiProperty({ description: 'Thông tin người đánh giá' })
  @Expose()
  @Type(() => RaterInfoDto)
  rater?: RaterInfoDto;

  @ApiProperty({ description: 'ID người được đánh giá' })
  @Expose()
  rated_user_id: string;

  @ApiProperty({ description: 'Thông tin người được đánh giá' })
  @Expose()
  @Type(() => RatedUserInfoDto)
  rated_user?: RatedUserInfoDto;

  @ApiProperty({ description: 'ID bài đăng liên quan', required: false })
  @Expose()
  post_id?: string;

  @ApiProperty({ description: 'Điểm đánh giá (1-5)' })
  @Expose()
  rating_score: number;

  @ApiProperty({ description: 'Nhận xét', required: false })
  @Expose()
  comment?: string;

  @ApiProperty({ description: 'Thời gian tạo đánh giá' })
  @Expose()
  created_at: Date;
}

export class UserRatingStatsDto {
  @ApiProperty({ description: 'Điểm trung bình (1-5)', example: 4.5 })
  @Expose()
  average_rating: number;

  @ApiProperty({ description: 'Tổng số đánh giá', example: 127 })
  @Expose()
  total_ratings: number;

  @ApiProperty({ description: 'Số lượng đánh giá 5 sao', example: 80 })
  @Expose()
  five_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 4 sao', example: 30 })
  @Expose()
  four_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 3 sao', example: 10 })
  @Expose()
  three_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 2 sao', example: 5 })
  @Expose()
  two_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 1 sao', example: 2 })
  @Expose()
  one_star_count: number;

  @ApiProperty({ description: 'Phần trăm đánh giá tích cực (4-5 sao)', example: 86.61 })
  @Expose()
  positive_percentage: number;
}