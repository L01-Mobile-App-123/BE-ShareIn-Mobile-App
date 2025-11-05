import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpStatus, UseGuards, Req, BadRequestException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/CreatePost.dto';
import { UpdatePostDto } from './dto/UpdatePost.dto';
import { GetPostDto } from './dto/GetPost.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes, } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard'
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { ApiResponseDto } from '@common/dto/api-response.dto'
import { MultipleFilesUploadDto } from './dto/MultipleFilesUpload.dto'
import { type UserRequest } from '@common/interfaces/userRequest.interface'

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
}