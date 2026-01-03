import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { NotificationController } from '../src/modules/notifications/notification.controller';
import { NotificationService } from '../src/modules/notifications/notification.service';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  const notificationService = {
    sendToDevice: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: notificationService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /notification/test-send', () => {
    it('valid: 201/200', async () => {
      notificationService.sendToDevice.mockResolvedValue({ success: true });
      await request(app.getHttpServer())
        .post('/notification/test-send')
        .send({ token: 't', title: 'A', body: 'B' })
        .expect(201);
    });

    it('invalid: missing token -> 400 (validation)', async () => {
      await request(app.getHttpServer())
        .post('/notification/test-send')
        .send({ title: 'A' })
        .expect(400);
    });

    it('invalid: service throws -> still 201 with error object (controller catches)', async () => {
      notificationService.sendToDevice.mockRejectedValue(new Error('firebase down'));
      await request(app.getHttpServer())
        .post('/notification/test-send')
        // DTO yêu cầu đủ token/title/body (IsString, không IsOptional)
        .send({ token: 't', title: 'A', body: 'B' })
        .expect(201);
    });
  });

  describe('GET /notification', () => {
    it('valid: 200', async () => {
      notificationService.getNotifications.mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      await request(app.getHttpServer()).get('/notification?page=1&limit=20').expect(200);
      expect(notificationService.getNotifications).toHaveBeenCalledWith('user-id-test', 1, 20);
    });

    it('invalid: 500', async () => {
      notificationService.getNotifications.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/notification?page=1&limit=20').expect(500);
    });
  });

  describe('PATCH /notification/:id/read', () => {
    it('valid: 200', async () => {
      notificationService.markAsRead.mockResolvedValue({ id: 'n1' });
      await request(app.getHttpServer()).patch('/notification/n1/read').send({}).expect(200);
      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1', 'user-id-test');
    });

    it('invalid: 500', async () => {
      notificationService.markAsRead.mockRejectedValue(new Error('forbidden'));
      await request(app.getHttpServer()).patch('/notification/n1/read').send({}).expect(500);
    });
  });

  describe('PATCH /notification/read-all', () => {
    it('valid: 200', async () => {
      notificationService.markAllAsRead.mockResolvedValue({ affected: 2 });
      await request(app.getHttpServer()).patch('/notification/read-all').send({}).expect(200);
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user-id-test');
    });

    it('invalid: 500', async () => {
      notificationService.markAllAsRead.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).patch('/notification/read-all').send({}).expect(500);
    });
  });

  describe('DELETE /notification/:id', () => {
    it('valid: 200', async () => {
      notificationService.deleteNotification.mockResolvedValue({ message: 'ok' });
      await request(app.getHttpServer()).delete('/notification/n9').expect(200);
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('n9', 'user-id-test');
    });

    it('invalid: 500', async () => {
      notificationService.deleteNotification.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).delete('/notification/n9').expect(500);
    });
  });
});
