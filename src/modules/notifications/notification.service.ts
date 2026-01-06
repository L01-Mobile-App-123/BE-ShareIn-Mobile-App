import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { type Messaging, type Message, type MulticastMessage } from 'firebase-admin/messaging';
import { FCM_MESSAGING } from '@firebase/firebase.constants';
import { Notification } from '@modules/entities/notification.entity';
import { UserInterest } from '@modules/entities/user-interest.entity';
import { NotificationType } from '@common/enums/notification-type.enum';
import { Post } from '@modules/entities/post.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(FCM_MESSAGING) private readonly messaging: Messaging,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserInterest)
    private readonly userInterestRepository: Repository<UserInterest>,
  ) {}

  private normalizeText(value: string): string {
    return (value || '').toLowerCase();
  }

  private keywordMatchesPost(interest: UserInterest, postText: string): boolean {
    const keywords = (interest.keywords || [])
      .map((k) => (k || '').trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return false;
    return keywords.some((k) => postText.includes(k));
  }

  /**
   * Tạo notification DB cho user có sở thích (category + optional keywords) khi có bài POSTED mới.
   */
  async notifyNewPostInInterests(post: Post): Promise<{ matched: number; created: number }> {
    if (!post?.post_id || !post?.category_id) return { matched: 0, created: 0 };

    const interests = await this.userInterestRepository.find({
      where: { category_id: post.category_id, is_active: true },
      select: ['user_id', 'keywords', 'is_active', 'category_id'],
    });

    if (interests.length === 0) return { matched: 0, created: 0 };

    const postText = this.normalizeText(`${post.title ?? ''} ${post.description ?? ''}`);

    // Notify by CATEGORY subscription first (all users registered this category)
    const categoryUserIds = Array.from(
      new Set(interests.filter((i) => i.user_id !== post.user_id).map((i) => i.user_id)),
    );

    // Additionally detect who also matches KEYWORDS (to customize content)
    const keywordMatchedUserIds = new Set(
      interests
        .filter((i) => i.user_id !== post.user_id)
        .filter((i) => this.keywordMatchesPost(i, postText))
        .map((i) => i.user_id),
    );
    
    if (categoryUserIds.length === 0) return { matched: 0, created: 0 };

    const existing = await this.notificationRepository.find({
      where: {
        post_id: post.post_id,
        notification_type: NotificationType.NEW_POST_IN_INTEREST as any,
        user_id: In(categoryUserIds),
      },
      select: ['user_id'],
    });

    const existingUserIds = new Set(existing.map((n) => n.user_id));
    const toCreateUserIds = categoryUserIds.filter((id) => !existingUserIds.has(id));

    if (toCreateUserIds.length === 0) return { matched: categoryUserIds.length, created: 0 };

    const title = 'Có bài đăng mới';

    const rows = toCreateUserIds.map((userId) => {
      const content = keywordMatchedUserIds.has(userId)
        ? `"${post.title}" khớp từ khóa bạn quan tâm.`
        : `"${post.title}" trong danh mục bạn quan tâm.`;

      return this.notificationRepository.create({
        user_id: userId,
        post_id: post.post_id,
        category_id: post.category_id,
        notification_type: NotificationType.NEW_POST_IN_INTEREST as any,
        title,
        content,
        is_read: false,
      });
    });

    await this.notificationRepository.save(rows);

    return { matched: categoryUserIds.length, created: toCreateUserIds.length };
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

