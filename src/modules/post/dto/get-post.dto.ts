import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';

// DTO cho User đơn giản
class SimpleUserDto {
  @ApiProperty()
  user_id: string;
  @ApiProperty()
  full_name: string;
  @ApiPropertyOptional()
  avatar_url: string;
}

// DTO cho Category đơn giản
class SimpleCategoryDto {
  @ApiProperty()
  category_id: string;
  @ApiProperty()
  name: string;
}

@Exclude()
export class GetPostDto {
  @ApiProperty()
  @Expose()
  post_id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiPropertyOptional()
  @Expose()
  location: string;

  @ApiProperty()
  @Expose()
  is_available: boolean;

  @ApiProperty({ description: 'Trạng thái bài đăng', enum: ['draft','posted'] })
  @Expose()
  status: string;

  @ApiProperty({ enum: PostTransactionType })
  @Expose()
  transaction_type: PostTransactionType;

  @ApiProperty()
  @Expose()
  view_count: number;

  @ApiProperty({ description: 'Tổng số like của bài đăng' })
  @Expose()
  like_count: number;

  @ApiProperty({ description: 'Người dùng hiện tại đã like bài này chưa' })
  @Expose()
  is_liked: boolean;

  @ApiProperty({ type: [String] })
  @Expose()
  image_urls: string[];

  @ApiProperty()
  @Expose()
  created_at: Date;

  // Quan hệ: Sử dụng Type để đệ quy DTO
  @ApiProperty({ type: SimpleUserDto })
  @Expose()
  @Type(() => SimpleUserDto)
  user: SimpleUserDto;
  
  @ApiProperty({ type: SimpleCategoryDto })
  @Expose()
  @Type(() => SimpleCategoryDto)
  category: SimpleCategoryDto | null;
}