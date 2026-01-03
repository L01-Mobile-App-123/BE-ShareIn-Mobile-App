import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { UserController } from '../src/modules/users/user.controller';
import { UsersService } from '../src/modules/users/user.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  const userService = {
    findOne: jest.fn(),
    update: jest.fn(),
    updateAvatar: jest.fn(),
  };

  const cloudinaryService = {
    uploadAvatarAndReplace: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [UserController],
      providers: [
        { provide: UsersService, useValue: userService },
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

  describe('GET /users', () => {
    it('valid: 200', async () => {
      userService.findOne.mockResolvedValue({ user_id: 'user-id-test' });
      await request(app.getHttpServer()).get('/users').expect(200);
      expect(userService.findOne).toHaveBeenCalledWith('user-id-test');
    });

    it('invalid: 500', async () => {
      userService.findOne.mockRejectedValue(new Error('not found'));
      await request(app.getHttpServer()).get('/users').expect(500);
    });
  });

  describe('PATCH /users', () => {
    it('valid: 200', async () => {
      userService.update.mockResolvedValue({ user_id: 'user-id-test', full_name: 'New' });
      await request(app.getHttpServer()).patch('/users').send({ full_name: 'New' }).expect(200);
      expect(userService.update).toHaveBeenCalledWith('user-id-test', expect.any(Object));
    });

    it('invalid: 500', async () => {
      userService.update.mockRejectedValue(new Error('bad request'));
      await request(app.getHttpServer()).patch('/users').send({}).expect(500);
    });
  });

  describe('PATCH /users/avatar', () => {
    it('valid: multipart upload -> 200', async () => {
      userService.findOne.mockResolvedValue({ user_id: 'user-id-test', avatar_url: 'old' });
      cloudinaryService.uploadAvatarAndReplace.mockResolvedValue('new-url');
      userService.updateAvatar.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/users/avatar')
        .attach('file', Buffer.from('fake'), 'a.png')
        .expect(200);

      expect(userService.findOne).toHaveBeenCalledWith('user-id-test');
      expect(userService.updateAvatar).toHaveBeenCalledWith('user-id-test', 'new-url');
    });

    it('invalid: upload throws -> 500', async () => {
      userService.findOne.mockResolvedValue({ user_id: 'user-id-test' });
      cloudinaryService.uploadAvatarAndReplace.mockRejectedValue(new Error('upload fail'));

      await request(app.getHttpServer())
        .patch('/users/avatar')
        .attach('file', Buffer.from('fake'), 'a.png')
        .expect(500);
    });
  });
});
