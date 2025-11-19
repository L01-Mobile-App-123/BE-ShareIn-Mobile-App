import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class RatingSubscriber implements EntitySubscriberInterface<Rating> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
    console.log('✅ RatingSubscriber registered'); // Debug log
  }

  listenTo() {
    return Rating;
  }

  async afterInsert(event: InsertEvent<Rating>) {
    console.log('🔔 afterInsert triggered for rating:', event.entity.rating_id); // Debug log
    if (event.entity.rated_user_id) {
      await this.updateUserReputation(event.manager, event.entity.rated_user_id);
    }
  }

  async afterUpdate(event: UpdateEvent<Rating>) {
    console.log('🔔 afterUpdate triggered'); // Debug log
    const ratedUserId = event.entity?.rated_user_id || event.databaseEntity?.rated_user_id;
    if (ratedUserId) {
      await this.updateUserReputation(event.manager, ratedUserId);
    }
  }

  async afterRemove(event: RemoveEvent<Rating>) {
    console.log('🔔 afterRemove triggered'); // Debug log
    if (event.entity?.rated_user_id) {
      await this.updateUserReputation(event.manager, event.entity.rated_user_id);
    }
  }

  private async updateUserReputation(manager: any, userId: string) {
    console.log('📊 Updating reputation for user:', userId); // Debug log
    
    const ratingRepo = manager.getRepository(Rating);
    const userRepo = manager.getRepository(User);

    const ratings = await ratingRepo.find({
      where: { rated_user_id: userId },
    });

    console.log(`Found ${ratings.length} ratings for user ${userId}`); // Debug log

    if (ratings.length === 0) {
      await userRepo.update(userId, {
        reputation_score: 0,
        total_votes_up: 0,
        total_votes_down: 0,
      });
      return;
    }

    // Tính điểm trung bình (1-5) -> chuyển thành 20-100
    const avgScore = ratings.reduce((sum, r) => sum + r.rating_score, 0) / ratings.length;
    const reputationScore = Math.round(avgScore * 20);

    // Đếm up (4-5 sao) và down (1-2 sao)
    const votesUp = ratings.filter(r => r.rating_score >= 4).length;
    const votesDown = ratings.filter(r => r.rating_score <= 2).length;

    console.log(`Updating user ${userId}: score=${reputationScore}, up=${votesUp}, down=${votesDown}`); // Debug log

    await userRepo.update(userId, {
      reputation_score: reputationScore,
      total_votes_up: votesUp,
      total_votes_down: votesDown,
    });
  }
}