import { Test, TestingModule } from '@nestjs/testing';

import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('RatingController', () => {
  let controller: RatingController;
  let ratingService: {
    createRating: jest.Mock;
    updateRating: jest.Mock;
    deleteRating: jest.Mock;
    getRatingsForUser: jest.Mock;
    getUserRatingStats: jest.Mock;
    addProofImages: jest.Mock;
  };
  let cloudinaryService: { uploadMultipleFiles: jest.Mock };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    ratingService = {
      createRating: jest.fn(),
      updateRating: jest.fn(),
      deleteRating: jest.fn(),
      getRatingsForUser: jest.fn(),
      getUserRatingStats: jest.fn(),
      addProofImages: jest.fn(),
    };
    cloudinaryService = {
      uploadMultipleFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingController],
      providers: [
        { provide: RatingService, useValue: ratingService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(RatingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRating', () => {
    it('valid: calls ratingService.createRating with raterId', async () => {
      // Mục tiêu: lấy raterId từ req.user
      ratingService.createRating.mockResolvedValue({ rating_id: 'r1' });
      await controller.createRating({ stars: 5 } as any, makeReq('me'));
      expect(ratingService.createRating).toHaveBeenCalledWith('me', { stars: 5 });
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.createRating.mockRejectedValue(new Error('bad request'));
      await expect(controller.createRating({} as any, makeReq())).rejects.toThrow('bad request');
    });
  });

  describe('updateRating', () => {
    it('valid: calls ratingService.updateRating with raterId + ratingId', async () => {
      ratingService.updateRating.mockResolvedValue({ rating_id: 'r1' });
      await controller.updateRating('r1', { comment: 'x' } as any, makeReq('me'));
      expect(ratingService.updateRating).toHaveBeenCalledWith('me', 'r1', { comment: 'x' });
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.updateRating.mockRejectedValue(new Error('forbidden'));
      await expect(controller.updateRating('r1', {} as any, makeReq('me'))).rejects.toThrow('forbidden');
    });
  });

  describe('deleteRating', () => {
    it('valid: calls ratingService.deleteRating', async () => {
      ratingService.deleteRating.mockResolvedValue(undefined);
      await controller.deleteRating('r1', makeReq('me'));
      expect(ratingService.deleteRating).toHaveBeenCalledWith('me', 'r1');
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.deleteRating.mockRejectedValue(new Error('forbidden'));
      await expect(controller.deleteRating('r1', makeReq('me'))).rejects.toThrow('forbidden');
    });
  });

  describe('getUserRatings', () => {
    it('valid: paginates in controller (slice)', async () => {
      // Mục tiêu: cover phân trang thủ công
      ratingService.getRatingsForUser.mockResolvedValue([
        { rating_id: 'r1' },
        { rating_id: 'r2' },
        { rating_id: 'r3' },
      ]);
      const res = await controller.getUserRatings('u-target', 2, 2);
      expect(ratingService.getRatingsForUser).toHaveBeenCalledWith('u-target');
      expect(res.data?.data).toHaveLength(1);
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.getRatingsForUser.mockRejectedValue(new Error('boom'));
      await expect(controller.getUserRatings('u-target', 1, 20)).rejects.toThrow('boom');
    });
  });

  describe('getUserRatingStats', () => {
    it('valid: calls ratingService.getUserRatingStats', async () => {
      ratingService.getUserRatingStats.mockResolvedValue({ avg: 5 });
      await controller.getUserRatingStats('u1');
      expect(ratingService.getUserRatingStats).toHaveBeenCalledWith('u1');
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.getUserRatingStats.mockRejectedValue(new Error('boom'));
      await expect(controller.getUserRatingStats('u1')).rejects.toThrow('boom');
    });
  });

  describe('getMyGivenRatings', () => {
    it('valid: filters ratings where rater_id equals current user', async () => {
      // Mục tiêu: cover filter given ratings
      ratingService.getRatingsForUser.mockResolvedValue([
        { rating_id: 'r1', rater_id: 'me' },
        { rating_id: 'r2', rater_id: 'someone-else' },
      ]);
      const res = await controller.getMyGivenRatings(makeReq('me'));
      expect(res.data).toHaveLength(1);
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.getRatingsForUser.mockRejectedValue(new Error('boom'));
      await expect(controller.getMyGivenRatings(makeReq('me'))).rejects.toThrow('boom');
    });
  });

  describe('getMyReceivedRatings', () => {
    it('valid: returns ratings for current user', async () => {
      ratingService.getRatingsForUser.mockResolvedValue([{ rating_id: 'r1' }]);
      await controller.getMyReceivedRatings(makeReq('me'));
      expect(ratingService.getRatingsForUser).toHaveBeenCalledWith('me');
    });

    it('invalid: bubbles up errors', async () => {
      ratingService.getRatingsForUser.mockRejectedValue(new Error('boom'));
      await expect(controller.getMyReceivedRatings(makeReq('me'))).rejects.toThrow('boom');
    });
  });

  describe('addImages', () => {
    it('valid: uploads images then calls ratingService.addProofImages', async () => {
      // Mục tiêu: cover upload + addProofImages
      cloudinaryService.uploadMultipleFiles.mockResolvedValue(['u1']);
      ratingService.addProofImages.mockResolvedValue({ rating_id: 'r1', proof_images: ['u1'] });
      const files = [{ originalname: 'a.png' }] as any;
      await controller.addImages('r1', files, makeReq('me'));
      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith('rating_proofs/r1', files);
      expect(ratingService.addProofImages).toHaveBeenCalledWith('me', 'r1', ['u1']);
    });

    it('invalid: bubbles up errors', async () => {
      cloudinaryService.uploadMultipleFiles.mockRejectedValue(new Error('upload fail'));
      await expect(controller.addImages('r1', [] as any, makeReq('me'))).rejects.toThrow('upload fail');
    });
  });
});
