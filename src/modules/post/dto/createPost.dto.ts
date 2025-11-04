import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsArray, IsUUID, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum'; // Import enum của bạn

export class CreatePostDto {
  @ApiProperty({ description: 'ID danh mục (Category ID)', example: 'f3a4b5c6-d7e8-9012-3456-7890abcdef12' })
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ description: 'Tiêu đề bài đăng', example: 'Thanh lý sách giáo trình C++ cũ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết món đồ' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ 
    description: 'Giá bán (chỉ bắt buộc nếu transaction_type là SELL)', 
    example: 50.00, 
    type: Number 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Vị trí giao dịch/món đồ', example: 'KTX Khu B, Bách Khoa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ 
    description: 'Loại giao dịch', 
    enum: PostTransactionType, 
    default: PostTransactionType.SELL,
    example: PostTransactionType.SELL 
  })
  @IsEnum(PostTransactionType)
  @IsNotEmpty()
  transaction_type: PostTransactionType;

}