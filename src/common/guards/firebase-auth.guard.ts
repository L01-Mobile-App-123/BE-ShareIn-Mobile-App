import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { FIREBASE_AUTH } from '@firebase/firebase.constants';
import type { Auth } from 'firebase-admin/auth';
import { Repository } from 'typeorm';
import { User } from '@modules/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      const firebase_uid = decodedToken.uid;

      const user = await this.userRepository.findOne({ where: { firebase_uid } });
      if (!user) {
        throw new UnauthorizedException('User not found in local database');
      }

      request.user = {
        ...decodedToken,  // Thông tin Firebase
        userId: user.user_id, // Local user ID
      };

      return true;
    } catch (err) {
      console.error('Token verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}