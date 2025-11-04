import { IsString, IsOptional, IsDateString, IsInt, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A (Đã cập nhật)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  full_name?: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0987654321', required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Tên trường học mới', example: 'Đại học Quốc gia', required: false })
  @IsOptional()
  @IsString()
  school_name?: string;

  @ApiProperty({ description: 'Khu ký túc xá mới', example: 'KTX Khu B', required: false })
  @IsOptional()
  @IsString()
  dormitory?: string;

  @ApiProperty({ description: 'Ngày sinh (YYYY-MM-DD)', example: '2001-05-15', type: String, format: 'date', required: false })
  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @ApiProperty({ description: 'Năm học hiện tại', example: 4, required: false })
  @IsOptional()
  @IsInt()
  academic_year?: number;
}