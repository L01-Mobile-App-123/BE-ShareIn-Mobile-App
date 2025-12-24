import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@modules/entities/post.entity'; 
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';
import { PostLike } from '@modules/entities/post-like.entity';
import { PostSave } from '@modules/entities/post-save.entity';
import { Rating } from '@modules/entities/rating.entity';
import { PostStatus } from '@common/enums/post-status.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostSave)
    private postSaveRepository: Repository<PostSave>,
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
  ) {}

  async create(user_id: string, createPostDto: CreatePostDto): Promise<Post> {
    //Kiểm tra logic nghiệp vụ (ví dụ: giá phải có nếu là bán)
    if (createPostDto.transaction_type === PostTransactionType.SELL && (createPostDto.price === undefined || createPostDto.price === null)) {
      throw new BadRequestException('Trường giá (price) là bắt buộc khi loại giao dịch là BÁN_RE.');
    }
      
    const newPost = this.postsRepository.create({
      ...createPostDto,
      user_id,
      image_urls: [], // Khởi tạo mảng rỗng, sẽ được cập nhật sau khi upload
      status: createPostDto.status || undefined,
    });

    const savedPost = await this.postsRepository.save(newPost);
    return savedPost;
  }

  async findOne(post_id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { post_id },
      relations: ['user', 'category'], // Load quan hệ
    });

    if (!post) {
      throw new NotFoundException(`Không tìm thấy bài đăng với ID "${post_id}".`);
    }
    
    // Tăng view_count (không chờ)
    this.postsRepository.increment({ post_id }, 'view_count', 1).catch(e => console.error('Failed to increment view count:', e));

    return post;
  }
  
  async findAll(filters: { user_id?: string; category_id?: string; is_available?: boolean }, page = 1, limit = 20): Promise<{ data: Post[], total: number }> {
    const skip = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    const where: any = { is_available: true, ...filters };
    if (filters.is_available !== undefined) {
        where.is_available = filters.is_available;
    }

    const [data, total] = await this.postsRepository.findAndCount({
      where: where,
      relations: ['user', 'category'],
      take: limit,
      skip: skip,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async update(post_id: string, user_id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { post_id } });

    if (!post) {
      throw new NotFoundException(`Bài đăng với ID "${post_id}" không tồn tại.`);
    }

    // Kiểm tra quyền sở hữu
    if (post.user_id !== user_id) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đăng này.');
    }
    
    // Cập nhật các trường
    Object.assign(post, updatePostDto);

    // Kiểm tra logic nghiệp vụ lại (nếu người dùng thay đổi transaction_type)
    if (post.transaction_type === PostTransactionType.SELL && (post.price === undefined || post.price === null)) {
        throw new BadRequestException('Trường giá (price) là bắt buộc khi loại giao dịch là BÁN_RE.');
    }

    return this.postsRepository.save(post);
  }
  
  async updateImageUrls(post_id: string, user_id: string, imageUrls: string[]): Promise<Post> {
      const post = await this.postsRepository.findOne({ where: { post_id } });

      if (!post) {
          throw new NotFoundException(`Bài đăng với ID "${post_id}" không tồn tại.`);
      }

      if (post.user_id !== user_id) {
          throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đăng này.');
      }
      
      // Giới hạn số lượng ảnh (tùy chọn)
      if (imageUrls.length > 10) {
           throw new BadRequestException('Chỉ được phép tải lên tối đa 10 ảnh.');
      }

      post.image_urls = imageUrls;
      return this.postsRepository.save(post);
  }

  async findByUser(user_id: string, page = 1, limit = 20): Promise<{ data: Post[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.postsRepository.findAndCount({
      where: { user_id },
      relations: ['category'],
      take: limit,
      skip: skip,
      order: { created_at: 'DESC' },
    });
    return { data, total};
  }

  async findDrafts(user_id: string, page = 1, limit = 20): Promise<{ data: Post[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.postsRepository.findAndCount({
      where: { user_id, status: PostStatus.DRAFT },
      relations: ['category'],
      take: limit,
      skip,
      order: { created_at: 'DESC' },
    });
    return { data, total };
  }

  async likePost(user_id: string, post_id: string): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { post_id } });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');
    if (post.user_id === user_id) throw new ForbiddenException('Không thể tự like bài viết của mình');

    const existed = await this.postLikeRepository.findOne({ where: { user_id, post_id } });
    if (existed) throw new ConflictException('Bạn đã like bài viết này');

    const like = this.postLikeRepository.create({ user_id, post_id });
    await this.postLikeRepository.save(like);
  }

  async unlikePost(user_id: string, post_id: string): Promise<void> {
    await this.postLikeRepository.delete({ user_id, post_id });
  }

  async savePost(user_id: string, post_id: string): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { post_id } });
    if (!post) throw new NotFoundException('Bài đăng không tồn tại');
    if (post.user_id === user_id) throw new ForbiddenException('Không thể lưu bài viết của chính mình');

    const existed = await this.postSaveRepository.findOne({ where: { user_id, post_id } });
    if (existed) throw new ConflictException('Bạn đã lưu bài viết này');

    await this.postSaveRepository.save(this.postSaveRepository.create({ user_id, post_id }));
  }

  async unsavePost(user_id: string, post_id: string): Promise<void> {
    await this.postSaveRepository.delete({ user_id, post_id });
  }

  async getSavedPosts(
    user_id: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Array<{ post: Post; like_count: number; poster_rating: number }>; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      // Lấy danh sách saved posts với pagination
      const [savedPosts, total] = await this.postSaveRepository.findAndCount({
        where: { user_id },
        relations: ['post', 'post.user', 'post.category'],
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      });

      // Build data với like_count và poster_rating cho mỗi bài
      const data = await Promise.all(
        savedPosts
          .filter(save => save.post && save.post.user && save.post.user_id !== user_id) // Lọc bài của người khác, loại null
          .map(async (save) => {
            const post = save.post;

            // Đếm số like
            const like_count = await this.postLikeRepository.count({
              where: { post_id: post.post_id },
            });

            // Tính rating trung bình của người đăng
            const ratings = await this.ratingRepository.find({
              where: { rated_user_id: post.user_id },
            });
            const poster_rating = ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating_score, 0) / ratings.length
              : 0;

            return { post, like_count, poster_rating };
          })
      );

      return { data, total: data.length, page, limit };
    } catch (error) {
      console.error('Error in getSavedPosts:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách bài viết đã lưu');
    }
  }
    
  async softDeleteOrHide(post_id: string, user_id: string, action: 'hide' | 'delete'): Promise<{ message: string }> {
    const post = await this.postsRepository.findOne({ where: { post_id } });

    if (!post) {
      throw new NotFoundException(`Bài đăng với ID "${post_id}" không tồn tại.`);
    }

    if (post.user_id !== user_id) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này.');
    }

    if (action === 'hide') {
      // Ẩn/Hiện: Thay đổi is_available
      post.is_available = !post.is_available;
      await this.postsRepository.save(post);
      return { message: post.is_available ? 'Bài đăng đã được hiển thị lại.' : 'Bài đăng đã được ẩn thành công.' };
    } else if (action === 'delete') {
      // Xóa mềm: Trong TypeORM/NestJS, bạn cần dùng `@DeleteDateColumn()` trong entity
      // Giả sử Entity của bạn có `deleted_at: Date` (TypeORM Soft Delete)
      // Nếu entity không có Soft Delete, ta dùng Hard Delete.
      
      // Nếu có Soft Delete:
      // await this.postsRepository.softDelete(post_id); 
      
      // Nếu không có Soft Delete (chỉ dùng is_available):
      // Đánh dấu là không còn khả dụng
      post.is_available = false;
      await this.postsRepository.save(post);
      // Bạn có thể thêm logic xóa hard/soft tùy vào yêu cầu DB
      
      return { message: 'Bài đăng đã được xóa thành công.' };
    }
    
    return { message: 'Hành động không hợp lệ.' };
  }

  /**
   * Sao chép/Repost một bài đăng cũ
   */
  async repost(user_id: string, originalPostId: string, title?: string, description?: string): Promise<Post> {
    // 1. Tìm bài đăng gốc
    const originalPost = await this.postsRepository.findOne({
      where: { post_id: originalPostId },
      relations: ['category'],
    });

    if (!originalPost) {
      throw new NotFoundException('Không tìm thấy bài đăng gốc để sao chép.');
    }

    // 2. Tạo bài đăng mới dựa trên bài cũ
    const newPost = this.postsRepository.create({
      user_id,
      category_id: originalPost.category_id,
      title: title || originalPost.title,
      description: description || originalPost.description,
      transaction_type: originalPost.transaction_type,
      price: originalPost.price,
      image_urls: [...(originalPost.image_urls || [])], // Copy ảnh
      is_available: true,
    });

    const savedPost = await this.postsRepository.save(newPost);
    return savedPost;
  }
}