import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { UserInterestController } from '../src/modules/user-interest/user-interest.controller';
import { UserInterestService } from '../src/modules/user-interest/user-interest.service';

describe('UserInterestController (e2e)', () => {
  let app: INestApplication;

  const userInterestService = {
    getUserInterests: jest.fn(),
    updateUserInterests: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [UserInterestController],
      providers: [{ provide: UserInterestService, useValue: userInterestService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /user-interests', () => {
    it('valid: 200', async () => {
      userInterestService.getUserInterests.mockResolvedValue([
        {
          interest_id: 'i1',
          category: { category_id: 'c1', category_name: 'Cat' },
          keywords: undefined,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      await request(app.getHttpServer()).get('/user-interests').expect(200);
      expect(userInterestService.getUserInterests).toHaveBeenCalledWith('user-id-test');
    });

    it('invalid: 500', async () => {
      userInterestService.getUserInterests.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/user-interests').expect(500);
    });
  });

  describe('PUT /user-interests', () => {
    it('valid: 200', async () => {
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

      await request(app.getHttpServer())
        .put('/user-interests')
        .send({ interests: [] })
        .expect(200);

      expect(userInterestService.updateUserInterests).toHaveBeenCalledWith('user-id-test', expect.any(Object));
    });

    it('invalid: 500', async () => {
      userInterestService.updateUserInterests.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer())
        .put('/user-interests')
        .send({ interests: [] })
        .expect(500);
    });
  });
});
