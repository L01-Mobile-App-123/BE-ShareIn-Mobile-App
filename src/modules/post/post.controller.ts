import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpStatus, UseGuards, Req, BadRequestException, UseInterceptors, UploadedFiles, HttpCode } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RepostDto } from './dto/repost.dto';
import { CategoryDto } from './dto/category.dto';
import { GetPostDto } from './dto/get-post.dto';
import { MultipleFilesUploadDto } from './dto/multiple-files-upload.dto';
import { plainToInstance } from 'class-transformer';
import { PostStatus } from '@common/enums/post-status.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { type UserRequest } from '@common/interfaces/userRequest.interface';
import { CategoryService } from '@modules/category/cateogry.service';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Lấy danh sách tất cả Category',
    description: 'Endpoint trả về toàn bộ danh sách Category hiện có trong hệ thống.'
  })
  @ApiResponse({ status: 200, description: 'Trả về thành công danh sách các Category.', type: [CategoryDto]})
  @ApiResponse({ status: 500, description: 'Lỗi server nội bộ.'})
  async getCategories(): Promise<ApiResponseDto<CategoryDto[]>> {
    const categories = await this.categoryService.findAll();

    return new ApiResponseDto("Get all categories", categories);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bài đăng mới (KHÔNG KÈM ẢNH). Cần cập nhật ảnh sau đó.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bài đăng đã được tạo.', type: GetPostDto })
  async create(
    @Req() req: UserRequest,
    @Body() createPostDto: CreatePostDto
  ): Promise<ApiResponseDto<GetPostDto>> {
    const post = await this.postService.create(req.user.userId, createPostDto);
    return new ApiResponseDto("Create post successfully", plainToInstance(GetPostDto, post));
  }

  @Post('save')
  @ApiOperation({ summary: 'Lưu bài đăng ở dạng nháp (draft). Tạo bài đăng nhưng không công khai.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bài đăng nháp đã được lưu.', type: GetPostDto })
  async saveDraft(
    @Req() req: UserRequest,
    @Body() createPostDto: CreatePostDto
  ): Promise<ApiResponseDto<GetPostDto>> {
    // Force status to DRAFT regardless of incoming value
    createPostDto.status = PostStatus.DRAFT;
    const post = await this.postService.create(req.user.userId, createPostDto);
    return new ApiResponseDto('Saved draft successfully', plainToInstance(GetPostDto, post));
  }

  @Patch(':postId/images')
  @ApiOperation({ summary: 'Tải lên nhiều ảnh cho một bài đăng (Ghi đè/thay thế MẢNG ảnh cũ). Tối đa 10 ảnh.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MultipleFilesUploadDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cập nhật danh sách ảnh thành công.', type: GetPostDto })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPostImages(
    @Param('postId') postId: string,
    @Req() req: UserRequest,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ApiResponseDto<GetPostDto>> {
    //Upload ảnh lên cloudinary
    const imageUrls = await this.cloudinaryService.uploadMultipleFiles(postId, files);
        
    const updatedPost = await this.postService.updateImageUrls(postId, req.user.userId, imageUrls);
    
    return new ApiResponseDto("Upload post's images sucessfully", plainToInstance(GetPostDto, updatedPost)); 
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách bài đăng của người dùng hiện tại' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Danh sách bài đăng của user.', type: [GetPostDto] })
  @ApiQuery({ name: 'page', description: 'Trang cần lấy (mặc định là 1)', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', description: 'Số bài post mỗi trang (mặc định là 20)', required: false, type: 'number' })
  async getMyPosts(
    @Req() req: UserRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<{data: GetPostDto[], total: number, page: number, limit: number}>> {
    const { data, total } = await this.postService.findByUser(req.user.userId, page, limit);
    
    return new ApiResponseDto("Get my posts", {
      data: plainToInstance(GetPostDto, data),
      total: total,
      page: page,
      limit: limit,
    });
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Xem chi tiết một bài đăng' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chi tiết bài đăng.', type: GetPostDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy.' })
  async findOne(@Param('postId') postId: string): Promise<ApiResponseDto<GetPostDto>> {
    const post = await this.postService.findOne(postId);
    return new ApiResponseDto("Get post's detail sucessfully", plainToInstance(GetPostDto, post));
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bài đăng (có thể lọc)' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Lọc theo ID danh mục' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Danh sách bài đăng.', type: [GetPostDto] })
  async findAll(
    @Query('category_id') categoryId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<{data: GetPostDto[], total: number, page: number, limit: number}>> {
    const filters = {
      category_id: categoryId,
    };
    
    const { data, total } = await this.postService.findAll(filters, page, limit);
    
    return new ApiResponseDto("Get list posts", {
      data: plainToInstance(GetPostDto, data),
      total: total,
      page: page,
      limit: limit,
    });
  }

  @Patch(':postId')
  @ApiOperation({ summary: 'Cập nhật thông tin chi tiết của bài đăng (chỉ chủ sở hữu)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bài đăng đã được cập nhật.', type: GetPostDto })
  async update(
    @Param('postId') postId: string,
    @Req() req: UserRequest,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponseDto<GetPostDto>> {
    const post = await this.postService.update(postId, req.user.userId, updatePostDto);
    return new ApiResponseDto("Update post sucessfully", plainToInstance(GetPostDto, post)) ;
  }
  
  // @Delete(':postId')
  // @ApiOperation({ summary: 'Ẩn (toggle is_available) hoặc Xóa mềm bài đăng (chỉ chủ sở hữu)' })
  // @ApiQuery({ name: 'action', enum: ['hide', 'delete'], description: 'Hành động: hide (ẩn/hiện) hoặc delete (xóa mềm/hard)' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Thành công.' })
  // async softDeleteOrHide(
  //   @Param('postId') postId: string,
  //   @Query('action') action: 'hide' | 'delete',
  // ): Promise<{ message: string }> {
  //   if (!action || (action !== 'hide' && action !== 'delete')) {
  //       throw new BadRequestException("Query parameter 'action' phải là 'hide' hoặc 'delete'.");
  //   }
  //   const user_id = this.getUserIdFromRequest();
  //   return this.postService.softDeleteOrHide(postId, user_id, action);
  // }

  /**
   * Sao chép/Repost một bài đăng cũ
   */
  @Post(':postId/repost')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sao chép lại bài đăng cũ của mình' })
  @ApiParam({ name: 'postId', description: 'ID bài đăng gốc' })
  @ApiBody({ type: RepostDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bài đăng đã được sao chép.', type: GetPostDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bài đăng gốc' })
  async repost(
    @Param('postId') postId: string,
    @Req() req: UserRequest,
    @Body() repostDto: RepostDto,
  ): Promise<ApiResponseDto<GetPostDto>> {
    const newPost = await this.postService.repost(
      req.user.userId,
      repostDto.original_post_id || postId,
      repostDto.title,
      repostDto.description,
    );
    return new ApiResponseDto('Sao chép bài đăng thành công', plainToInstance(GetPostDto, newPost));
  }
}