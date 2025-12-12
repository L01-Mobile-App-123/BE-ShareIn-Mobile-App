import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Messaging, type Message, type MulticastMessage } from 'firebase-admin/messaging';
import { FCM_MESSAGING } from '@firebase/firebase.constants';
import { Notification } from '@modules/entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(FCM_MESSAGING) private readonly messaging: Messaging,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
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

  /**
   * Lấy danh sách thông báo của user
   */
  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: skip,
    });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Đánh dấu tất cả thông báo của user đã đọc
   */
  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );

    return { affected: result.affected || 0 };
  }

  /**
   * Xóa một thông báo
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    await this.notificationRepository.remove(notification);
    return { message: 'Xóa thông báo thành công' };
  }

  /**
   * Tạo thông báo mới trong DB
   */
  async createNotification(
    userId: string,
    title: string,
    content: string,
    notificationType: string,
    postId?: string,
    categoryId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id: userId,
      title,
      content,
      notification_type: notificationType as any,
      post_id: postId,
      category_id: categoryId,
      is_read: false,
    });

    return this.notificationRepository.save(notification);
  }
  
}

