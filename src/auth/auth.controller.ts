import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import axios from 'axios';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ConfigService } from '@nestjs/config';

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
   * Đăng ký user mới (signup)
   */
  @Post('sign-up')
  @ApiOperation({ summary: 'Sign up new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request (Validation failed)' }) // Thêm lỗi 400
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto.email, signUpDto.password);
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
  async getTestToken(@Body() body: {uid: string, email: String}) {
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
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verify(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto.idToken);
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
  async logout(@Req() req) {
    return this.authService.logout(req.user.uid);
  }

  /**
   * Test route có bảo vệ (Firebase Guard)
   */
  @UseGuards(FirebaseAuthGuard)
  @Get('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info', description: 'Trả về thông tin user hiện tại từ Firebase token.' })
  @ApiResponse({ status: 200, description: 'User info returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Req() req) {
    return req.user;
  }
}
