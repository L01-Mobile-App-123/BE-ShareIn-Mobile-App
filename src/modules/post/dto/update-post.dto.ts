import { IsOptional, IsString, IsNumber, IsEnum, IsUUID, MaxLength, Min, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';
import { PostStatus } from '@common/enums/post-status.enum';

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'ID danh mục mới', example: 'g7h8i9j0-k1l2-3456-7890-abcdef123456' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Tiêu đề bài đăng', example: 'Thanh lý sách giáo trình C++ (Mới)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết món đồ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Giá bán', example: 45.00, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Vị trí giao dịch/món đồ', example: 'KTX Khu C, Bách Khoa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ 
    description: 'Loại giao dịch mới', 
    enum: PostTransactionType, 
    example: PostTransactionType.EXCHANGE 
  })
  @IsOptional()
  @IsEnum(PostTransactionType)
  transaction_type?: PostTransactionType;

  @ApiPropertyOptional({ description: 'Trạng thái còn hàng (Ẩn/Hiện)', example: false })
  @IsOptional()
  is_available?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái bài đăng khi tạo', enum: PostStatus, example: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}