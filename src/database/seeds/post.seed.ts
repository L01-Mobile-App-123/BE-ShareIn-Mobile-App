import { DataSource } from 'typeorm';
import { Post } from '../../modules/entities/post.entity';
import { User } from '../../modules/entities/user.entity';
import { Category } from '../../modules/entities/category.entity';
import { PostTransactionType } from '../../common/enums/post-transaction-type.enum';

const POST_TITLES = [
  'Giáo trình Toán cao cấp tập 1', 'Bàn học cũ gỗ sồi', 'Iphone 11 Pro Max cũ',
  'Tặng mèo con 2 tháng tuổi', 'Trao đổi sách văn học lấy truyện tranh',
  'Xe đạp Martin 107', 'Nồi cơm điện mini', 'Quạt máy Senko',
  'Giày Nike size 42', 'Vợt cầu lông Yonex', 'Laptop Dell XPS cũ',
  'Truyện Conan trọn bộ', 'Đèn học chống cận', 'Balo chống gù lưng'
];

const LOCATIONS = ['KTX Khu A', 'KTX Khu B', 'Thư viện trung tâm', 'Nhà văn hóa sinh viên', 'Quận 1', 'Thủ Đức'];

export async function seedPosts(dataSource: DataSource) {
  const postRepo = dataSource.getRepository(Post);
  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);

  const users = await userRepo.find();
  const categories = await categoryRepo.find();

  if (users.length === 0 || categories.length === 0) {
    console.log('⚠️  Skipping Post seeding: No users or categories found.');
    return;
  }

  const posts: Post[] = [];

  const postCount = parseInt(process.env.POSTS_SEED_COUNT || '1000', 10);

  for (let i = 0; i < postCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomTitle = POST_TITLES[Math.floor(Math.random() * POST_TITLES.length)];
    const types = Object.values(PostTransactionType);
    const type = types[Math.floor(Math.random() * types.length)];

    const post = postRepo.create({
      user: randomUser,
      category: randomCategory,
      title: randomTitle,
      description: `Mô tả chi tiết cho sản phẩm ${randomTitle}. Hàng còn tốt, liên hệ để biết thêm chi tiết.`,
      price: type === PostTransactionType.FREE ? 0 : Math.floor(Math.random() * 100) * 10000, // Giá từ 0 đến 1tr
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      transaction_type: type,
      is_available: Math.random() > 0.2, // 80% là còn hàng
      view_count: Math.floor(Math.random() * 500),
      image_urls: [`https://picsum.photos/seed/${i}/300/200`, `https://picsum.photos/seed/${i+100}/300/200`]
    });

    posts.push(post);
  }

  await postRepo.save(posts);
  console.log(`✅ Seeded ${posts.length} posts.`);
}