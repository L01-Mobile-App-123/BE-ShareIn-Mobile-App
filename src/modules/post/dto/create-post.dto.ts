import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsArray, IsUUID, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';
import { PostStatus } from '@common/enums/post-status.enum';

export class CreatePostDto {
  @ApiProperty({ description: 'ID danh mục (Category ID)', example: '048de9e8-f159-496d-ac14-cb699af30bb1' })
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

  @ApiPropertyOptional({ description: 'Trạng thái bài đăng khi tạo', enum: PostStatus, example: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

}