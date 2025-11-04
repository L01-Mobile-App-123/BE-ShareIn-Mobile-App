import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { User } from '@modules/entities/user.entity';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module'
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CloudinaryModule],
  providers: [UserService, FirebaseAuthGuard],
  exports: [UserService],
  controllers: [UserController]
})
export class UsersModule {}
