import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInterestController } from './user-interest.controller';
import { UserInterestService } from './user-interest.service';
import { UserInterest } from '@modules/entities/user-interest.entity';
import { Category } from '@modules/entities/category.entity';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserInterest, Category]), UsersModule],
  controllers: [UserInterestController],
  providers: [UserInterestService],
  exports: [UserInterestService],
})
export class UserInterestModule {}