import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { PostController } from '../src/modules/post/post.controller';
import { PostService } from '../src/modules/post/post.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { CategoryService } from '@modules/category/cateogry.service';

describe('PostController (e2e)', () => {
  let app: INestApplication;

  const validCreatePostPayload = {
    category_id: '048de9e8-f159-496d-ac14-cb699af30bb1',
    title: 't',
    description: 'd',
    transaction_type: 'BAN_RE',
  };

  const postService = {
    create: jest.fn(),
    updateImageUrls: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    savePost: jest.fn(),
    unsavePost: jest.fn(),
    findByUser: jest.fn(),
    findDrafts: jest.fn(),
    getSavedPosts: jest.fn(),
    findOneWithMeta: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    repost: jest.fn(),
  };

  const cloudinaryService = {
    uploadMultipleFiles: jest.fn(),
  };

  const categoryService = {
    findAll: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: postService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: CategoryService, useValue: categoryService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /posts/categories', () => {
    it('valid: 200', async () => {
      categoryService.findAll.mockResolvedValue([{ category_id: 'c1' }]);
      await request(app.getHttpServer()).get('/posts/categories').expect(200);
      expect(categoryService.findAll).toHaveBeenCalledTimes(1);
    });

    it('invalid: service throws -> 500', async () => {
      categoryService.findAll.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/posts/categories').expect(500);
    });
  });

  describe('POST /posts', () => {
    it('valid: 201', async () => {
      postService.create.mockResolvedValue({ post_id: 'p1' });
      await request(app.getHttpServer()).post('/posts').send(validCreatePostPayload).expect(201);
      expect(postService.create).toHaveBeenCalledWith('user-id-test', expect.any(Object));
    });

    it('invalid: service throws -> 500', async () => {
      postService.create.mockRejectedValue(new Error('invalid dto'));
      await request(app.getHttpServer()).post('/posts').send(validCreatePostPayload).expect(500);
    });
  });

  describe('POST /posts/save', () => {
    it('valid: 201', async () => {
      postService.create.mockResolvedValue({ post_id: 'p1' });
      await request(app.getHttpServer()).post('/posts/save').send(validCreatePostPayload).expect(201);
    });

    it('invalid: service throws -> 500', async () => {
      postService.create.mockRejectedValue(new Error('nope'));
      await request(app.getHttpServer()).post('/posts/save').send(validCreatePostPayload).expect(500);
    });
  });

  describe('PATCH /posts/:postId/images', () => {
    it('valid: multipart upload -> 200', async () => {
      cloudinaryService.uploadMultipleFiles.mockResolvedValue(['u1']);
      postService.updateImageUrls.mockResolvedValue({ post_id: 'p1', image_urls: ['u1'] });

      await request(app.getHttpServer())
        .patch('/posts/p1/images')
        .attach('files', Buffer.from('fake'), 'a.png')
        .expect(200);

      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalled();
      expect(postService.updateImageUrls).toHaveBeenCalledWith('p1', 'user-id-test', ['u1']);
    });

    it('invalid: cloudinary throws -> 500', async () => {
      cloudinaryService.uploadMultipleFiles.mockRejectedValue(new Error('upload fail'));

      await request(app.getHttpServer())
        .patch('/posts/p1/images')
        .attach('files', Buffer.from('fake'), 'a.png')
        .expect(500);
    });
  });

  describe('POST/DELETE /posts/:postId/like', () => {
    it('valid: like -> 201', async () => {
      postService.likePost.mockResolvedValue({ like_count: 1 });
      await request(app.getHttpServer()).post('/posts/p1/like').expect(201);
      expect(postService.likePost).toHaveBeenCalledWith('user-id-test', 'p1');
    });

    it('invalid: like -> 500', async () => {
      postService.likePost.mockRejectedValue(new Error('cannot like'));
      await request(app.getHttpServer()).post('/posts/p1/like').expect(500);
    });

    it('valid: unlike -> 200', async () => {
      postService.unlikePost.mockResolvedValue({ like_count: 0 });
      await request(app.getHttpServer()).delete('/posts/p1/like').expect(200);
      expect(postService.unlikePost).toHaveBeenCalledWith('user-id-test', 'p1');
    });

    it('invalid: unlike -> 500', async () => {
      postService.unlikePost.mockRejectedValue(new Error('cannot unlike'));
      await request(app.getHttpServer()).delete('/posts/p1/like').expect(500);
    });
  });

  describe('POST/DELETE /posts/:postId/save', () => {
    it('valid: save -> 201', async () => {
      postService.savePost.mockResolvedValue(undefined);
      await request(app.getHttpServer()).post('/posts/p1/save').expect(201);
      expect(postService.savePost).toHaveBeenCalledWith('user-id-test', 'p1');
    });

    it('invalid: save -> 500', async () => {
      postService.savePost.mockRejectedValue(new Error('cannot save'));
      await request(app.getHttpServer()).post('/posts/p1/save').expect(500);
    });

    it('valid: unsave -> 200', async () => {
      postService.unsavePost.mockResolvedValue(undefined);
      await request(app.getHttpServer()).delete('/posts/p1/save').expect(200);
      expect(postService.unsavePost).toHaveBeenCalledWith('user-id-test', 'p1');
    });

    it('invalid: unsave -> 500', async () => {
      postService.unsavePost.mockRejectedValue(new Error('cannot unsave'));
      await request(app.getHttpServer()).delete('/posts/p1/save').expect(500);
    });
  });

  describe('GET /posts/me & /posts/drafts', () => {
    it('valid: me -> 200', async () => {
      postService.findByUser.mockResolvedValue({ data: [], total: 0 });
      await request(app.getHttpServer()).get('/posts/me?page=1&limit=2').expect(200);
      expect(postService.findByUser).toHaveBeenCalledWith('user-id-test', 1, 2);
    });

    it('invalid: me -> 500', async () => {
      postService.findByUser.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/posts/me?page=1&limit=2').expect(500);
    });

    it('valid: drafts -> 200', async () => {
      postService.findDrafts.mockResolvedValue({ data: [], total: 0 });
      await request(app.getHttpServer()).get('/posts/drafts?page=1&limit=2').expect(200);
      expect(postService.findDrafts).toHaveBeenCalledWith('user-id-test', 1, 2);
    });

    it('invalid: drafts -> 500', async () => {
      postService.findDrafts.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/posts/drafts?page=1&limit=2').expect(500);
    });
  });

  describe('GET /posts/saved', () => {
    it('valid: 200', async () => {
      postService.getSavedPosts.mockResolvedValue({
        data: [
          {
            post: {
              post_id: 'p1',
              title: 't',
              description: 'd',
              price: '100',
              location: 'loc',
              transaction_type: 'sell',
              image_urls: [],
              view_count: 0,
              created_at: new Date(),
              updated_at: new Date(),
              user: { user_id: 'u2', full_name: 'Bob', avatar_url: 'a' },
              category: { category_id: 'c1', category_name: 'cat' },
            },
            like_count: 7,
            poster_rating: 4.5,
          },
        ],
        total: 1,
      });

      await request(app.getHttpServer()).get('/posts/saved?page=1&limit=20').expect(200);
    });

    it('invalid: 500', async () => {
      postService.getSavedPosts.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/posts/saved?page=1&limit=20').expect(500);
    });
  });

  describe('GET /posts/:postId and GET /posts', () => {
    it('valid: findOne -> 200', async () => {
      postService.findOneWithMeta.mockResolvedValue({
        post_id: 'p1',
        title: 't',
        description: 'd',
        price: '10',
        location: 'loc',
        is_available: true,
        status: 'PUBLISHED',
        transaction_type: 'sell',
        view_count: 0,
        image_urls: [],
        created_at: new Date(),
        user: { user_id: 'u2', full_name: 'Bob', avatar_url: 'a' },
        category: { category_id: 'c1', category_name: 'cat' },
      });

      await request(app.getHttpServer()).get('/posts/p1').expect(200);
      expect(postService.findOneWithMeta).toHaveBeenCalledWith('p1', 'user-id-test');
    });

    it('invalid: findOne -> 500', async () => {
      postService.findOneWithMeta.mockRejectedValue(new Error('not found'));
      await request(app.getHttpServer()).get('/posts/p1').expect(500);
    });

    it('valid: findAll -> 200', async () => {
      postService.findAll.mockResolvedValue({ data: [], total: 0 });
      await request(app.getHttpServer()).get('/posts?category_id=c1&page=1&limit=20').expect(200);
      expect(postService.findAll).toHaveBeenCalledWith({ category_id: 'c1' }, 1, 20, 'user-id-test');
    });

    it('invalid: findAll -> 500', async () => {
      postService.findAll.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/posts?category_id=c1&page=1&limit=20').expect(500);
    });
  });

  describe('PATCH /posts/:postId', () => {
    it('valid: 200', async () => {
      postService.update.mockResolvedValue({ post_id: 'p1' });
      await request(app.getHttpServer()).patch('/posts/p1').send({ title: 'new' }).expect(200);
      expect(postService.update).toHaveBeenCalledWith('p1', 'user-id-test', expect.any(Object));
    });

    it('invalid: 500', async () => {
      postService.update.mockRejectedValue(new Error('forbidden'));
      await request(app.getHttpServer()).patch('/posts/p1').send({}).expect(500);
    });
  });

  describe('POST /posts/:postId/repost', () => {
    it('valid: 201', async () => {
      postService.repost.mockResolvedValue({ post_id: 'new' });
      await request(app.getHttpServer())
        .post('/posts/pFromParam/repost')
        .send({
          // DTO yêu cầu original_post_id là UUID
          original_post_id: '550e8400-e29b-41d4-a716-446655440000',
          title: 't',
          description: 'd',
        })
        .expect(201);
      expect(postService.repost).toHaveBeenCalledWith(
        'user-id-test',
        '550e8400-e29b-41d4-a716-446655440000',
        't',
        'd',
      );
    });

    it('invalid: 500', async () => {
      postService.repost.mockRejectedValue(new Error('not found'));
      await request(app.getHttpServer())
        .post('/posts/p1/repost')
        // gửi payload hợp lệ để đi tới service, rồi service throw -> 500
        .send({ original_post_id: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(500);
    });
  });
});
