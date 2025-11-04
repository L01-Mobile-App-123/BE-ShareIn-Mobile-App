import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpStatus, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/CreatePost.dto';
import { UpdatePostDto } from './dto/UpdatePost.dto';
import { GetPostDto } from './dto/GetPost.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard'
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { ApiResponseDto } from '@common/dto/api-response.dto'
// Giả định: Import UploadController, CloudinaryService, Multer...
// import { FileInterceptor, UploadedFiles } from '@nestjs/platform-express';
// import { UseInterceptors } from '@nestjs/common';
// import { FilesInterceptor } from '@nestjs/platform-express';
// import { FileUploadDto } from '../uploads/dto/upload.dto'; // DTO cho Multer/Swagger
// ...

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Giả định User ID từ Token (thực tế lấy từ req.user.user_id)
  private getUserIdFromRequest(): string {
    return 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; 
  }

  // --- API 1: Đăng bài mới (Create) ---
  @Post()
  @ApiOperation({ summary: 'Tạo bài đăng mới (KHÔNG KÈM ẢNH). Cần cập nhật ảnh sau đó.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bài đăng đã được tạo.', type: GetPostDto })
  async create(@Body() createPostDto: CreatePostDto): Promise<GetPostDto> {
    const user_id = this.getUserIdFromRequest();
    const post = await this.postService.create(user_id, createPostDto);
    return plainToInstance(GetPostDto, post);
  }

  // --- API 2: Tải ảnh cho Bài đăng ---
  // API này sẽ xử lý phần 6, 11 (kiểm tra ảnh), và 13 (thành công) trong luồng của bạn.
  @Patch(':postId/images')
  @ApiOperation({ summary: 'Tải lên nhiều ảnh cho một bài đăng (Ghi đè/thay thế MẢNG ảnh cũ). Tối đa 10 ảnh.' })
  @ApiConsumes('multipart/form-data')
  // @ApiBody({ type: FileUploadDto }) // DTO cần định nghĩa cho Multer/Swagger
  @ApiResponse({ status: HttpStatus.OK, description: 'Cập nhật danh sách ảnh thành công.', type: GetPostDto })
  // @UseInterceptors(FilesInterceptor('files')) // 'files' là tên field trong form-data
  async uploadPostImages(
    @Param('postId') postId: string,
    // @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<GetPostDto> {
    const user_id = this.getUserIdFromRequest();
    
    // --- BƯỚC 1: Xử lý Upload lên Cloudinary ---
    // Giả định:
    // const imageUrls = await this.cloudinaryService.uploadMultipleFiles(files);
    
    // Dữ liệu giả định cho demo:
    const imageUrls = ['url_anh_1', 'url_anh_2']; 
    // --- KẾT THÚC BƯỚC 1 ---
    
    // BƯỚC 2: Lưu các URL ảnh vào DB
    const updatedPost = await this.postService.updateImageUrls(postId, user_id, imageUrls);
    
    return plainToInstance(GetPostDto, updatedPost);
  }


  // --- API 3: Xem chi tiết bài đăng ---
  @Get(':postId')
  @ApiOperation({ summary: 'Xem chi tiết một bài đăng' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chi tiết bài đăng.', type: GetPostDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy.' })
  async findOne(@Param('postId') postId: string): Promise<GetPostDto> {
    const post = await this.postService.findOne(postId);
    return plainToInstance(GetPostDto, post);
  }

  // --- API 4: Lấy danh sách bài đăng (List) ---
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bài đăng (có thể lọc)' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Lọc theo ID danh mục' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Lọc theo ID người dùng' })
  @ApiQuery({ name: 'is_available', required: false, description: 'Trạng thái khả dụng (true/false)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Danh sách bài đăng.', type: [GetPostDto] })
  async findAll(
    @Query('user_id') userId: string,
    @Query('category_id') categoryId: string,
    @Query('is_available') isAvailable: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const filters = {
        user_id: userId,
        category_id: categoryId,
        is_available: isAvailable ? (isAvailable === 'true') : undefined, // Chuyển string 'true'/'false' sang boolean
    };
    
    const { data, total } = await this.postService.findAll(filters, page, limit);
    
    return {
        data: plainToInstance(GetPostDto, data),
        total: total,
        page: page,
        limit: limit,
    };
  }

  // --- API 5: Cập nhật bài đăng ---
  @Patch(':postId')
  @ApiOperation({ summary: 'Cập nhật thông tin chi tiết của bài đăng (chỉ chủ sở hữu)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bài đăng đã được cập nhật.', type: GetPostDto })
  async update(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<GetPostDto> {
    const user_id = this.getUserIdFromRequest();
    const post = await this.postService.update(postId, user_id, updatePostDto);
    return plainToInstance(GetPostDto, post);
  }
  
  // --- API 6: Xóa mềm/Ẩn bài đăng ---
  @Delete(':postId')
  @ApiOperation({ summary: 'Ẩn (toggle is_available) hoặc Xóa mềm bài đăng (chỉ chủ sở hữu)' })
  @ApiQuery({ name: 'action', enum: ['hide', 'delete'], description: 'Hành động: hide (ẩn/hiện) hoặc delete (xóa mềm/hard)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Thành công.' })
  async softDeleteOrHide(
    @Param('postId') postId: string,
    @Query('action') action: 'hide' | 'delete',
  ): Promise<{ message: string }> {
    if (!action || (action !== 'hide' && action !== 'delete')) {
        throw new BadRequestException("Query parameter 'action' phải là 'hide' hoặc 'delete'.");
    }
    const user_id = this.getUserIdFromRequest();
    return this.postService.softDeleteOrHide(postId, user_id, action);
  }
}