import { Controller, Get, Param, Patch, Body, UseGuards, HttpStatus, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { GetUserDto } from './dto/GetUser.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { FileUploadDto } from './dto/FileUpload.dto'

@ApiTags('users')
@Controller('users')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một người dùng bất kỳ theo User ID' })
  @ApiParam({ name: 'id', description: 'User ID (UUID) của người dùng cần xem', example: '93aba9a2-5c58-4e9f-9b94-d1fd5caf2659' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trả về thông tin người dùng thành công', type: GetUserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng.' })
  async findOne(@Param('id') user_id: string): Promise<ApiResponseDto<GetUserDto>> {
    const user = await this.userService.findOne(user_id);

    return new ApiResponseDto("Get user's infor succesfully", plainToInstance(GetUserDto, user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ của người dùng đang đăng nhập' })
  @ApiParam({ name: 'id', description: 'User ID (UUID) của người dùng cần cập nhập thông tin', example: '93aba9a2-5c58-4e9f-9b94-d1fd5caf2659' })
  @ApiBody({ type: UpdateUserDto, description: 'Dữ liệu cần cập nhật' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cập nhật thành công, trả về dữ liệu mới', type: GetUserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ.' })
  async update(
    @Param('id') user_id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<ApiResponseDto<GetUserDto>> {
    const updatedUser = await this.userService.update(
        user_id, 
        updateData,
    );

    return new ApiResponseDto("Update user's infor succesfully", plainToInstance(GetUserDto, updatedUser));
  }

  @Patch(':id/avatar')
  @ApiOperation({ summary: 'Cập nhật ảnh đại diện (avatar)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID) của người dùng cần cập nhập thông tin', example: '93aba9a2-5c58-4e9f-9b94-d1fd5caf2659' })
  @ApiConsumes('multipart/form-data') // Bắt buộc cho Swagger biết là form-data
  @ApiBody({ type: FileUploadDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trả về URL ảnh mới' })
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên field trong form-data
  async uploadSingleAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') user_id: string,
  ): Promise<ApiResponseDto<string>> {
    // Lấy thông tin user (cần thiết cho logic upload/ghi đè của Cloudinary Service)
    const user = await this.userService.findOne(user_id);

    // 1. Tải lên ảnh và lấy URL mới
    const newAvatarUrl = await this.cloudinaryService.uploadAvatarAndReplace(file, user);
    // 2. Cập nhật URL mới vào database (sử dụng phương thức mới)
    await this.userService.updateAvatar(user_id, newAvatarUrl);

    return new ApiResponseDto("Update avatar successfully", newAvatarUrl);
  }
}