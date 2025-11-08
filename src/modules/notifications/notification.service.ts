import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Messaging, type Message, type MulticastMessage } from 'firebase-admin/messaging';
import { FCM_MESSAGING } from '@firebase/firebase.constants';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(FCM_MESSAGING) private readonly messaging: Messaging,
  ) {}
  
  /**
   * Gửi thông báo đến một thiết bị cụ thể
   * @param deviceToken Token của thiết bị (lấy từ client)
   * @param title Tiêu đề thông báo
   * @param body Nội dung thông báo
   * @param data Dữ liệu tùy chọn (optional data payload)
   */
  async sendToDevice(
    deviceToken: string,
    title: string,
    body: string,
    data?: { [key: string]: string },
  ) {
    const payload: Message = {
      token: deviceToken,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      // Cấu hình cho Android
      android: {
        notification: {
          sound: 'default',
          // channelId: 'default_channel_id', // Bạn có thể cần tạo channel ở client
        },
      },
      // Cấu hình cho Apple
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await this.messaging.send(payload);
      this.logger.log(`Gửi thông báo thành công: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Lỗi khi gửi thông báo:', error);
      throw new Error(`Không thể gửi thông báo: ${error.message}`);
    }
  }

  /**
   * Gửi thông báo đến nhiều thiết bị
  /**
   * Gửi thông báo đến nhiều thiết bị
   * @param deviceTokens Mảng các token
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string,
  ) {
    const message: MulticastMessage = {
      tokens: deviceTokens,
      notification: { title, body },
    };

    try {
      const response = await this.messaging.sendEachForMulticast(message);
      this.logger.log(`Gửi multi-device thành công: ${response.successCount} messages`);
      return response;
    } catch (error) {
      this.logger.error('Lỗi khi gửi multi-device:', error);
      throw error;
    }
  }
  /**
   * Gửi thông báo đến một chủ đề (topic)
   * @param topic Tên chủ đề
   */
  async sendToTopic(topic: string, title: string, body: string) {
    const message: Message = {
      topic,
      notification: { title, body },
    };

    try {
      const response = await this.messaging.send(message);
      this.logger.log(`Gửi topic thành công: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Lỗi khi gửi topic:', error);
      throw error;
    }
  }
}
