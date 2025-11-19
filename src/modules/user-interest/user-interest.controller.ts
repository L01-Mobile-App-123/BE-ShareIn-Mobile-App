import { Body, Controller, Get, Put, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { UserInterestService } from './user-interest.service';
import { UpdateUserInterestsDto, UserInterestResponseDto } from './dto/user-interest.dto';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import type { UserRequest } from '@common/interfaces/userRequest.interface';

@ApiTags('User Interests (Danh mục quan tâm)')
@Controller('user-interests')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class UserInterestController {
  constructor(private readonly userInterestService: UserInterestService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục và từ khóa người dùng đang quan tâm' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách quan tâm của người dùng',
    type: [UserInterestResponseDto] 
  })
  async getUserInterests(@Req() req: UserRequest): Promise<ApiResponseDto<UserInterestResponseDto[]>> {
    const userId = req.user.userId;
    const interests = await this.userInterestService.getUserInterests(userId);
    
    // Map entity sang DTO response
    const response = interests.map(i => ({
      interest_id: i.interest_id,
      category: {
        category_id: i.category.category_id,
        category_name: i.category.category_name
      },
      keywords: i.keywords || [],
      is_active: i.is_active,
      created_at: i.created_at
    }));

    return new ApiResponseDto<UserInterestResponseDto[]>(
      'Lấy danh sách quan tâm thành công',
      response
    );
  }

  @Put()
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Cập nhật toàn bộ danh sách quan tâm (Sync)',
    description: 'API này sẽ thay thế danh sách cũ bằng danh sách mới. Nếu muốn xóa hết, gửi mảng rỗng.' 
  })
  @ApiBody({ type: UpdateUserInterestsDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật thành công',
    type: [UserInterestResponseDto] 
  })
  async updateUserInterests(
    @Req() req: UserRequest, 
    @Body() dto: UpdateUserInterestsDto
  ): Promise<ApiResponseDto<UserInterestResponseDto[]>> {
    const userId = req.user.userId;
    const updatedInterests = await this.userInterestService.updateUserInterests(userId, dto);

    // Map entity sang DTO response
    const response = updatedInterests.map(i => ({
      interest_id: i.interest_id,
      category_id: i.category_id,
      category: {
        category_id: i.category.category_id,
        category_name: i.category.category_name
      },
      keywords: i.keywords || [],
      is_active: i.is_active,
      created_at: i.created_at
    }));

    return new ApiResponseDto<UserInterestResponseDto[]>(
      'Cập nhật danh sách quan tâm thành công',
      response
    );
  }
}