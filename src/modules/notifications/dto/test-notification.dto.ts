import { IsNotEmpty, IsString } from 'class-validator';

export class TestNotificationDto {
  @IsString()
  @IsNotEmpty()
  token: string; // Token của thiết bị sẽ nhận thông báo

  @IsString()
  title: string;

  @IsString()
  body: string;
}