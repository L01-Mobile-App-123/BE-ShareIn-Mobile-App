import { Injectable, UnauthorizedException } from '@nestjs/common';
import { admin } from '../firebase/firebase-admin';
import { UserService } from '@users/user.service';
import { UserRecord, DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  /**
   * Tạo custom token để test (không dùng trong thực tế)
   */
  async createTestToken(uid: string, email: string) { // Sửa: String -> string
    const customToken = await admin.auth().createCustomToken(uid, { email });
    return { customToken };
  }

  /**
   * Verify token và tự động tạo user mới nếu chưa có
   */
  async verifyToken(decodedToken: DecodedIdToken) {
    try {      
      // Gán kiểu UserRecord cho an toàn
      const firebaseUser: UserRecord = await admin.auth().getUser(decodedToken.uid);  
      
      // Logic này đã hoạt động chính xác với UserService đã sửa
      const user = await this.userService.findOrCreateUser(firebaseUser);
      
      return user;
    } catch (err) {
      console.error('Error verifying Firebase token:', err);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  /**
   * Logout - vô hiệu hóa refresh token
   */
  async logout(uid: string) {
    try {
      await admin.auth().revokeRefreshTokens(uid);
      return { message: 'User logged out successfully' };
    } catch (err) {
      console.error('Error revoking refresh tokens:', err);
      // Vẫn trả về thành công cho client, vì dù sao client cũng đã xóa token
      return { message: 'User logged out, but token revocation failed on server.' };
    }
  }
}