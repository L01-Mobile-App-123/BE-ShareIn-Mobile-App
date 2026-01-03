import request from 'supertest';
import axios from 'axios';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ConfigService } from '@nestjs/config';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const authService = {
    createTestToken: jest.fn(),
    verifyToken: jest.fn(),
    logout: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const mockAxiosPost = axios.post as unknown as jest.Mock;

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/test-token', () => {
    it('valid: returns 201 and calls service + axios exchange', async () => {
      // Mục tiêu: bắn HTTP và verify chain gọi dependency
      configService.get.mockReturnValue('api-key');
      authService.createTestToken.mockResolvedValue({ customToken: 'custom-token' });
      mockAxiosPost.mockResolvedValue({ data: { idToken: 'id-token' } });

      await request(app.getHttpServer())
        .post('/auth/test-token')
        .send({ uid: 'uid-1', email: 'a@b.com' })
        .expect(201);

      expect(authService.createTestToken).toHaveBeenCalledWith('uid-1', 'a@b.com');
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    });

    it('invalid: bubbles up axios error as 500', async () => {
      configService.get.mockReturnValue('api-key');
      authService.createTestToken.mockResolvedValue({ customToken: 'custom-token' });
      mockAxiosPost.mockRejectedValue(new Error('network down'));

      await request(app.getHttpServer())
        .post('/auth/test-token')
        .send({ uid: 'uid-1', email: 'a@b.com' })
        .expect(500);
    });
  });

  describe('POST /auth/verify', () => {
    it('invalid: missing Authorization header -> 401', async () => {
      await request(app.getHttpServer()).post('/auth/verify').expect(401);
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('invalid: non-bearer Authorization header -> 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify')
        .set('Authorization', 'Token abc')
        .expect(401);
    });

    it('valid: bearer token -> 201/200 and calls authService.verifyToken', async () => {
      authService.verifyToken.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        full_name: 'Alice',
      });

      await request(app.getHttpServer())
        .post('/auth/verify')
        .set('Authorization', 'Bearer t1')
        .expect(201);

      expect(authService.verifyToken).toHaveBeenCalledWith('t1');
    });

    it('invalid: service throws -> 500', async () => {
      authService.verifyToken.mockRejectedValue(new Error('invalid token'));

      await request(app.getHttpServer())
        .post('/auth/verify')
        .set('Authorization', 'Bearer bad')
        .expect(500);
    });
  });

  describe('POST /auth/log-out', () => {
    it('valid: calls authService.logout and returns 201', async () => {
      authService.logout.mockResolvedValue('ok');

      await request(app.getHttpServer()).post('/auth/log-out').expect(201);
      expect(authService.logout).toHaveBeenCalledWith('firebase-uid-test');
    });

    it('invalid: service throws -> 500', async () => {
      authService.logout.mockRejectedValue(new Error('cannot logout'));
      await request(app.getHttpServer()).post('/auth/log-out').expect(500);
    });
  });
});
