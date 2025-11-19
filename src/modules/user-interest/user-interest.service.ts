import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserInterest } from '../entities/user-interest.entity';
import { Category } from '../entities/category.entity';
import { UpdateUserInterestsDto } from './dto/user-interest.dto';

@Injectable()
export class UserInterestService {
  constructor(
    @InjectRepository(UserInterest)
    private userInterestRepository: Repository<UserInterest>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * Lấy danh sách quan tâm của user
   */
  async getUserInterests(userId: string): Promise<UserInterest[]> {
    return this.userInterestRepository.find({
      where: { user_id: userId },
      relations: ['category'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Cập nhật (Đồng bộ) danh sách quan tâm
   * Logic: Thay thế danh sách cũ bằng danh sách mới
   */
  async updateUserInterests(userId: string, dto: UpdateUserInterestsDto): Promise<UserInterest[]> {
    const { interests } = dto;

    // 1. Validate: Kiểm tra xem các category_id gửi lên có tồn tại không
    if (interests.length > 0) {
      const categoryIds = interests.map(i => i.category_id);
      const count = await this.categoryRepository.count({
        where: { category_id: In(categoryIds) }
      });
      
      // Lưu ý: Nếu count < categoryIds.length nghĩa là có ID rác, nhưng để đơn giản ta có thể bỏ qua hoặc throw lỗi.
      // Ở đây ta chấp nhận xử lý, DB sẽ báo lỗi foreign key nếu ID sai.
    }

    // 2. Lấy danh sách hiện tại trong DB
    const currentInterests = await this.userInterestRepository.find({
      where: { user_id: userId },
    });

    // 3. Tạo Map để dễ so sánh
    // Map<categoryId, keywords[]>
    const newInterestMap = new Map<string, string[]>();
    interests.forEach(item => {
      // Loại bỏ keyword trùng lặp và rỗng
      const uniqueKeywords = [...new Set(item.keywords || [])].filter(k => k.trim() !== '');
      newInterestMap.set(item.category_id, uniqueKeywords);
    });

    const toRemove: UserInterest[] = [];
    const toUpdate: UserInterest[] = [];
    const toCreate: Partial<UserInterest>[] = [];

    // 4. Phân loại: Cập nhật hoặc Xóa
    for (const current of currentInterests) {
      if (newInterestMap.has(current.category_id)) {
        // Có trong request -> Cập nhật keywords
        const newKeywords = newInterestMap.get(current.category_id)!;
        
        // Chỉ update nếu có thay đổi để tối ưu DB
        const currentKeywords = current.keywords || [];
        const isDifferent = 
            currentKeywords.length !== newKeywords.length || 
            !currentKeywords.every(k => newKeywords.includes(k));

        if (isDifferent) {
            current.keywords = newKeywords;
            toUpdate.push(current);
        }
        
        // Xóa khỏi map để đánh dấu là đã xử lý
        newInterestMap.delete(current.category_id);
      } else {
        // Không có trong request -> Xóa
        toRemove.push(current);
      }
    }

    // 5. Những cái còn lại trong Map là Thêm mới
    newInterestMap.forEach((keywords, categoryId) => {
      toCreate.push({
        user_id: userId,
        category_id: categoryId,
        keywords: keywords,
        is_active: true
      });
    });

    // 6. Thực thi Transaction (hoặc chạy song song)
    await this.userInterestRepository.manager.transaction(async (transactionalEntityManager) => {
      if (toRemove.length > 0) {
        await transactionalEntityManager.remove(toRemove);
      }
      if (toUpdate.length > 0) {
        await transactionalEntityManager.save(toUpdate);
      }
      if (toCreate.length > 0) {
        // Create từng cái để trigger @BeforeInsert nếu có (hoặc dùng insert bulk)
        const newEntities = this.userInterestRepository.create(toCreate);
        await transactionalEntityManager.save(newEntities);
      }
    });

    // 7. Trả về danh sách mới nhất
    return this.getUserInterests(userId);
  }
}