import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';

export enum PostFeedSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  MOST_LIKED = 'most_liked',
  MOST_VIEWED = 'most_viewed',
}

export enum PostFeedTimeRange {
  LAST_7_DAYS = '7days',
  LAST_30_DAYS = '30days',
  ALL_TIME = 'all',
}

export class GetPostsQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo ID danh mục',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Loại giao dịch',
    enum: PostTransactionType,
    enumName: 'PostTransactionType',
  })
  @IsEnum(PostTransactionType)
  @IsOptional()
  transaction_type?: PostTransactionType;

  @ApiPropertyOptional({
    description: 'Chỉ hiển thị bài còn hiện (is_available). Mặc định: true',
    default: true,
  })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return value;
  })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean = true;

  @ApiPropertyOptional({ description: 'Giá thấp nhất', example: 10000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  min_price?: number;

  @ApiPropertyOptional({ description: 'Giá cao nhất', example: 500000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo khoảng thời gian tạo bài',
    enum: PostFeedTimeRange,
    enumName: 'PostFeedTimeRange',
    example: PostFeedTimeRange.LAST_7_DAYS,
  })
  @IsEnum(PostFeedTimeRange)
  @IsOptional()
  time_range?: PostFeedTimeRange;

  @ApiPropertyOptional({
    description: 'Sắp xếp newsfeed',
    enum: PostFeedSortBy,
    enumName: 'PostFeedSortBy',
    example: PostFeedSortBy.NEWEST,
  })
  @IsEnum(PostFeedSortBy)
  @IsOptional()
  sort_by?: PostFeedSortBy;

  @ApiPropertyOptional({ description: 'Trang (bắt đầu từ 1)', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số phần tử mỗi trang', default: 20, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
