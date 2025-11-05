import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { type UserRequest } from '@common/interfaces/userRequest.interface'
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiResponseDto } from '@common/dto/api-response.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  getFirebaseConfig() {
    const apiKey = this.configService.get<string>('firebase.webApiKey');

    return { apiKey };
  }

  /**
   * Tạo token test (không dùng trong thực tế)
   */
  @Post('test-token')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', example: 'iDNX5J3eOAPgMT7ZlEYHZDgAlMI2' },
        email: { type: 'string', example: 'test@example.com' },
      },
      required: ['uid', 'email'],
    },
  })
  @ApiOperation({ summary: 'Create test Firebase ID token' })
  @ApiResponse({ status: 201, description: 'Test token created successfully' })
  async getTestToken(@Body() body: {uid: string, email: string}) {
    const { customToken } = await this.authService.createTestToken(body.uid, body.email);

    const res = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.getFirebaseConfig().apiKey}`,
      { token: customToken, returnSecureToken: true }
    );

    return { idToken: res.data.idToken };
  }

  /**
   * Xác thực token Firebase (login hoặc verify)
   */
  @Post('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verify(@Req() request: UserRequest): Promise<ApiResponseDto<{id: string, email: string, name: string}>> {
    // Lấy token từ header (Vì không dùng Guard nên phải tự lấy)
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];

    const user = await this.authService.verifyToken(token);
    
    return new ApiResponseDto('Verify user successfully', {
        id: user.user_id,
        email: user.email,
        name: user.full_name, // Giả sử tên là user.full_name
    });
  }

  /**
   * Logout user (revoke token)
   */
  @UseGuards(FirebaseAuthGuard)
  @Post('log-out')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user', description: 'Revoke Firebase refresh tokens for the current user.' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() request: UserRequest): Promise<ApiResponseDto<string>> {
    const msg = await this.authService.logout(request.user.uid);
    return new ApiResponseDto(msg);
  }
}
