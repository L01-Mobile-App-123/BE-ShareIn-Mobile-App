import { Controller, Post, Body, ValidationPipe, Get, Patch, Delete, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { ApiBody } from '@nestjs/swagger';
import { TestNotificationDto } from './dto/test-notification.dto';
import { NotificationResponseDto, PaginatedNotificationsDto, MarkNotificationAsReadDto, MarkAllNotificationsAsReadDto } from './dto/notification.dto';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import type { UserRequest } from '@common/interfaces/userRequest.interface';
import { plainToInstance } from 'class-transformer';

@ApiTags('Notifications')
@Controller('notification')
export class NotificationController {
  
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Endpoint để test gửi thông báo
   */
  @Post('test-send')
  @Post('test-send')
  @ApiOperation({ summary: 'Test gửi thông báo tới thiết bị' })
  @ApiResponse({ status: 200, description: 'Thông báo được gửi thành công' })
  async testSendNotification(
    @Body(new ValidationPipe()) body: TestNotificationDto,
  ) {
    try {
      const response = await this.notificationService.sendToDevice(
        body.token,
        body.title || '🔔 Test Title (ShareIn)',
        body.body || 'Đây là thông báo test từ NestJS cho dự án ShareIn.',
        { testData: 'dayLaDataPayload123' },
      );
      
      return new ApiResponseDto('Test notification sent!', response);
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to send notification',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiResponse({ status: 200, description: 'Lấy thành công', type: PaginatedNotificationsDto })
  async getNotifications(
    @Req() req: UserRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ApiResponseDto<PaginatedNotificationsDto>> {
    const userId = req.user.userId;
    const result = await this.notificationService.getNotifications(userId, page, limit);
    
    return new ApiResponseDto('Lấy danh sách thông báo thành công', {
      data: plainToInstance(NotificationResponseDto, result.data),
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    });
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  @Patch(':id/read')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu thành công', type: NotificationResponseDto })
  async markAsRead(
    @Param('id') notificationId: string,
    @Req() req: UserRequest,
    @Body() dto: MarkNotificationAsReadDto,
  ): Promise<ApiResponseDto<NotificationResponseDto>> {
    const userId = req.user.userId;
    const notification = await this.notificationService.markAsRead(notificationId, userId);
    
    return new ApiResponseDto('Đánh dấu thông báo đã đọc thành công', plainToInstance(NotificationResponseDto, notification));
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  @Patch('read-all')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu thành công' })
  async markAllAsRead(
    @Req() req: UserRequest,
    @Body() dto: MarkAllNotificationsAsReadDto,
  ): Promise<ApiResponseDto<{ affected: number }>> {
    const userId = req.user.userId;
    const result = await this.notificationService.markAllAsRead(userId);
    
    return new ApiResponseDto('Đánh dấu tất cả thông báo đã đọc thành công', result);
  }

  /**
   * Xóa một thông báo
   */
  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một thông báo' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Req() req: UserRequest,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const userId = req.user.userId;
    const result = await this.notificationService.deleteNotification(notificationId, userId);
    
    return new ApiResponseDto('Xóa thông báo thành công', result);
  }
}