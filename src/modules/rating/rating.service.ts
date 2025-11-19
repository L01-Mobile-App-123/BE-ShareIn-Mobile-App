import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '@modules/entities/rating.entity';
import { User } from '@modules/entities/user.entity';
import { Post } from '@modules/entities/post.entity';
import { CreateRatingDto, UserRatingStatsDto } from './dto/rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createRating(
    raterId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    const { rated_user_id, post_id, rating_score, comment } = createRatingDto;

    // 1. Không thể tự đánh giá bản thân
    if (raterId === rated_user_id) {
      throw new ForbiddenException('Bạn không thể tự đánh giá bản thân');
    }

    // 2. Kiểm tra người được đánh giá tồn tại
    const ratedUser = await this.userRepository.findOne({
      where: { user_id: rated_user_id },
    });

    if (!ratedUser) {
      throw new NotFoundException('Người dùng được đánh giá không tồn tại');
    }

    // 3. Kiểm tra logic trùng lặp đánh giá
    if (post_id) {
      // Trường hợp đánh giá theo giao dịch (Post)
      const post = await this.postRepository.findOne({
        where: { post_id },
      });

      if (!post) {
        throw new NotFoundException('Bài đăng không tồn tại');
      }

      const existingRating = await this.ratingRepository.findOne({
        where: {
          rater_user: { user_id: raterId },
          rated_user: { user_id: rated_user_id },
          post: { post_id },
        },
      } as any);

      if (existingRating) {
        throw new BadRequestException(
          'Bạn đã đánh giá người dùng này cho giao dịch này rồi',
        );
      }
    } else {
      // Trường hợp đánh giá cá nhân (không qua Post) -> Chỉ được đánh giá 1 lần
      const existingRating = await this.ratingRepository.findOne({
        where: {
          rater_user: { user_id: raterId },
          rated_user: { user_id: rated_user_id },
          post: null, // Quan trọng: tìm các rating không gắn với post
        },
      } as any);

      if (existingRating) {
        throw new BadRequestException(
          'Bạn đã đánh giá người dùng này rồi. Hãy thực hiện giao dịch để đánh giá thêm.',
        );
      }
    }

    // 4. Tạo rating mới
    const rating = this.ratingRepository.create({
      rater_user: { user_id: raterId },
      rated_user: { user_id: rated_user_id },
      post: post_id ? { post_id } : null,
      rating_score,
      comment,
      created_at: new Date(),
    } as any);

    const savedRating = await this.ratingRepository.save(rating);
    const saved =
      Array.isArray(savedRating) && savedRating.length > 0
        ? savedRating[0]
        : (savedRating as unknown as Rating);

    // 5. Cập nhật thông số uy tín của user (Reputation + Votes)
    await this.updateUserReputationScore(rated_user_id);

    const found = await this.ratingRepository.findOne({
      where: { rating_id: saved.rating_id },
      relations: ['rater_user', 'rated_user', 'post'],
    });

    if (!found) {
      throw new NotFoundException('Rating not found after creation');
    }

    return found;
  }

  async getUserRatings(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Rating[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.ratingRepository.findAndCount({
      where: { rated_user: { user_id: userId } },
      relations: ['rater_user', 'rated_user', 'post'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async getRatingsByRater(
    raterId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Rating[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.ratingRepository.findAndCount({
      where: { rater_user: { user_id: raterId } },
      relations: ['rater_user', 'rated_user', 'post'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    } as any);

    return { data, total };
  }

  async getUserRatingStats(userId: string): Promise<UserRatingStatsDto> {
    const ratings = (await this.ratingRepository.find({
      where: { rated_user: { user_id: userId } },
    })) as any[];

    const total = ratings.length;

    if (total === 0) {
      return {
        average_rating: 0,
        total_ratings: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0,
        positive_percentage: 0,
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating_score, 0);
    const average = sum / total;

    const fiveStarCount = ratings.filter((r) => r.rating_score === 5).length;
    const fourStarCount = ratings.filter((r) => r.rating_score === 4).length;
    const threeStarCount = ratings.filter((r) => r.rating_score === 3).length;
    const twoStarCount = ratings.filter((r) => r.rating_score === 2).length;
    const oneStarCount = ratings.filter((r) => r.rating_score === 1).length;

    const positiveCount = fiveStarCount + fourStarCount;
    const positivePercentage = (positiveCount / total) * 100;

    return {
      average_rating: Math.round(average * 10) / 10,
      total_ratings: total,
      five_star_count: fiveStarCount,
      four_star_count: fourStarCount,
      three_star_count: threeStarCount,
      two_star_count: twoStarCount,
      one_star_count: oneStarCount,
      positive_percentage: Math.round(positivePercentage * 100) / 100,
    };
  }

  async getPostRatings(postId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { post: { post_id: postId } },
      relations: ['rater_user', 'rated_user'],
      order: { created_at: 'DESC' },
    } as any);
  }

  private async updateUserReputationScore(userId: string): Promise<void> {
    const stats = await this.getUserRatingStats(userId);

    // Tính toán điểm uy tín (1-5 sao -> 20-100 điểm)
    const reputationScore = Math.round(stats.average_rating * 20);

    // Tính toán tổng số vote up/down
    // Quy ước: 4-5 sao là Up, 1-2 sao là Down, 3 sao là trung lập (hoặc tùy chỉnh)
    const totalVotesUp = stats.five_star_count + stats.four_star_count;
    const totalVotesDown = stats.one_star_count + stats.two_star_count;

    await this.userRepository.update(
      { user_id: userId },
      {
        reputation_score: reputationScore,
        total_votes_up: totalVotesUp,
        total_votes_down: totalVotesDown,
      },
    );
  }
}