import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private subs: { userId: string; category: string }[] = [];

  subscribe(userId: string, category: string) {
    this.subs.push({ userId, category });
    return { ok: true };
  }

  notifyCategory(category: string, title: string) {
    const targets = this.subs.filter((s) => s.category === category);
    // In a real app you'd push notifications. Here we just return targets.
    return { notified: targets.length, targets };
  }
}
