import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpStatus, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto, RatingResponseDto, UserRatingStatsDto } from './dto/rating.dto';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { type UserRequest } from '@common/interfaces/userRequest.interface';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('ratings')
@Controller('ratings')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Đánh giá người dùng sau giao dịch',
    description: 'Người dùng có thể đánh giá người khác sau khi hoàn thành giao dịch. Mỗi người chỉ được đánh giá một lần cho mỗi người dùng.'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Đánh giá thành công.',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dữ liệu không hợp lệ hoặc đã đánh giá trước đó.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Không thể tự đánh giá bản thân.' 
  })
  async createRating(
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<RatingResponseDto>> {
    const raterId = req.user.userId;
    const rating = await this.ratingService.createRating(raterId, createRatingDto);
    
    return new ApiResponseDto(
      'Đánh giá thành công',
      plainToInstance(RatingResponseDto, rating),
    );
  }

  @Patch(':ratingId')
  @ApiOperation({ 
    summary: 'Cập nhật đánh giá đã tạo',
    description: 'Người dùng có thể chỉnh sửa đánh giá mà mình đã tạo trước đó.'
  })
  @ApiParam({ name: 'ratingId', description: 'ID đánh giá cần cập nhật' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cập nhật thành công.',
    type: RatingResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Bạn không có quyền sửa đánh giá này.' 
  })
  async updateRating(
    @Param('ratingId') ratingId: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<RatingResponseDto>> {
    const raterId = req.user.userId;
    const rating = await this.ratingService.updateRating(raterId, ratingId, updateRatingDto);
    
    return new ApiResponseDto(
      'Cập nhật đánh giá thành công',
      plainToInstance(RatingResponseDto, rating),
    );
  }

  @Delete(':ratingId')
  @ApiOperation({ 
    summary: 'Xóa đánh giá đã tạo',
    description: 'Người dùng có thể xóa đánh giá mà mình đã tạo trước đó.'
  })
  @ApiParam({ name: 'ratingId', description: 'ID đánh giá cần xóa' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Xóa thành công.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Bạn không có quyền xóa đánh giá này.' 
  })
  async deleteRating(
    @Param('ratingId') ratingId: string,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<null>> {
    const raterId = req.user.userId;
    await this.ratingService.deleteRating(raterId, ratingId);
    
    return new ApiResponseDto('Xóa đánh giá thành công', null);
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá của một người dùng',
    description: 'Lấy tất cả các đánh giá mà người dùng này đã nhận được từ người khác (có phân trang).'
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng cần xem đánh giá' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 20)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá.',
    type: [RatingResponseDto] 
  })
  async getUserRatings(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<{ data: RatingResponseDto[], total: number, page: number, limit: number }>> {
    const ratings = await this.ratingService.getRatingsForUser(userId);
    
    // Phân trang thủ công
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = ratings.slice(startIndex, endIndex);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá thành công',
      {
        data: plainToInstance(RatingResponseDto, paginatedData),
        total: ratings.length,
        page: Number(page),
        limit: Number(limit),
      },
    );
  }

  @Get('user/:userId/stats')
  @ApiOperation({ 
    summary: 'Lấy thống kê đánh giá của người dùng',
    description: 'Trả về điểm trung bình, tổng số đánh giá và phân bố theo từng mức sao (1-5 sao).'
  })
  @ApiParam({ name: 'userId', description: 'ID người dùng cần xem thống kê' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Thống kê đánh giá.',
    type: UserRatingStatsDto 
  })
  async getUserRatingStats(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<UserRatingStatsDto>> {
    const stats = await this.ratingService.getUserRatingStats(userId);
    
    return new ApiResponseDto(
      'Lấy thống kê đánh giá thành công',
      stats,
    );
  }

  @Get('me/given')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá mà người dùng hiện tại đã đưa ra',
    description: 'Xem lại các đánh giá mà bạn đã đánh giá người khác.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá đã đưa ra.',
    type: [RatingResponseDto] 
  })
  async getMyGivenRatings(
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<RatingResponseDto[]>> {
    const raterId = req.user.userId;
    const ratings = await this.ratingService.getRatingsForUser(raterId);
    
    // Lọc các đánh giá mà user này là người đánh giá
    const givenRatings = ratings.filter(r => r.rater_id === raterId);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá đã đưa ra thành công',
      plainToInstance(RatingResponseDto, givenRatings),
    );
  }

  @Get('me/received')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá mà người dùng hiện tại đã nhận được',
    description: 'Xem các đánh giá mà người khác đã đánh giá bạn.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá đã nhận.',
    type: [RatingResponseDto] 
  })
  async getMyReceivedRatings(
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<RatingResponseDto[]>> {
    const userId = req.user.userId;
    const ratings = await this.ratingService.getRatingsForUser(userId);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá đã nhận thành công',
      plainToInstance(RatingResponseDto, ratings),
    );
  }
}