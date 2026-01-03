import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';
import { UsersService } from './user.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: { findOne: jest.Mock; update: jest.Mock; updateAvatar: jest.Mock };
  let cloudinaryService: { uploadAvatarAndReplace: jest.Mock };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    userService = {
      findOne: jest.fn(),
      update: jest.fn(),
      updateAvatar: jest.fn(),
    };
    cloudinaryService = {
      uploadAvatarAndReplace: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UsersService, useValue: userService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('valid: calls userService.findOne with current userId', async () => {
      // Mục tiêu: lấy profile của user hiện tại
      userService.findOne.mockResolvedValue({ user_id: 'me' });
      await controller.findOne(makeReq('me'));
      expect(userService.findOne).toHaveBeenCalledWith('me');
    });

    it('invalid: bubbles up errors', async () => {
      userService.findOne.mockRejectedValue(new Error('not found'));
      await expect(controller.findOne(makeReq('me'))).rejects.toThrow('not found');
    });
  });

  describe('update', () => {
    it('valid: calls userService.update with current userId and dto', async () => {
      userService.update.mockResolvedValue({ user_id: 'me', full_name: 'New' });
      await controller.update(makeReq('me'), { full_name: 'New' } as any);
      expect(userService.update).toHaveBeenCalledWith('me', { full_name: 'New' });
    });

    it('invalid: bubbles up errors', async () => {
      userService.update.mockRejectedValue(new Error('bad request'));
      await expect(controller.update(makeReq('me'), {} as any)).rejects.toThrow('bad request');
    });
  });

  describe('uploadSingleAvatar', () => {
    it('valid: uploads avatar then updates user avatar url', async () => {
      // Mục tiêu: cover flow findOne -> upload -> updateAvatar
      const file = { originalname: 'a.png' } as any;
      userService.findOne.mockResolvedValue({ user_id: 'me', avatar_url: 'old' });
      cloudinaryService.uploadAvatarAndReplace.mockResolvedValue('new-url');
      userService.updateAvatar.mockResolvedValue(undefined);

      await controller.uploadSingleAvatar(makeReq('me'), file);

      expect(userService.findOne).toHaveBeenCalledWith('me');
      expect(cloudinaryService.uploadAvatarAndReplace).toHaveBeenCalledWith(file, {
        user_id: 'me',
        avatar_url: 'old',
      });
      expect(userService.updateAvatar).toHaveBeenCalledWith('me', 'new-url');
    });

    it('invalid: bubbles up errors from upload', async () => {
      const file = { originalname: 'a.png' } as any;
      userService.findOne.mockResolvedValue({ user_id: 'me' });
      cloudinaryService.uploadAvatarAndReplace.mockRejectedValue(new Error('upload fail'));
      await expect(controller.uploadSingleAvatar(makeReq('me'), file)).rejects.toThrow('upload fail');
    });
  });
});
