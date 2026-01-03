import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@modules/entities/post.entity';
import { SearchHistory } from '@modules/entities/search-history.entity';
import { SearchFilterDto, SortBy, TimeRange } from './dto/search.dto';
import { PostLike } from '@modules/entities/post-like.entity';
import { PostSave } from '@modules/entities/post-save.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostSave)
    private readonly postSaveRepository: Repository<PostSave>,
  ) {}

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value === 't' || value === 'true' || value === '1';
    return false;
  }

  async search(
    filters: SearchFilterDto,
    userId?: string, // Optional: để lưu lịch sử
  ): Promise<{ data: Array<Post & { like_count: number; is_liked: boolean; is_saved: boolean }>; total: number }> {
    const { 
      keyword, transactionType, categoryId, timeRange, 
      sortBy, minPrice, maxPrice, page = 1, limit = 20 
    } = filters;

    // 1. Lưu lịch sử tìm kiếm nếu có keyword và user đã đăng nhập
    if (userId && keyword && keyword.trim().length > 0) {
      await this.saveSearchHistory(userId, keyword);
    }

    // 2. Xây dựng base query (không join) để count chính xác
    const baseQb = this.postRepository
      .createQueryBuilder('post')
      .where('post.is_available = :isAvailable', { isAvailable: true });

    if (keyword) {
      baseQb.andWhere(
        '(post.title ILIKE :keyword OR post.description ILIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    if (transactionType) {
      baseQb.andWhere('post.transaction_type = :transactionType', { transactionType });
    }

    if (categoryId) {
      baseQb.andWhere('post.category_id = :categoryId', { categoryId });
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
        baseQb.andWhere('post.created_at >= :startDate', { startDate });
      }
    }

    if (minPrice !== undefined) {
      baseQb.andWhere('post.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      baseQb.andWhere('post.price <= :maxPrice', { maxPrice });
    }

    const total = await baseQb.getCount();

    // Data query (join + meta)
    const queryBuilder = baseQb
      .clone()
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.category', 'category')
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(*)', 'cnt')
            .from(PostLike, 'pl')
            .where('pl.post_id = post.post_id'),
        'like_count',
      );

    if (userId) {
      queryBuilder
        .addSelect(
          (sub) =>
            sub
              .select('COUNT(*) > 0', 'liked')
              .from(PostLike, 'pl2')
              .where('pl2.post_id = post.post_id')
              .andWhere('pl2.user_id = :userId'),
          'is_liked',
        )
        .addSelect(
          (sub) =>
            sub
              .select('COUNT(*) > 0', 'saved')
              .from(PostSave, 'ps')
              .where('ps.post_id = post.post_id')
              .andWhere('ps.user_id = :userId'),
          'is_saved',
        )
        .setParameter('userId', userId);
    } else {
      queryBuilder.addSelect('false', 'is_liked');
      queryBuilder.addSelect('false', 'is_saved');
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

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const data = entities.map((post, idx) => {
      const like_count = Number(raw?.[idx]?.like_count ?? 0);
      const is_liked = this.toBoolean(raw?.[idx]?.is_liked);
      const is_saved = this.toBoolean(raw?.[idx]?.is_saved);
      return Object.assign(post, { like_count, is_liked, is_saved });
    });

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
