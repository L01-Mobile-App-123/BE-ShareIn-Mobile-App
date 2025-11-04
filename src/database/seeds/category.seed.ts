import { DataSource } from 'typeorm';
import { Category } from '@modules/entities/category.entity';

export async function seedCategories(dataSource: DataSource) {
  const repo = dataSource.getRepository(Category);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Categories already seeded');
    return;
  }

  const categories: Partial<Category>[] = [
    {
        category_name: 'Sách & Tài liệu học tập',
        description: 'Chia sẻ, mua bán sách giáo trình, tài liệu tham khảo, và giáo cụ phục vụ học tập.',
    },
    {
        category_name: 'Đồ dùng học tập/Văn phòng phẩm',
        description: 'Bút, vở, giấy, thước kẻ và các vật dụng hỗ trợ học tập hoặc làm việc văn phòng.',
    },
    {
        category_name: 'Thiết bị Điện tử',
        description: 'Các thiết bị như laptop, điện thoại, tai nghe, phụ kiện điện tử phục vụ học tập và giải trí.',
    },
    {
        category_name: 'Đồ Gia dụng & Thiết bị ký túc xá',
        description: 'Các vật dụng cần thiết cho sinh hoạt hằng ngày, phù hợp với phòng trọ và ký túc xá sinh viên.',
    },
    {
        category_name: 'Quần áo & Phụ kiện',
        description: 'Quần áo, giày dép, balo, túi xách và các phụ kiện thời trang phù hợp với sinh viên.',
    },
    {
        category_name: 'Dịch vụ & Khác',
        description: 'Các dịch vụ tiện ích, việc làm thêm, và các sản phẩm khác phục vụ nhu cầu sinh viên.',
    },
  ];

  await repo.insert(categories);
  console.log('✅ Categories seeded successfully!');
}
