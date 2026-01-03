import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatMapperService } from './chat.mapper.service';
import { Conversation } from '@modules/entities/conversation.entity';
import { Message } from '@modules/entities/message.entity';
import { Post } from '@modules/entities/post.entity';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '@modules/users/users.module'; 
import { PostModule } from '@modules/post/post.module'; 
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard'

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Post]),
    UsersModule, 
    PostModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    FirebaseAuthGuard,
    // Mapper service
    ChatMapperService,
  ],
  exports: [ChatService]
})
export class ChatModule {}