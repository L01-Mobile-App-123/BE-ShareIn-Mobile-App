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
import { RatingSubscriber } from '@modules/subscribers/rating.subscriber';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get('database.url');
        const databaseSchema = config.get('database.schema');
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [__dirname + '/**/entities/*{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: true,
          schema: databaseSchema,
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
  providers: [AppService, RatingSubscriber],
})
export class AppModule {}
