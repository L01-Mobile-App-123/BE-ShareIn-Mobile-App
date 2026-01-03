import { Test, TestingModule } from '@nestjs/testing';

import { UserInterestController } from './user-interest.controller';
import { UserInterestService } from './user-interest.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('UserInterestController', () => {
  let controller: UserInterestController;
  let userInterestService: {
    getUserInterests: jest.Mock;
    updateUserInterests: jest.Mock;
  };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    userInterestService = {
      getUserInterests: jest.fn(),
      updateUserInterests: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserInterestController],
      providers: [{ provide: UserInterestService, useValue: userInterestService }],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(UserInterestController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInterests', () => {
    it('valid: maps entities to response DTO shape (keywords default [])', async () => {
      // Mục tiêu: cover mapping + keywords fallback
      userInterestService.getUserInterests.mockResolvedValue([
        {
          interest_id: 'i1',
          category: { category_id: 'c1', category_name: 'Cat' },
          keywords: undefined,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const res = await controller.getUserInterests(makeReq('me'));
      expect(userInterestService.getUserInterests).toHaveBeenCalledWith('me');
      expect(res.data?.[0].keywords).toEqual([]);
      expect(res.data?.[0].category.category_id).toBe('c1');
    });

    it('invalid: bubbles up errors', async () => {
      userInterestService.getUserInterests.mockRejectedValue(new Error('boom'));
      await expect(controller.getUserInterests(makeReq('me'))).rejects.toThrow('boom');
    });
  });

  describe('updateUserInterests', () => {
    it('valid: calls service and maps response', async () => {
      userInterestService.updateUserInterests.mockResolvedValue([
        {
          interest_id: 'i1',
          category_id: 'c1',
          category: { category_id: 'c1', category_name: 'Cat' },
          keywords: ['k1'],
          is_active: true,
          created_at: new Date(),
        },
      ]);

      const dto = { interests: [] } as any;
      const res = await controller.updateUserInterests(makeReq('me'), dto);
      expect(userInterestService.updateUserInterests).toHaveBeenCalledWith('me', dto);
      expect(res.data?.[0].category.category_id).toBe('c1');
    });

    it('invalid: bubbles up errors', async () => {
      userInterestService.updateUserInterests.mockRejectedValue(new Error('boom'));
      await expect(controller.updateUserInterests(makeReq('me'), {} as any)).rejects.toThrow('boom');
    });
  });
});
