import { Controller, Get, Param, Patch, Body, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { type UserRequest } from '@common/interfaces/userRequest.interface'
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { GetUserDto } from './dto/GetUser.dto';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
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
}