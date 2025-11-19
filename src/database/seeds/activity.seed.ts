import { DataSource } from 'typeorm';
import { CategoryKeyword } from '../../modules/entities/category-keyword.entity';
import { UserInterest } from '../../modules/entities/user-interest.entity';
import { SearchHistory } from '../../modules/entities/search-history.entity';
import { Rating } from '../../modules/entities/rating.entity';
import { Notification } from '../../modules/entities/notification.entity';
import { Category } from '../../modules/entities/category.entity';
import { User } from '../../modules/entities/user.entity';
import { Post } from '../../modules/entities/post.entity';

export async function seedActivities(dataSource: DataSource) {
  const categoryRepo = dataSource.getRepository(Category);
  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);
  
  const categories = await categoryRepo.find();
  const users = await userRepo.find();
  const posts = await postRepo.find({ relations: ['user'] });

  // 1. Seed Category Keywords
  const keywordRepo = dataSource.getRepository(CategoryKeyword);
  if (categories.length > 0) {
    const keywordsData: CategoryKeyword[] = [];
    categories.forEach(cat => {
      keywordsData.push(
        keywordRepo.create({ category: cat, keyword: `${cat.category_name} giá rẻ` }),
        keywordRepo.create({ category: cat, keyword: `${cat.category_name} cũ` }),
        keywordRepo.create({ category: cat, keyword: `Thanh lý ${cat.category_name}` })
      );
    });
    for (const k of keywordsData) {
        try { await keywordRepo.save(k); } catch(e) {}
    }
    console.log('✅ Seeded category keywords.');
  }

  // 2. Seed User Interests
  const interestRepo = dataSource.getRepository(UserInterest);
  if (users.length > 0 && categories.length > 0) {
    for (const user of users) {
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      try {
        await interestRepo.save(interestRepo.create({
            user: user,
            category: randomCat,
            keywords: ['giá rẻ', 'mới 99%'],
            is_active: true
        }));
      } catch (e) {}
    }
    console.log('✅ Seeded user interests.');
  }

  // 3. Seed Search History
  const historyRepo = dataSource.getRepository(SearchHistory);
  if (users.length > 0) {
    const historyData: SearchHistory[] = [];
    users.forEach(user => {
        historyData.push(historyRepo.create({ user, keyword: 'Iphone cũ' }));
        historyData.push(historyRepo.create({ user, keyword: 'Giáo trình' }));
    });
    await historyRepo.save(historyData);
    console.log('✅ Seeded search history.');
  }

  // 4. Seed Ratings
  // --- THAY ĐỔI: Lưu TỪNG RATING MỘT để kích hoạt Subscriber ---
  const ratingRepo = dataSource.getRepository(Rating);
  if (posts.length > 0 && users.length > 1) {
    let successCount = 0;
    
    for(let i=0; i<20; i++) {
        const post = posts[Math.floor(Math.random() * posts.length)];
        
        if (!post.user) continue;

        const rater = users.find(u => u.user_id !== post.user.user_id) || users[0];
        
        const rating = ratingRepo.create({
            rater: rater,
            rated_user: post.user, 
            rating_score: Math.floor(Math.random() * 2) + 4, // 4 hoặc 5 sao
            comment: 'Giao dịch nhanh gọn, uy tín.'
        });

        try {
            await ratingRepo.save(rating); // Lưu TỪNG CÁI một
            successCount++;
        } catch (e) {
            console.error(`Failed to save rating ${i}:`, e.message);
        }
    }
    console.log(`✅ Seeded ${successCount} ratings.`);
  }
}