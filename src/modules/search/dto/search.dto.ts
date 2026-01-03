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
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tìm trong title/description)',
    example: 'Giáo trình',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    enum: PostTransactionType,
    enumName: 'PostTransactionType',
    description: 'Loại giao dịch',
    example: PostTransactionType.SELL,
  })
  @IsEnum(PostTransactionType)
  @IsOptional()
  transactionType?: PostTransactionType;

  @ApiPropertyOptional({
    description: 'ID danh mục',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: TimeRange,
    enumName: 'TimeRange',
    description: 'Khoảng thời gian lọc theo created_at',
    example: TimeRange.LAST_7_DAYS,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange;

  @ApiPropertyOptional({
    enum: SortBy,
    enumName: 'SortBy',
    description: 'Sắp xếp theo',
    example: SortBy.NEWEST,
  })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @ApiPropertyOptional({ description: 'Giá thấp nhất', example: 10000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá cao nhất', example: 500000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Số trang (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số phần tử mỗi trang',
    default: 20,
    minimum: 1,
    example: 20,
  })
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