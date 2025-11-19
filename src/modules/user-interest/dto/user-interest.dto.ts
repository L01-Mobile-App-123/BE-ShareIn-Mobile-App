import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// --- DTO cho từng item trong danh sách gửi lên ---
export class InterestItemDto {
  @ApiProperty({ 
    description: 'ID của danh mục quan tâm',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ 
    description: 'Danh sách từ khóa (nếu có)',
    example: ['giáo trình', 'truyện tranh'],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

// --- DTO Request chính ---
export class UpdateUserInterestsDto {
  @ApiProperty({ 
    description: 'Danh sách các danh mục và từ khóa người dùng chọn. Gửi danh sách rỗng để xóa hết.',
    type: [InterestItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestItemDto)
  interests: InterestItemDto[];
}

// --- DTO Response ---
export class CategorySimpleDto {
  @ApiProperty()
  category_id: string;

  @ApiProperty()
  category_name: string;
}

export class UserInterestResponseDto {
  @ApiProperty()
  interest_id: string;

  @ApiProperty({ type: CategorySimpleDto })
  category: CategorySimpleDto;

  @ApiProperty({ type: [String], nullable: true })
  keywords: string[];

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;
}