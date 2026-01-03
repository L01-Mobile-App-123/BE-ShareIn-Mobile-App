import { ApiProperty } from '@nestjs/swagger';
import { GetPostDto } from '@modules/post/dto/get-post.dto';

export class SearchResponseDto {
  @ApiProperty({
    description: 'Danh sách bài đăng theo định dạng giống API posts',
    type: [GetPostDto],
  })
  items: GetPostDto[];

  @ApiProperty({ description: 'Tổng số kết quả phù hợp (không phân trang)' })
  total: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;

  @ApiProperty({ description: 'Số phần tử mỗi trang' })
  limit: number;

  @ApiProperty({ description: 'Có kết quả hay không' })
  has_results: boolean;
}

export class SearchApiResponseDto {
  @ApiProperty({ example: 'Tìm kiếm thành công' })
  message: string;

  @ApiProperty({ type: SearchResponseDto })
  data: SearchResponseDto;
}

export class SearchSuggestionsApiResponseDto {
  @ApiProperty({ example: 'Lấy gợi ý thành công' })
  message: string;

  @ApiProperty({
    description: 'Danh sách gợi ý từ khóa (autocomplete)',
    type: [String],
    example: ['Giáo trình', 'Giáo trình đại học', 'Giáo trình toán'],
  })
  data: string[];
}

export class SearchHistoryApiResponseDto {
  @ApiProperty({ example: 'Lấy lịch sử tìm kiếm thành công' })
  message: string;

  @ApiProperty({
    description: 'Danh sách keyword đã tìm gần đây (mới nhất trước)',
    type: [String],
    example: ['Giáo trình', 'Laptop cũ', 'Bàn học'],
  })
  data: string[];
}
