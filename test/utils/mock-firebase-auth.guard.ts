import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Guard mock cho e2e: bypass auth + bơm req.user giống FirebaseAuthGuard.
 * Mục tiêu: e2e test tập trung vào route/controller, không phụ thuộc Firebase/DB.
 */
@Injectable()
export class MockFirebaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Giả lập payload mà app đang dùng: req.user.userId và req.user.uid
    req.user = {
      uid: 'firebase-uid-test',
      userId: 'user-id-test',
    };

    return true;
  }
}
