import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@modules/entities/post.entity';
import { SearchHistory } from '@modules/entities/search-history.entity';
import { SearchFilterDto, SortBy, TimeRange } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  async search(
    filters: SearchFilterDto,
    userId?: string, // Optional: để lưu lịch sử
  ): Promise<{ data: Post[], total: number }> {
    const { 
      keyword, transactionType, categoryId, timeRange, 
      sortBy, minPrice, maxPrice, page = 1, limit = 20 
    } = filters;

    // 1. Lưu lịch sử tìm kiếm nếu có keyword và user đã đăng nhập
    if (userId && keyword && keyword.trim().length > 0) {
      await this.saveSearchHistory(userId, keyword);
    }

    // 2. Xây dựng Query
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.is_available = :isAvailable', { isAvailable: true });

    if (keyword) {
      queryBuilder.andWhere(
        '(post.title ILIKE :keyword OR post.description ILIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    if (transactionType) {
      queryBuilder.andWhere('post.transaction_type = :transactionType', { transactionType });
    }

    if (categoryId) {
      queryBuilder.andWhere('post.category_id = :categoryId', { categoryId });
    }

    if (timeRange) {
      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === TimeRange.LAST_7_DAYS) {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === TimeRange.LAST_30_DAYS) {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate) {
        queryBuilder.andWhere('post.created_at >= :startDate', { startDate });
      }
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('post.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('post.price <= :maxPrice', { maxPrice });
    }

    // Sắp xếp
    switch (sortBy) {
      case SortBy.OLDEST:
        queryBuilder.orderBy('post.created_at', 'ASC');
        break;
      case SortBy.PRICE_ASC:
        queryBuilder.orderBy('post.price', 'ASC', 'NULLS LAST');
        break;
      case SortBy.PRICE_DESC:
        queryBuilder.orderBy('post.price', 'DESC', 'NULLS LAST');
        break;
      case SortBy.NEWEST:
      default:
        queryBuilder.orderBy('post.created_at', 'DESC');
    }

    // Phân trang
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async getSuggestions(keyword: string): Promise<string[]> {
    if (!keyword || keyword.trim().length === 0) return [];

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .select('DISTINCT post.title', 'title')
      .where('post.title ILIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('post.is_available = :isAvailable', { isAvailable: true })
      .limit(10)
      .getRawMany();

    return posts.map(p => p.title);
  }

  async getSearchHistory(userId: string, limit: number = 10): Promise<string[]> {
    const history = await this.searchHistoryRepository
      .createQueryBuilder('history')
      .select('DISTINCT history.keyword', 'keyword')
      .addSelect('MAX(history.created_at)', 'latest')
      .where('history.user_id = :userId', { userId })
      .groupBy('history.keyword')
      .orderBy('latest', 'DESC')
      .limit(limit)
      .getRawMany();

    return history.map(h => h.keyword);
  }

  private async saveSearchHistory(userId: string, keyword: string): Promise<void> {
    // Có thể thêm logic để không lưu trùng lặp liên tiếp quá nhiều
    // Ở đây lưu đơn giản
    const history = this.searchHistoryRepository.create({
      user_id: userId,
      keyword: keyword.trim(),
    });
    await this.searchHistoryRepository.save(history);
  }
}
