import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '@modules/entities/post.entity'; 
import { CreatePostDto } from './dto/CreatePost.dto';
import { UpdatePostDto } from './dto/UpdatePost.dto';
import { PostTransactionType } from '@common/enums/post-transaction-type.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
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
    });

    return this.postsRepository.save(newPost);
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
}