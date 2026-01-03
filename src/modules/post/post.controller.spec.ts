import { Test, TestingModule } from '@nestjs/testing';

import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { CategoryService } from '@modules/category/cateogry.service';
import { PostStatus } from '@common/enums/post-status.enum';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('PostController', () => {
  let controller: PostController;

  let postService: {
    create: jest.Mock;
    updateImageUrls: jest.Mock;
    likePost: jest.Mock;
    unlikePost: jest.Mock;
    savePost: jest.Mock;
    unsavePost: jest.Mock;
    findByUser: jest.Mock;
    findDrafts: jest.Mock;
    getSavedPosts: jest.Mock;
    findOneWithMeta: jest.Mock;
    findAll: jest.Mock;
    update: jest.Mock;
    repost: jest.Mock;
  };

  let cloudinaryService: { uploadMultipleFiles: jest.Mock };
  let categoryService: { findAll: jest.Mock };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    postService = {
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
    cloudinaryService = {
      uploadMultipleFiles: jest.fn(),
    };
    categoryService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: postService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: CategoryService, useValue: categoryService },
      ],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(PostController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('valid: returns categories from CategoryService', async () => {
      // Mục tiêu: controller gọi categoryService.findAll
      categoryService.findAll.mockResolvedValue([{ category_id: 'c1' }]);
      const res = await controller.getCategories();
      expect(categoryService.findAll).toHaveBeenCalledTimes(1);
      expect(res.data).toEqual([{ category_id: 'c1' }]);
    });

    it('invalid: bubbles up errors', async () => {
      categoryService.findAll.mockRejectedValue(new Error('db down'));
      await expect(controller.getCategories()).rejects.toThrow('db down');
    });
  });

  describe('create', () => {
    it('valid: calls postService.create with userId and dto', async () => {
      // Mục tiêu: tạo post không ảnh
      postService.create.mockResolvedValue({ post_id: 'p1' });
      await controller.create(makeReq('u9'), { title: 't' } as any);
      expect(postService.create).toHaveBeenCalledWith('u9', { title: 't' });
    });

    it('invalid: bubbles up errors', async () => {
      postService.create.mockRejectedValue(new Error('invalid dto'));
      await expect(controller.create(makeReq(), {} as any)).rejects.toThrow('invalid dto');
    });
  });

  describe('saveDraft', () => {
    it('valid: forces dto.status to DRAFT and calls create', async () => {
      // Mục tiêu: status luôn là DRAFT bất kể input
      postService.create.mockResolvedValue({ post_id: 'p1' });
      const dto: any = { title: 't', status: 'PUBLISHED' };
      await controller.saveDraft(makeReq('u2'), dto);
      expect(dto.status).toBe(PostStatus.DRAFT);
      expect(postService.create).toHaveBeenCalledWith('u2', dto);
    });

    it('invalid: bubbles up errors', async () => {
      postService.create.mockRejectedValue(new Error('nope'));
      await expect(controller.saveDraft(makeReq(), { title: 't' } as any)).rejects.toThrow('nope');
    });
  });

  describe('uploadPostImages', () => {
    it('valid: uploads images then updates image URLs', async () => {
      // Mục tiêu: cover flow cloudinary -> postService.updateImageUrls
      cloudinaryService.uploadMultipleFiles.mockResolvedValue(['u1', 'u2']);
      postService.updateImageUrls.mockResolvedValue({ post_id: 'p1', image_urls: ['u1', 'u2'] });

      const files = [{ originalname: 'a.png' }] as any;
      await controller.uploadPostImages('p1', makeReq('me'), files);

      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith('p1', files);
      expect(postService.updateImageUrls).toHaveBeenCalledWith('p1', 'me', ['u1', 'u2']);
    });

    it('invalid: bubbles up errors from cloudinary', async () => {
      cloudinaryService.uploadMultipleFiles.mockRejectedValue(new Error('upload fail'));
      await expect(controller.uploadPostImages('p1', makeReq(), [] as any)).rejects.toThrow('upload fail');
    });
  });

  describe('like/unlike', () => {
    it('valid: likePost calls postService.likePost', async () => {
      // Mục tiêu: like gọi service
      postService.likePost.mockResolvedValue({ like_count: 10 });
      await controller.likePost(makeReq('u1'), 'p9');
      expect(postService.likePost).toHaveBeenCalledWith('u1', 'p9');
    });

    it('invalid: likePost bubbles up errors', async () => {
      postService.likePost.mockRejectedValue(new Error('cannot like'));
      await expect(controller.likePost(makeReq('u1'), 'p9')).rejects.toThrow('cannot like');
    });

    it('valid: unlikePost calls postService.unlikePost', async () => {
      postService.unlikePost.mockResolvedValue({ like_count: 9 });
      await controller.unlikePost(makeReq('u1'), 'p9');
      expect(postService.unlikePost).toHaveBeenCalledWith('u1', 'p9');
    });

    it('invalid: unlikePost bubbles up errors', async () => {
      postService.unlikePost.mockRejectedValue(new Error('cannot unlike'));
      await expect(controller.unlikePost(makeReq('u1'), 'p9')).rejects.toThrow('cannot unlike');
    });
  });

  describe('save/unsave', () => {
    it('valid: savePost calls postService.savePost', async () => {
      // Mục tiêu: save gọi service
      postService.savePost.mockResolvedValue(undefined);
      await controller.savePost(makeReq('u1'), 'p1');
      expect(postService.savePost).toHaveBeenCalledWith('u1', 'p1');
    });

    it('invalid: savePost bubbles up errors', async () => {
      postService.savePost.mockRejectedValue(new Error('cannot save'));
      await expect(controller.savePost(makeReq('u1'), 'p1')).rejects.toThrow('cannot save');
    });

    it('valid: unsavePost calls postService.unsavePost', async () => {
      postService.unsavePost.mockResolvedValue(undefined);
      await controller.unsavePost(makeReq('u1'), 'p1');
      expect(postService.unsavePost).toHaveBeenCalledWith('u1', 'p1');
    });

    it('invalid: unsavePost bubbles up errors', async () => {
      postService.unsavePost.mockRejectedValue(new Error('cannot unsave'));
      await expect(controller.unsavePost(makeReq('u1'), 'p1')).rejects.toThrow('cannot unsave');
    });
  });

  describe('getMyPosts/getDrafts', () => {
    it('valid: getMyPosts calls postService.findByUser with paging', async () => {
      // Mục tiêu: controller truyền page/limit
      postService.findByUser.mockResolvedValue({ data: [{ post_id: 'p1' }], total: 1 });
      const res = await controller.getMyPosts(makeReq('u3'), 2, 5);
      expect(postService.findByUser).toHaveBeenCalledWith('u3', 2, 5);
      expect(res.data?.total).toBe(1);
    });

    it('invalid: getMyPosts bubbles up errors', async () => {
      postService.findByUser.mockRejectedValue(new Error('boom'));
      await expect(controller.getMyPosts(makeReq('u3'), 1, 20)).rejects.toThrow('boom');
    });

    it('valid: getDrafts calls postService.findDrafts with paging', async () => {
      postService.findDrafts.mockResolvedValue({ data: [{ post_id: 'p1' }], total: 1 });
      await controller.getDrafts(makeReq('u3'), 1, 10);
      expect(postService.findDrafts).toHaveBeenCalledWith('u3', 1, 10);
    });

    it('invalid: getDrafts bubbles up errors', async () => {
      postService.findDrafts.mockRejectedValue(new Error('boom'));
      await expect(controller.getDrafts(makeReq('u3'), 1, 10)).rejects.toThrow('boom');
    });
  });

  describe('getSavedPosts', () => {
    it('valid: maps saved posts without crashing', async () => {
      // Mục tiêu: cover mapping DTO thủ công
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

      const res = await controller.getSavedPosts(makeReq('me'), 1, 20);
      expect(postService.getSavedPosts).toHaveBeenCalledWith('me', 1, 20);
      expect(res.data?.data[0].post_id).toBe('p1');
    });

    it('invalid: bubbles up errors', async () => {
      postService.getSavedPosts.mockRejectedValue(new Error('boom'));
      await expect(controller.getSavedPosts(makeReq('me'), 1, 20)).rejects.toThrow('boom');
    });
  });

  describe('findOne/findAll/update', () => {
    it('valid: findOne calls postService.findOneWithMeta', async () => {
      // Mục tiêu: controller truyền postId + viewerId
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

      await controller.findOne(makeReq('viewer'), 'p1');
      expect(postService.findOneWithMeta).toHaveBeenCalledWith('p1', 'viewer');
    });

    it('invalid: findOne bubbles up errors', async () => {
      postService.findOneWithMeta.mockRejectedValue(new Error('not found'));
      await expect(controller.findOne(makeReq('viewer'), 'p1')).rejects.toThrow('not found');
    });

    it('valid: findAll calls postService.findAll with filters and paging', async () => {
      postService.findAll.mockResolvedValue({ data: [], total: 0 });
      await controller.findAll(makeReq('viewer'), 'c1', 1, 20);
      expect(postService.findAll).toHaveBeenCalledWith({ category_id: 'c1' }, 1, 20, 'viewer');
    });

    it('invalid: findAll bubbles up errors', async () => {
      postService.findAll.mockRejectedValue(new Error('boom'));
      await expect(controller.findAll(makeReq('viewer'), 'c1', 1, 20)).rejects.toThrow('boom');
    });

    it('valid: update calls postService.update', async () => {
      postService.update.mockResolvedValue({ post_id: 'p1' });
      await controller.update('p1', makeReq('owner'), { title: 'new' } as any);
      expect(postService.update).toHaveBeenCalledWith('p1', 'owner', { title: 'new' });
    });

    it('invalid: update bubbles up errors', async () => {
      postService.update.mockRejectedValue(new Error('forbidden'));
      await expect(controller.update('p1', makeReq('owner'), {} as any)).rejects.toThrow('forbidden');
    });
  });

  describe('repost', () => {
    it('valid: uses repostDto.original_post_id when provided', async () => {
      // Mục tiêu: cover nhánh chọn original_post_id
      postService.repost.mockResolvedValue({ post_id: 'new' });
      await controller.repost('pFromParam', makeReq('me'), {
        original_post_id: 'pFromBody',
        title: 't',
        description: 'd',
      } as any);
      expect(postService.repost).toHaveBeenCalledWith('me', 'pFromBody', 't', 'd');
    });

    it('valid: falls back to param postId when original_post_id missing', async () => {
      postService.repost.mockResolvedValue({ post_id: 'new' });
      await controller.repost('pFromParam', makeReq('me'), {
        title: 't',
        description: 'd',
      } as any);
      expect(postService.repost).toHaveBeenCalledWith('me', 'pFromParam', 't', 'd');
    });

    it('invalid: repost bubbles up errors', async () => {
      postService.repost.mockRejectedValue(new Error('not found'));
      await expect(controller.repost('p1', makeReq('me'), {} as any)).rejects.toThrow('not found');
    });
  });
});
