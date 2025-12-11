import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RepostDto {
  @ApiProperty({
    description: 'ID bài đăng cũ muốn sao chép',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  original_post_id: string;

  @ApiProperty({
    description: 'Thay đổi tiêu đề (nếu muốn, nếu không sẽ dùng tiêu đề cũ)',
    example: 'Sách C++ - Thanh lý',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Thay đổi mô tả (nếu muốn, nếu không sẽ dùng mô tả cũ)',
    example: 'Sách còn rất mới, chỉ xem qua vài lần',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}
