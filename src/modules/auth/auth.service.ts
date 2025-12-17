import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { FIREBASE_AUTH } from '@firebase/firebase.constants';
import type { Auth } from 'firebase-admin/auth';
import { UsersService } from '@modules/users/user.service';
import { UserRecord, DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
  ) {}

  /**
   * Tạo custom token để test (không dùng trong thực tế)
   */
  async createTestToken(uid: string, email: string) { // Sửa: String -> string
    const customToken = await this.auth.createCustomToken(uid, { email });
    return { customToken };
  }

  /**
   * Verify token và tự động tạo user mới nếu chưa có
   */
  async verifyToken(token: string) {
    let decodedToken: DecodedIdToken;
    let firebaseUser: UserRecord;

    try {
        // 1. Xác thực Token Firebase
        decodedToken = await this.auth.verifyIdToken(token);
    } catch (error) {
        // Bắt lỗi Token Firebase (hết hạn, không hợp lệ,...)
        console.error('Firebase ID Token verification failed:', error.message);
        throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }

    try {
        // 2. Lấy thông tin User Record đầy đủ từ Firebase
        // Dùng uid từ decodedToken để lấy thông tin chi tiết hơn
        firebaseUser = await this.auth.getUser(decodedToken.uid);
    } catch (error) {
        // Bắt lỗi nếu User không tồn tại trên Firebase (rất hiếm)
        console.error('Firebase User Record retrieval failed:', error.message);
        throw new UnauthorizedException('User not found on Firebase');
    }

    try {
        // 3. Logic tìm hoặc tạo người dùng trong DB Local
        // Giữ nguyên logic findOrCreateUser đã hoạt động chính xác
        const user = await this.userService.findOrCreateUser(firebaseUser);
        
        return user; // Trả về entity User local
    } catch (error) {
        // Bắt lỗi trong quá trình xử lý DB Local
        console.error('Error during findOrCreateUser:', error.message);
        // Có thể custom exception cho lỗi DB nếu cần
        throw new UnauthorizedException('Authentication failed due to local user processing error');
    }
  }

  /**
   * Logout - vô hiệu hóa refresh token
   */
  async logout(uid: string) {
    try {
      await this.auth.revokeRefreshTokens(uid);
      return 'User logged out successfully';
    } catch (err) {
      console.error('Error revoking refresh tokens:', err);
      // Vẫn trả về thành công cho client, vì dù sao client cũng đã xóa token
      return 'User logged out, but token revocation failed on server.';
    }
  }
}