import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { TestNotificationDto } from './dto/test-notification.dto';

@Controller('notification') // Đặt route gốc là /notification
export class NotificationController {
  
  // Tiêm (inject) NotificationService
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Endpoint để test gửi thông báo
   */
  @Post('test-send')
  async testSendNotification(
    @Body(new ValidationPipe()) body: TestNotificationDto,
  ) {
    try {
      const response = await this.notificationService.sendToDevice(
        body.token,
        body.title || '🔔 Test Title (ShareIn)', // Tiêu đề mặc định
        body.body || 'Đây là thông báo test từ NestJS cho dự án ShareIn.', // Body mặc định
        { testData: 'dayLaDataPayload123' }, // Gửi kèm data (tùy chọn)
      );
      
      return {
        status: 'success',
        message: 'Test notification sent!',
        response: response,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to send notification',
        error: error.message,
      };
    }
  }
}