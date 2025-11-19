import { seedCategories } from './category.seed';
import { seedUsers } from './user.seed';
import { seedPosts } from './post.seed';
import { seedChats } from './chat.seed';
import { seedActivities } from './activity.seed';
import { AppDataSource } from '@config/typeorm.config';
import { RatingSubscriber } from '@modules/subscribers/rating.subscriber';

async function runSeeder() {
  try {
    console.log('🌱 Initializing database connection...');
    
    // Khởi tạo kết nối TRƯỚC
    const dataSource = await AppDataSource.initialize();
    console.log('✅ Database connected!');
    
    // Đăng ký Subscriber SAU KHI đã initialize
    const subscriber = new RatingSubscriber(dataSource);
    console.log('✅ Subscriber registered');

    // Xóa dữ liệu cũ
    console.log('🗑️  Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE notifications, ratings, search_histories, user_interests, category_keywords, messages, conversations, posts, categories, users RESTART IDENTITY CASCADE;');
    console.log('✅ Database cleared.');

    // Chạy seeders
    await seedCategories(dataSource);
    await seedUsers(dataSource);
    await seedPosts(dataSource);
    await seedChats(dataSource);
    
    console.log('🔢 Starting to seed ratings...');
    await seedActivities(dataSource);

    await dataSource.destroy();
    console.log('🌾 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed', err);
    process.exit(1);
  }
}

runSeeder();
