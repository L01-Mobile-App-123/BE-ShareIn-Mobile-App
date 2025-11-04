import { ApiProperty } from '@nestjs/swagger'

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File ảnh để upload' })
  file: any;
}