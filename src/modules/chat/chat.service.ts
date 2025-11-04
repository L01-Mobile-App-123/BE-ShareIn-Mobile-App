import { Injectable } from '@nestjs/common';

export interface Message {
  from: string;
  to: string;
  message: string;
  at: string;
}

@Injectable()
export class ChatService {
  private messages: Message[] = [];

  send(from: string, to: string, message: string) {
    const m: Message = { from, to, message, at: new Date().toISOString() };
    this.messages.push(m);
    return m;
  }
}
