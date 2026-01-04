import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID của người được đánh giá' })
  // @IsUUID()
  @IsNotEmpty()
  rated_user_id: string;

  @ApiProperty({ description: 'Điểm đánh giá thang 1-100', minimum: 1, maximum: 100, example: 95 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  rating_score: number; // Thay đổi từ is_positive

  @ApiPropertyOptional({ description: 'Nhận xét' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateRatingDto {
  @ApiPropertyOptional({ description: 'Điểm đánh giá thang 1-100', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  rating_score?: number; // Thay đổi từ is_positive

  @ApiPropertyOptional({ description: 'Nhận xét' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class UserRatingStatsDto {
  @ApiProperty({ description: 'Tổng số đánh giá' })
  total_ratings: number;

  @ApiProperty({ description: 'Điểm trung bình (1-100)', example: 88.5 })
  average_score: number;

  @ApiProperty({ description: 'Số lượng đánh giá trong khoảng 81-100' })
  range_81_100_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá trong khoảng 61-80' })
  range_61_80_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá trong khoảng 41-60' })
  range_41_60_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá trong khoảng 21-40' })
  range_21_40_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá trong khoảng 1-20' })
  range_1_20_count: number;
}

export class RatingResponseDto {
  @ApiProperty()
  rating_id: string;

  @ApiProperty()
  rater_id: string;

  @ApiProperty()
  rated_user_id: string;

  @ApiProperty({ description: 'Điểm đánh giá (1-100)' })
  rating_score: number; // Thay đổi từ is_positive

  @ApiProperty()
  comment: string;

  @ApiProperty({ type: [String] })
  proof_image_urls: string[];

  @ApiProperty()
  created_at: Date;
}

export class RatingImagesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Danh sách file ảnh (tối đa 10)', isArray: true })
  files: any[];
}