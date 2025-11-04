import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class GetUserDto {
  @ApiProperty({ description: 'ID duy nhất của người dùng (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @Expose()
  user_id: string;

  @ApiProperty({ description: 'Địa chỉ email', example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A' })
  @Expose()
  full_name: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0901234567', nullable: true })
  @Expose()
  phone_number: string | null;

  @ApiProperty({ description: 'URL ảnh đại diện', example: 'https://example.com/avatar.jpg', nullable: true })
  @Expose()
  avatar_url: string | null;

  @ApiProperty({ description: 'Tên trường học', example: 'Đại học Bách Khoa', nullable: true })
  @Expose()
  school_name: string | null;

  @ApiProperty({ description: 'Khu ký túc xá', example: 'KTX Khu A', nullable: true })
  @Expose()
  dormitory: string | null;

  @ApiProperty({ description: 'Ngày sinh (YYYY-MM-DD)', example: '2000-01-01', type: String, format: 'date', nullable: true })
  @Expose()
  date_of_birth: Date | null;

  @ApiProperty({ description: 'Năm học hiện tại', example: 3, nullable: true })
  @Expose()
  academic_year: number | null;

  @ApiProperty({ description: 'Điểm uy tín (Reputation Score)', example: 15 })
  @Expose()
  reputation_score: number;

  @ApiProperty({ description: 'Thời gian tạo tài khoản', example: '2023-10-27T10:00:00.000Z' })
  @Expose()
  created_at: Date;
}