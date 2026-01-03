import { Test, TestingModule } from '@nestjs/testing';

import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: {
    sendToDevice: jest.Mock;
    getNotifications: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    deleteNotification: jest.Mock;
  };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    notificationService = {
      sendToDevice: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: notificationService }],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(NotificationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testSendNotification', () => {
    it('valid: calls service with defaults for title/body when missing', async () => {
      // Mục tiêu: cover default title/body
      notificationService.sendToDevice.mockResolvedValue({ success: true });
      const res = await controller.testSendNotification({ token: 't' } as any);
      expect(notificationService.sendToDevice).toHaveBeenCalledWith(
        't',
        expect.stringContaining('Test Title'),
        expect.stringContaining('thông báo test'),
        { testData: 'dayLaDataPayload123' },
      );
      expect(res.message).toContain('Test notification sent');
    });

    it('valid: passes custom title/body when provided', async () => {
      notificationService.sendToDevice.mockResolvedValue({ ok: 1 });
      await controller.testSendNotification({ token: 't', title: 'A', body: 'B' } as any);
      expect(notificationService.sendToDevice).toHaveBeenCalledWith('t', 'A', 'B', expect.any(Object));
    });

    it('invalid: returns error object (controller catches)', async () => {
      // Mục tiêu: cover nhánh catch trong controller (không throw)
      notificationService.sendToDevice.mockRejectedValue(new Error('firebase down'));
      const res = await controller.testSendNotification({ token: 't' } as any);
      expect(res).toEqual(
        expect.objectContaining({
          status: 'error',
          message: 'Failed to send notification',
          error: 'firebase down',
        }),
      );
    });
  });

  describe('getNotifications', () => {
    it('valid: calls service with userId and paging', async () => {
      notificationService.getNotifications.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      await controller.getNotifications(makeReq('u9'), 1, 20);
      expect(notificationService.getNotifications).toHaveBeenCalledWith('u9', 1, 20);
    });

    it('invalid: bubbles up errors', async () => {
      notificationService.getNotifications.mockRejectedValue(new Error('boom'));
      await expect(controller.getNotifications(makeReq('u9'), 1, 20)).rejects.toThrow('boom');
    });
  });

  describe('markAsRead', () => {
    it('valid: calls service with notificationId and userId', async () => {
      notificationService.markAsRead.mockResolvedValue({ id: 'n1' });
      await controller.markAsRead('n1', makeReq('u1'), {} as any);
      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1', 'u1');
    });

    it('invalid: bubbles up errors', async () => {
      notificationService.markAsRead.mockRejectedValue(new Error('forbidden'));
      await expect(controller.markAsRead('n1', makeReq('u1'), {} as any)).rejects.toThrow('forbidden');
    });
  });

  describe('markAllAsRead', () => {
    it('valid: calls service with userId', async () => {
      notificationService.markAllAsRead.mockResolvedValue({ affected: 2 });
      await controller.markAllAsRead(makeReq('u2'), {} as any);
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('u2');
    });

    it('invalid: bubbles up errors', async () => {
      notificationService.markAllAsRead.mockRejectedValue(new Error('boom'));
      await expect(controller.markAllAsRead(makeReq('u2'), {} as any)).rejects.toThrow('boom');
    });
  });

  describe('deleteNotification', () => {
    it('valid: calls service with notificationId and userId', async () => {
      notificationService.deleteNotification.mockResolvedValue({ message: 'ok' });
      await controller.deleteNotification('n9', makeReq('u9'));
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('n9', 'u9');
    });

    it('invalid: bubbles up errors', async () => {
      notificationService.deleteNotification.mockRejectedValue(new Error('boom'));
      await expect(controller.deleteNotification('n9', makeReq('u9'))).rejects.toThrow('boom');
    });
  });
});
