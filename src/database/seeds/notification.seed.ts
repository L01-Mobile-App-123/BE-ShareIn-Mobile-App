import { DataSource } from 'typeorm';
import { Notification } from '@modules/entities/notification.entity';
import { User } from '@modules/entities/user.entity';
import { Post } from '@modules/entities/post.entity';
import { NotificationType } from '@common/enums/notification-type.enum';

const NOTIFICATION_MESSAGES = [
  { title: '🔔 Bài đăng mới', content: 'Có bài đăng mới trong danh mục yêu thích của bạn' },
  { title: '💬 Tin nhắn mới', content: 'Bạn có tin nhắn mới từ một người dùng' },
  { title: '⭐ Đánh giá mới', content: 'Bạn vừa nhận được một đánh giá mới' },
  { title: '✅ Giao dịch hoàn thành', content: 'Giao dịch của bạn đã hoàn thành' },
  { title: '📢 Thông báo hệ thống', content: 'Cập nhật tính năng mới trên ứng dụng' },
];

export async function seedNotifications(dataSource: DataSource) {
  const notifyRepo = dataSource.getRepository(Notification);
  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);

  const users = await userRepo.find();
  const posts = await postRepo.find();

  if (users.length === 0) {
    console.log('⚠️  Skipping Notification seeding: No users found.');
    return;
  }

  const notifications: Notification[] = [];

  // Số lượng notifications có thể cấu hình bằng env NOTIFICATION_SEED_COUNT
  const seedCount = parseInt(process.env.NOTIFICATION_SEED_COUNT || '500', 10);

  for (let i = 0; i < seedCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomPost = posts.length > 0 ? posts[Math.floor(Math.random() * posts.length)] : null;
    const randomMsg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
    const notifTypes = Object.values(NotificationType);
    const notificationType = notifTypes[Math.floor(Math.random() * notifTypes.length)];

    const notification = notifyRepo.create({
      user: randomUser,
      post: randomPost || undefined,
      title: randomMsg.title,
      content: randomMsg.content,
      notification_type: notificationType,
      is_read: Math.random() > 0.6, // ~40% đã đọc
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // trong 30 ngày trước
    });

    notifications.push(notification);
  }

  await notifyRepo.save(notifications);
  console.log(`✅ Seeded ${notifications.length} notifications.`);
}
