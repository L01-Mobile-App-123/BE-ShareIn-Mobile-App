import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { createTestToken: jest.Mock; verifyToken: jest.Mock; logout: jest.Mock };
  let configService: { get: jest.Mock };

  const mockAxiosPost = axios.post as unknown as jest.Mock;

  beforeEach(async () => {
    authService = {
      createTestToken: jest.fn(),
      verifyToken: jest.fn(),
      logout: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFirebaseConfig', () => {
    it('valid: returns apiKey from ConfigService', () => {
      // Mục tiêu: đảm bảo controller đọc config đúng
      configService.get.mockReturnValue('api-key');
      expect(controller.getFirebaseConfig()).toEqual({ apiKey: 'api-key' });
      expect(configService.get).toHaveBeenCalledWith('firebase.webApiKey');
    });
  });

  describe('getTestToken', () => {
    it('valid: creates custom token then exchanges for idToken via axios', async () => {
      // Mục tiêu: gọi AuthService + axios đúng thứ tự, không cần quan tâm response shape chi tiết
      configService.get.mockReturnValue('api-key');
      authService.createTestToken.mockResolvedValue({ customToken: 'custom-token' });
      mockAxiosPost.mockResolvedValue({ data: { idToken: 'id-token' } });

      await expect(
        controller.getTestToken({ uid: 'uid-1', email: 'a@b.com' }),
      ).resolves.toEqual({ idToken: 'id-token' });

      expect(authService.createTestToken).toHaveBeenCalledWith('uid-1', 'a@b.com');
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      const [url, payload] = mockAxiosPost.mock.calls[0];
      expect(String(url)).toContain('signInWithCustomToken');
      expect(String(url)).toContain('key=api-key');
      expect(payload).toEqual({ token: 'custom-token', returnSecureToken: true });
    });

    it('invalid: bubbles up axios errors', async () => {
      // Mục tiêu: khi provider (axios) lỗi -> controller reject
      configService.get.mockReturnValue('api-key');
      authService.createTestToken.mockResolvedValue({ customToken: 'custom-token' });
      mockAxiosPost.mockRejectedValue(new Error('network down'));

      await expect(
        controller.getTestToken({ uid: 'uid-1', email: 'a@b.com' }),
      ).rejects.toThrow('network down');
    });
  });

  describe('verify', () => {
    it('invalid: throws UnauthorizedException when Authorization header missing', async () => {
      // Mục tiêu: cover case thiếu header
      await expect(controller.verify({ headers: {} } as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(authService.verifyToken).not.toHaveBeenCalled();
    });

    it('invalid: throws UnauthorizedException when Authorization header not Bearer', async () => {
      // Mục tiêu: cover case header sai format
      await expect(
        controller.verify({ headers: { authorization: 'Token abc' } } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('valid: calls authService.verifyToken with token', async () => {
      // Mục tiêu: verify gọi service đúng token
      authService.verifyToken.mockResolvedValue({
        user_id: 'u1',
        email: 'a@b.com',
        full_name: 'Alice',
      });

      await controller.verify({ headers: { authorization: 'Bearer t1' } } as any);
      expect(authService.verifyToken).toHaveBeenCalledWith('t1');
    });

    it('invalid: bubbles up errors from authService.verifyToken', async () => {
      // Mục tiêu: service throw -> controller throw
      authService.verifyToken.mockRejectedValue(new Error('invalid token'));
      await expect(
        controller.verify({ headers: { authorization: 'Bearer bad' } } as any),
      ).rejects.toThrow('invalid token');
    });
  });

  describe('logout', () => {
    it('valid: calls authService.logout with request.user.uid', async () => {
      // Mục tiêu: controller lấy uid từ req.user
      authService.logout.mockResolvedValue('ok');
      await controller.logout({ user: { uid: 'firebase-uid' } } as any);
      expect(authService.logout).toHaveBeenCalledWith('firebase-uid');
    });

    it('invalid: bubbles up errors from authService.logout', async () => {
      // Mục tiêu: cover lỗi logout
      authService.logout.mockRejectedValue(new Error('cannot logout'));
      await expect(
        controller.logout({ user: { uid: 'firebase-uid' } } as any),
      ).rejects.toThrow('cannot logout');
    });
  });
});
