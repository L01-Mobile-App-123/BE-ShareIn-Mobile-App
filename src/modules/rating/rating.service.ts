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
      proof_image_urls: [],
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
        range_81_100_count: 0,
        range_61_80_count: 0,
        range_41_60_count: 0,
        range_21_40_count: 0,
        range_1_20_count: 0,
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating_score, 0);
    const average = sum / total;

    // Thống kê theo các khoảng điểm 1-100
    const range_81_100_count = ratings.filter((r) => r.rating_score >= 81 && r.rating_score <= 100).length;
    const range_61_80_count = ratings.filter((r) => r.rating_score >= 61 && r.rating_score <= 80).length;
    const range_41_60_count = ratings.filter((r) => r.rating_score >= 41 && r.rating_score <= 60).length;
    const range_21_40_count = ratings.filter((r) => r.rating_score >= 21 && r.rating_score <= 40).length;
    const range_1_20_count = ratings.filter((r) => r.rating_score >= 1 && r.rating_score <= 20).length;

    return {
      total_ratings: total,
      average_score: Math.round(average * 10) / 10, // Làm tròn 1 chữ số thập phân
      range_81_100_count,
      range_61_80_count,
      range_41_60_count,
      range_21_40_count,
      range_1_20_count,
    };
  }
}