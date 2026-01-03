import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { RatingController } from '../src/modules/rating/rating.controller';
import { RatingService } from '../src/modules/rating/rating.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';

describe('RatingController (e2e)', () => {
  let app: INestApplication;

  const ratingService = {
    createRating: jest.fn(),
    updateRating: jest.fn(),
    deleteRating: jest.fn(),
    getRatingsForUser: jest.fn(),
    getUserRatingStats: jest.fn(),
    addProofImages: jest.fn(),
  };

  const cloudinaryService = {
    uploadMultipleFiles: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [RatingController],
      providers: [
        { provide: RatingService, useValue: ratingService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ratings', () => {
    it('valid: 201', async () => {
      ratingService.createRating.mockResolvedValue({ rating_id: 'r1' });
      await request(app.getHttpServer())
        .post('/ratings')
        .send({
          // DTO yêu cầu UUID + rating_score (1-5)
          rated_user_id: '550e8400-e29b-41d4-a716-446655440000',
          rating_score: 5,
          comment: 'ok',
        })
        .expect(201);

      expect(ratingService.createRating).toHaveBeenCalledWith('user-id-test', expect.any(Object));
    });

    it('invalid: service throws -> 500', async () => {
      ratingService.createRating.mockRejectedValue(new Error('bad request'));
      await request(app.getHttpServer())
        .post('/ratings')
        // gửi payload hợp lệ để đi tới service, rồi service throw -> 500
        .send({
          rated_user_id: '550e8400-e29b-41d4-a716-446655440000',
          rating_score: 5,
        })
        .expect(500);
    });
  });

  describe('PATCH /ratings/:ratingId', () => {
    it('valid: 200', async () => {
      ratingService.updateRating.mockResolvedValue({ rating_id: 'r1' });
      await request(app.getHttpServer())
        .patch('/ratings/r1')
        .send({ comment: 'x' })
        .expect(200);
      expect(ratingService.updateRating).toHaveBeenCalledWith('user-id-test', 'r1', expect.any(Object));
    });

    it('invalid: 500', async () => {
      ratingService.updateRating.mockRejectedValue(new Error('forbidden'));
      await request(app.getHttpServer()).patch('/ratings/r1').send({}).expect(500);
    });
  });

  describe('DELETE /ratings/:ratingId', () => {
    it('valid: 200', async () => {
      ratingService.deleteRating.mockResolvedValue(undefined);
      await request(app.getHttpServer()).delete('/ratings/r1').expect(200);
      expect(ratingService.deleteRating).toHaveBeenCalledWith('user-id-test', 'r1');
    });

    it('invalid: 500', async () => {
      ratingService.deleteRating.mockRejectedValue(new Error('forbidden'));
      await request(app.getHttpServer()).delete('/ratings/r1').expect(500);
    });
  });

  describe('GET /ratings/user/:userId', () => {
    it('valid: 200', async () => {
      ratingService.getRatingsForUser.mockResolvedValue([{ rating_id: 'r1' }]);
      await request(app.getHttpServer()).get('/ratings/user/u2?page=1&limit=20').expect(200);
      expect(ratingService.getRatingsForUser).toHaveBeenCalledWith('u2');
    });

    it('invalid: 500', async () => {
      ratingService.getRatingsForUser.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/ratings/user/u2?page=1&limit=20').expect(500);
    });
  });

  describe('GET /ratings/user/:userId/stats', () => {
    it('valid: 200', async () => {
      ratingService.getUserRatingStats.mockResolvedValue({ avg: 5 });
      await request(app.getHttpServer()).get('/ratings/user/u2/stats').expect(200);
      expect(ratingService.getUserRatingStats).toHaveBeenCalledWith('u2');
    });

    it('invalid: 500', async () => {
      ratingService.getUserRatingStats.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/ratings/user/u2/stats').expect(500);
    });
  });

  describe('GET /ratings/me/given & /ratings/me/received', () => {
    it('valid: given -> 200', async () => {
      ratingService.getRatingsForUser.mockResolvedValue([{ rating_id: 'r1', rater_id: 'user-id-test' }]);
      await request(app.getHttpServer()).get('/ratings/me/given').expect(200);
    });

    it('valid: received -> 200', async () => {
      ratingService.getRatingsForUser.mockResolvedValue([{ rating_id: 'r2' }]);
      await request(app.getHttpServer()).get('/ratings/me/received').expect(200);
    });
  });

  describe('PATCH /ratings/:ratingId/images', () => {
    it('valid: multipart upload -> 200', async () => {
      cloudinaryService.uploadMultipleFiles.mockResolvedValue(['u1']);
      ratingService.addProofImages.mockResolvedValue({ rating_id: 'r1', proof_images: ['u1'] });

      await request(app.getHttpServer())
        .patch('/ratings/r1/images')
        .attach('files', Buffer.from('fake'), 'a.png')
        .expect(200);

      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith('rating_proofs/r1', expect.any(Array));
      expect(ratingService.addProofImages).toHaveBeenCalledWith('user-id-test', 'r1', ['u1']);
    });

    it('invalid: upload throws -> 500', async () => {
      cloudinaryService.uploadMultipleFiles.mockRejectedValue(new Error('upload fail'));
      await request(app.getHttpServer())
        .patch('/ratings/r1/images')
        .attach('files', Buffer.from('fake'), 'a.png')
        .expect(500);
    });
  });
});
