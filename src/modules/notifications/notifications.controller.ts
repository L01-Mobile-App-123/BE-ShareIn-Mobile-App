import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('subscribe')
  subscribe(@Body() body: { userId: string; category: string }) {
    return this.service.subscribe(body.userId, body.category);
  }

  @Post('notify')
  notify(@Body() body: { category: string; title: string }) {
    return this.service.notifyCategory(body.category, body.title);
  }
}
