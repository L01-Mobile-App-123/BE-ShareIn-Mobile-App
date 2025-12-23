import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '@modules/entities/rating.entity';
import { CreateRatingDto, UpdateRatingDto, UserRatingStatsDto } from './dto/rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async createRating(raterId: string, dto: CreateRatingDto): Promise<Rating> {
    // Kiểm tra không tự đánh giá chính mình
    if (raterId === dto.rated_user_id) {
      throw new ConflictException('Không thể tự đánh giá chính mình');
    }

    // Kiểm tra đã đánh giá chưa
    const existingRating = await this.ratingRepository.findOne({
      where: {
        rater_id: raterId,
        rated_user_id: dto.rated_user_id,
      },
    });

    if (existingRating) {
      throw new ConflictException('Bạn đã đánh giá người dùng này rồi');
    }

    const rating = this.ratingRepository.create({
      rater_id: raterId,
      rated_user_id: dto.rated_user_id,
      rating_score: dto.rating_score, // Thay đổi từ is_positive
      comment: dto.comment,
      proof_image_urls: dto.proof_image_urls || [],
    });

    return await this.ratingRepository.save(rating);
  }

  async updateRating(
    raterId: string,
    ratingId: string,
    dto: UpdateRatingDto,
  ): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    // Chỉ người đánh giá mới được sửa
    if (rating.rater_id !== raterId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    // Cập nhật các trường
    if (dto.rating_score !== undefined) rating.rating_score = dto.rating_score;
    if (dto.comment !== undefined) rating.comment = dto.comment;
    if (dto.proof_image_urls !== undefined) {
      if (dto.proof_image_urls.length > 10) {
        throw new BadRequestException('Tối đa 10 ảnh chứng minh');
      }
      rating.proof_image_urls = dto.proof_image_urls;
    }

    return await this.ratingRepository.save(rating);
  }

  async addProofImages(
    raterId: string,
    ratingId: string,
    imageUrls: string[],
  ): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({ where: { rating_id: ratingId } });

    if (!rating) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (rating.rater_id !== raterId) {
      throw new ForbiddenException('Bạn không có quyền thêm ảnh cho đánh giá này');
    }

    const current = rating.proof_image_urls || [];
    const combined = [...current, ...imageUrls];

    if (combined.length > 10) {
      throw new BadRequestException('Tối đa 10 ảnh chứng minh');
    }

    rating.proof_image_urls = combined;
    return this.ratingRepository.save(rating);
  }

  async deleteRating(raterId: string, ratingId: string): Promise<void> {
    const rating = await this.ratingRepository.findOne({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (rating.rater_id !== raterId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.ratingRepository.remove(rating);
  }

  async getRatingsForUser(userId: string): Promise<Rating[]> {
    return await this.ratingRepository.find({
      where: { rated_user_id: userId },
      relations: ['rater'],
      order: { created_at: 'DESC' },
    });
  }

  async getUserRatingStats(userId: string): Promise<UserRatingStatsDto> {
    const ratings = await this.ratingRepository.find({
      where: { rated_user_id: userId },
    });

    const total = ratings.length;

    if (total === 0) {
      return {
        total_ratings: 0,
        average_score: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0,
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating_score, 0);
    const average = sum / total;

    const fiveStarCount = ratings.filter((r) => r.rating_score === 5).length;
    const fourStarCount = ratings.filter((r) => r.rating_score === 4).length;
    const threeStarCount = ratings.filter((r) => r.rating_score === 3).length;
    const twoStarCount = ratings.filter((r) => r.rating_score === 2).length;
    const oneStarCount = ratings.filter((r) => r.rating_score === 1).length;

    return {
      total_ratings: total,
      average_score: Math.round(average * 10) / 10, // Làm tròn 1 chữ số thập phân
      five_star_count: fiveStarCount,
      four_star_count: fourStarCount,
      three_star_count: threeStarCount,
      two_star_count: twoStarCount,
      one_star_count: oneStarCount,
    };
  }
}