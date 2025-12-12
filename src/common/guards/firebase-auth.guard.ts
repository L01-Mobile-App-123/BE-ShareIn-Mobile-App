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
import * as jwt from 'jsonwebtoken';

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
      // Try to verify as test token first (HS256)
      const secret = 'test-secret-key-for-development';
      let decodedToken: any;
      
      try {
        decodedToken = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
      } catch (err) {
        // If HS256 fails, try Firebase ID token verification
        decodedToken = await this.auth.verifyIdToken(token);
      }

      const firebase_uid = decodedToken.user_id || decodedToken.uid || decodedToken.sub;

      // For test tokens, create user in request if not in DB
      const user = await this.userRepository.findOne({ where: { firebase_uid } });
      if (!user) {
        // For test tokens, still allow access but without local user
        request.user = {
          ...decodedToken,
          userId: firebase_uid, // Use firebase_uid as userId if no local user
        };
        return true;
      }

      request.user = {
        ...decodedToken,
        userId: user.user_id,
      };

      return true;
    } catch (err) {
      console.error('Token verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
