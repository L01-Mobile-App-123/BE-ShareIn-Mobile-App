import { UserInterest } from './modules/entities/user-interest.entity';
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from '@modules/post/post.module';
import { SearchModule } from '@modules/search/search.module';
import { ChatModule } from '@modules/chat/chat.module';
import { NotificationModule } from '@modules/notifications/notification.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { RatingModule } from '@modules/rating/rating.module';
import { UserInterestModule } from '@modules/user-interest/user-interest.module'
import { AppConfigModule } from '@config/config.module';
import { FirebaseModule } from '@firebase/firebase.module'
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get('database');
        return {
          type: db.type,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.name,
          entities: [__dirname + '/**/entities/*{.ts,.js}'],
          synchronize: config.get('nodeEnv') !== 'production',
          autoLoadEntities: true,
        };
      },
    }),
    PostModule,
    SearchModule,
    ChatModule,
    NotificationModule,
    AuthModule,
    UsersModule,
    RatingModule,
    UserInterestModule,
    FirebaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
