import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: 'success' })
  message: string;

  @ApiProperty({ example: { id: 1, name: 'John Doe' } })
  data?: T;

  constructor(message: string, data?: T) {
    this.message = message;
    this.data = data;
  }
}
