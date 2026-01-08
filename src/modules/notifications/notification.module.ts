// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from '@modules/entities/notification.entity';
import { UserInterest } from '@modules/entities/user-interest.entity';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserInterest]), UsersModule],
  providers: [NotificationService],
  exports: [NotificationService], // <-- Export service
  controllers: [NotificationController], 
})
export class NotificationModule {}