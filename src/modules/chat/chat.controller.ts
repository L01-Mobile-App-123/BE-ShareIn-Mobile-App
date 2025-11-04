import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post()
  send(@Body() body: { from: string; to: string; message: string }) {
    return this.service.send(body.from, body.to, body.message);
  }

  @Get(':user')
  getMessages() {
    return { ok: true };
  }
}
