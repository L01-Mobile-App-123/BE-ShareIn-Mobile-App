import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, IsArray, ArrayMaxSize, ArrayMinSize, IsUrl } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'ID của người được đánh giá' })
  @IsUUID()
  @IsNotEmpty()
  rated_user_id: string;

  @ApiProperty({ description: 'Điểm đánh giá từ 1-5 sao', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating_score: number; // Thay đổi từ is_positive

  @ApiPropertyOptional({ description: 'Nhận xét' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Danh sách URL ảnh chứng minh (tối đa 10)' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  proof_image_urls?: string[];
}

export class UpdateRatingDto {
  @ApiPropertyOptional({ description: 'Điểm đánh giá từ 1-5 sao', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating_score?: number; // Thay đổi từ is_positive

  @ApiPropertyOptional({ description: 'Nhận xét' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Danh sách URL ảnh chứng minh (ghi đè toàn bộ)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  proof_image_urls?: string[];
}

export class UserRatingStatsDto {
  @ApiProperty({ description: 'Tổng số đánh giá' })
  total_ratings: number;

  @ApiProperty({ description: 'Điểm trung bình (1-5)', example: 4.5 })
  average_score: number;

  @ApiProperty({ description: 'Số lượng đánh giá 5 sao' })
  five_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 4 sao' })
  four_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 3 sao' })
  three_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 2 sao' })
  two_star_count: number;

  @ApiProperty({ description: 'Số lượng đánh giá 1 sao' })
  one_star_count: number;
}

export class RatingResponseDto {
  @ApiProperty()
  rating_id: string;

  @ApiProperty()
  rater_id: string;

  @ApiProperty()
  rated_user_id: string;

  @ApiProperty({ description: 'Điểm đánh giá (1-5)' })
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