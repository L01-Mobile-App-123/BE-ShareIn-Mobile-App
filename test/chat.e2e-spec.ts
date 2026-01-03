import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { ChatController } from '../src/modules/chat/chat.controller';
import { ChatService } from '../src/modules/chat/chat.service';
import { ChatMapperService } from '../src/modules/chat/chat.mapper.service';

describe('ChatController (e2e)', () => {
  let app: INestApplication;

  const chatService = {
    findOrCreateConversation: jest.fn(),
    getConversations: jest.fn(),
    getMessagesPaginated: jest.fn(),
    createMessage: jest.fn(),
    markConversationAsRead: jest.fn(),
    completeTransaction: jest.fn(),
  };

  const chatMapper = {
    mapConversationToDto: jest.fn(),
    mapMessageToDto: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: ChatMapperService, useValue: chatMapper },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /conversations', () => {
    it('valid: creates conversation (branch created)', async () => {
      const now = new Date('2025-01-01T00:00:00.000Z');
      chatService.findOrCreateConversation.mockResolvedValue({
        conversation_id: 'c1',
        created_at: now,
        last_message_at: now,
      });

      await request(app.getHttpServer())
        .post('/conversations')
        .send({ recipient_id: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(201);

      expect(chatService.findOrCreateConversation).toHaveBeenCalledTimes(1);
    });

    it('invalid: dto fails validation -> 400', async () => {
      // recipient_id requires UUID
      await request(app.getHttpServer())
        .post('/conversations')
        .send({ recipient_id: 'not-a-uuid' })
        .expect(400);
    });

    it('invalid: service throws -> 500', async () => {
      chatService.findOrCreateConversation.mockRejectedValue(new Error('conflict'));
      await request(app.getHttpServer())
        .post('/conversations')
        .send({ recipient_id: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(500);
    });
  });

  describe('GET /conversations', () => {
    it('valid: returns 200 and maps conversations', async () => {
      chatService.getConversations.mockResolvedValue([{ conversation_id: 'c1' }]);
      chatMapper.mapConversationToDto.mockReturnValue({ conversation_id: 'c1-m' });

      await request(app.getHttpServer()).get('/conversations').expect(200);
      expect(chatService.getConversations).toHaveBeenCalledWith('user-id-test');
      expect(chatMapper.mapConversationToDto).toHaveBeenCalledTimes(1);
    });

    it('invalid: service throws -> 500', async () => {
      chatService.getConversations.mockRejectedValue(new Error('db down'));
      await request(app.getHttpServer()).get('/conversations').expect(500);
    });
  });

  describe('GET /conversations/:id/messages', () => {
    it('valid: returns 200 with default paging', async () => {
      chatService.getMessagesPaginated.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      chatMapper.mapMessageToDto.mockReturnValue({ message_id: 'm1' });

      await request(app.getHttpServer())
        .get('/conversations/conv-1/messages')
        .expect(200);

      expect(chatService.getMessagesPaginated).toHaveBeenCalledWith('conv-1', 1, 20);
    });

    it('invalid: service throws -> 500', async () => {
      chatService.getMessagesPaginated.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer())
        .get('/conversations/conv-1/messages?page=1&limit=2')
        .expect(500);
    });
  });

  describe('POST /conversations/messages', () => {
    it('valid: sends message -> 201', async () => {
      chatService.createMessage.mockResolvedValue({ message_id: 'm1' });
      chatMapper.mapMessageToDto.mockReturnValue({ message_id: 'm1-dto' });

      await request(app.getHttpServer())
        .post('/conversations/messages')
        .send({
          conversation_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'hi',
          message_type: 'text',
        })
        .expect(201);

      expect(chatService.createMessage).toHaveBeenCalledTimes(1);
    });

    it('invalid: dto fails validation -> 400', async () => {
      await request(app.getHttpServer())
        .post('/conversations/messages')
        .send({ conversation_id: 'not-uuid', content: '' })
        .expect(400);
    });
  });

  describe('PATCH /conversations/:id/read', () => {
    it('valid: marks as read -> 200', async () => {
      chatService.markConversationAsRead.mockResolvedValue(undefined);
      await request(app.getHttpServer())
        .patch('/conversations/conv-1/read')
        .expect(200);
      expect(chatService.markConversationAsRead).toHaveBeenCalledWith('user-id-test', 'conv-1');
    });

    it('invalid: service throws -> 500', async () => {
      chatService.markConversationAsRead.mockRejectedValue(new Error('nope'));
      await request(app.getHttpServer())
        .patch('/conversations/conv-1/read')
        .expect(500);
    });
  });

  describe('POST /conversations/:conversationId/complete-transaction', () => {
    it('valid: completes transaction -> 200', async () => {
      chatService.completeTransaction.mockResolvedValue({ status: 'completed' });
      await request(app.getHttpServer())
        .post('/conversations/conv-1/complete-transaction')
        .send({ final_price: 100, notes: 'ok' })
        .expect(200);

      expect(chatService.completeTransaction).toHaveBeenCalledWith('conv-1', 'user-id-test', 100, 'ok');
    });

    it('invalid: service throws -> 500', async () => {
      chatService.completeTransaction.mockRejectedValue(new Error('fail'));
      await request(app.getHttpServer())
        .post('/conversations/conv-1/complete-transaction')
        .send({ final_price: 1 })
        .expect(500);
    });
  });
});
