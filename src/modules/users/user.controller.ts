import { Controller, Get, Param, Patch, Body, UseGuards, HttpStatus, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { GetUserDto } from './dto/GetUser.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { FileUploadDto } from './dto/FileUpload.dto';
import { type UserRequest } from '@common/interfaces/userRequest.interface'

@ApiTags('users')
@Controller('users')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một người dùng bất kỳ theo User ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trả về thông tin người dùng thành công', type: GetUserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng.' })
  async findOne(@Req() request: UserRequest): Promise<ApiResponseDto<GetUserDto>> {
    const user = await this.userService.findOne(request.user.userId);

    return new ApiResponseDto("Get user's infor succesfully", plainToInstance(GetUserDto, user));
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ của người dùng đang đăng nhập' })
  @ApiBody({ type: UpdateUserDto, description: 'Dữ liệu cần cập nhật' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cập nhật thành công, trả về dữ liệu mới', type: GetUserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ.' })
  async update(
    @Req() request: UserRequest,
    @Body() updateData: UpdateUserDto,
  ): Promise<ApiResponseDto<GetUserDto>> {
    const updatedUser = await this.userService.update(
        request.user.userId, 
        updateData,
    );

    return new ApiResponseDto("Update user's infor succesfully", plainToInstance(GetUserDto, updatedUser));
  }

  @Patch('/avatar')
  @ApiOperation({ summary: 'Cập nhật ảnh đại diện (avatar)' })
  @ApiConsumes('multipart/form-data') // Bắt buộc cho Swagger biết là form-data
  @ApiBody({ type: FileUploadDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trả về URL ảnh mới' })
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên field trong form-data
  async uploadSingleAvatar(
    @Req() request: UserRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<string>> {
    // Lấy thông tin user (cần thiết cho logic upload/ghi đè của Cloudinary Service)
    const userId = request.user.userId;
    const user = await this.userService.findOne(userId);

    // 1. Tải lên ảnh và lấy URL mới
    const newAvatarUrl = await this.cloudinaryService.uploadAvatarAndReplace(file, user);
    // 2. Cập nhật URL mới vào database (sử dụng phương thức mới)
    await this.userService.updateAvatar(userId, newAvatarUrl);

    return new ApiResponseDto("Update avatar successfully", newAvatarUrl);
  }
}