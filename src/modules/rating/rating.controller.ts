import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { CreateRatingDto, RatingResponseDto, UserRatingStatsDto } from './dto/rating.dto';
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
    description: 'Người dùng có thể đánh giá người khác sau khi hoàn thành giao dịch. Mỗi người chỉ được đánh giá một lần cho mỗi giao dịch/bài đăng.'
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

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá của một người dùng',
    description: 'Lấy tất cả các đánh giá mà người dùng này đã nhận được từ người khác.'
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
    const { data, total } = await this.ratingService.getUserRatings(userId, page, limit);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá thành công',
      {
        data: plainToInstance(RatingResponseDto, data),
        total,
        page,
        limit,
      },
    );
  }

  @Get('user/:userId/stats')
  @ApiOperation({ 
    summary: 'Lấy thống kê đánh giá của người dùng',
    description: 'Trả về điểm trung bình, tổng số đánh giá và phân bố theo từng mức sao.'
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

  @Get('post/:postId')
  @ApiOperation({ 
    summary: 'Lấy đánh giá liên quan đến một bài đăng cụ thể',
    description: 'Lấy các đánh giá đã được tạo cho giao dịch liên quan đến bài đăng này.'
  })
  @ApiParam({ name: 'postId', description: 'ID bài đăng' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá cho bài đăng.',
    type: [RatingResponseDto] 
  })
  async getPostRatings(
    @Param('postId') postId: string,
  ): Promise<ApiResponseDto<RatingResponseDto[]>> {
    const ratings = await this.ratingService.getPostRatings(postId);
    
    return new ApiResponseDto(
      'Lấy đánh giá bài đăng thành công',
      plainToInstance(RatingResponseDto, ratings),
    );
  }

  @Get('me/given')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá mà người dùng hiện tại đã đưa ra',
    description: 'Xem lại các đánh giá mà bạn đã đánh giá người khác.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 20)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá đã đưa ra.',
    type: [RatingResponseDto] 
  })
  async getMyGivenRatings(
    @Req() req: UserRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<{ data: RatingResponseDto[], total: number, page: number, limit: number }>> {
    const raterId = req.user.userId;
    const { data, total } = await this.ratingService.getRatingsByRater(raterId, page, limit);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá đã đưa ra thành công',
      {
        data: plainToInstance(RatingResponseDto, data),
        total,
        page,
        limit,
      },
    );
  }

  @Get('me/received')
  @ApiOperation({ 
    summary: 'Lấy danh sách đánh giá mà người dùng hiện tại đã nhận được',
    description: 'Xem các đánh giá mà người khác đã đánh giá bạn.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 20)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Danh sách đánh giá đã nhận.',
    type: [RatingResponseDto] 
  })
  async getMyReceivedRatings(
    @Req() req: UserRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<{ data: RatingResponseDto[], total: number, page: number, limit: number }>> {
    const userId = req.user.userId;
    const { data, total } = await this.ratingService.getUserRatings(userId, page, limit);
    
    return new ApiResponseDto(
      'Lấy danh sách đánh giá đã nhận thành công',
      {
        data: plainToInstance(RatingResponseDto, data),
        total,
        page,
        limit,
      },
    );
  }
}