// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  providers: [NotificationService],
  exports: [NotificationService], // <-- Export service
  controllers: [NotificationController], 
})
export class NotificationModule {}