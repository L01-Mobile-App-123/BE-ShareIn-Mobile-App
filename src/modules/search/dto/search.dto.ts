import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';

export enum SortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export enum TimeRange {
  LAST_7_DAYS = '7days',
  LAST_30_DAYS = '30days',
  ALL_TIME = 'all',
}

export class SearchFilterDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm', example: 'Giáo trình' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ enum: PostTransactionType, description: 'Loại giao dịch' })
  @IsEnum(PostTransactionType)
  @IsOptional()
  transactionType?: PostTransactionType;

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TimeRange, description: 'Khoảng thời gian' })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange;

  @ApiPropertyOptional({ enum: SortBy, description: 'Sắp xếp theo' })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @ApiPropertyOptional({ description: 'Giá thấp nhất', example: 10000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá cao nhất', example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

export class SubscribeNotificationDto {
  @ApiProperty({ description: 'ID danh mục muốn nhận thông báo' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Từ khóa muốn nhận thông báo' })
  @IsString()
  @IsOptional()
  keyword?: string;
}