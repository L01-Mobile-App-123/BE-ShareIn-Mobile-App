import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/entities/user.entity';
import { type UserRecord } from 'firebase-admin/auth';
import { UpdateUserDto } from './dto/UpdateUser.dto'

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

  async findOne(user_id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { user_id, is_active: true },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID "${user_id}" hoặc người dùng không hoạt động.`);
    }
    return user;
  }

  async update(user_id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({ where: { user_id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID "${user_id}".`);
    }
    
    const updatePayload: Partial<User> = { ...updateData };
    
    if (updateData.date_of_birth) {
        updatePayload.date_of_birth = new Date(updateData.date_of_birth);
    }
    
    await this.repo.update(user_id, updatePayload);
    
    const updatedUser = await this.repo.findOne({ where: { user_id } });
    
    if (!updatedUser) {
        throw new BadRequestException('Lỗi khi lấy dữ liệu người dùng sau khi cập nhật.');
    }
    
    return updatedUser;
  }

  async updateAvatar(user_id: string, newAvatarUrl: string): Promise<User> {
    // Cập nhật trường avatar_url
    await this.repo.update(user_id, { avatar_url: newAvatarUrl });

    // Lấy và trả về người dùng đã được cập nhật
    const updatedUser = await this.repo.findOne({ where: { user_id } });
    return updatedUser!; // ! an toàn vì đã kiểm tra user tồn tại ở trên
  }
  }