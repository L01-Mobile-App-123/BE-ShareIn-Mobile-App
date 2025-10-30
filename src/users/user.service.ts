import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { type UserRecord } from 'firebase-admin/auth';
// Định nghĩa kiểu dữ liệu cho rõ ràng
export type FirebaseUser = {
  firebase_uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * Tìm người dùng bằng Firebase UID
   */
  async findByUid(firebase_uid: string): Promise<User | null> {
    return this.repo.findOne({ where: { firebase_uid } });
  }

  /**
   * Tìm người dùng bằng email
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Tìm hoặc tạo mới người dùng dựa trên thông tin Firebase
   */
  async findOrCreateUser(firebaseUser: UserRecord): Promise<User> {
    // 1. Tìm người dùng bằng Firebase UID
    let user = await this.findByUid(firebaseUser.uid);
    if (user) return user;

    // 2. Nếu không có, thử tìm bằng email (cho trường hợp đăng nhập SĐT/Google sau)
    user = await this.findByEmail(firebaseUser.email || '');
    if (user) {
      // Nếu tìm thấy user bằng email nhưng chưa có UID (vd: tạo thủ công)
      // -> Cập nhật UID và trả về
      user.firebase_uid = firebaseUser.uid;
      return this.repo.save(user);
    }

    // 3. Nếu không tồn tại, tạo mới
    const newUser = this.repo.create({
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      full_name: firebaseUser.displayName ? 'New User' : firebaseUser.email?.split('@')[0],
      avatar_url: firebaseUser.photoURL,
    });

    return this.repo.save(newUser);
  }
}