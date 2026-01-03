import { Test, TestingModule } from '@nestjs/testing';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMapperService } from './chat.mapper.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: {
    findOrCreateConversation: jest.Mock;
    getConversations: jest.Mock;
    getMessagesPaginated: jest.Mock;
    createMessage: jest.Mock;
    markConversationAsRead: jest.Mock;
    completeTransaction: jest.Mock;
  };
  let chatMapper: { mapConversationToDto: jest.Mock; mapMessageToDto: jest.Mock };

  const makeReq = (userId = 'user-1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    chatService = {
      findOrCreateConversation: jest.fn(),
      getConversations: jest.fn(),
      getMessagesPaginated: jest.fn(),
      createMessage: jest.fn(),
      markConversationAsRead: jest.fn(),
      completeTransaction: jest.fn(),
    };
    chatMapper = {
      mapConversationToDto: jest.fn(),
      mapMessageToDto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: ChatMapperService, useValue: chatMapper },
      ],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(ChatController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    it('valid: returns "created" message when created_at equals last_message_at', async () => {
      // Mục tiêu: cover nhánh tạo mới
      const now = new Date('2025-01-01T00:00:00.000Z');
      chatService.findOrCreateConversation.mockResolvedValue({
        conversation_id: 'c1',
        created_at: now,
        last_message_at: now,
      });

      const dto = { recipient_id: 'recipient-1' } as any;
      const res = await controller.findOrCreate(dto, makeReq('user-1'));

      expect(chatService.findOrCreateConversation).toHaveBeenCalledWith('user-1', dto);
      expect(res.message).toContain('Tạo');
      expect(res.data?.conversation_id).toBe('c1');
    });

    it('valid: returns "existing" message when created_at differs from last_message_at', async () => {
      // Mục tiêu: cover nhánh lấy cũ
      const created = new Date('2025-01-01T00:00:00.000Z');
      const last = new Date('2025-01-02T00:00:00.000Z');
      chatService.findOrCreateConversation.mockResolvedValue({
        conversation_id: 'c2',
        created_at: created,
        last_message_at: last,
      });

      const dto = { recipient_id: 'recipient-1' } as any;
      const res = await controller.findOrCreate(dto, makeReq('user-1'));

      expect(res.message).toContain('Lấy');
      expect(res.data?.conversation_id).toBe('c2');
    });

    it('invalid: bubbles up errors from service', async () => {
      // Mục tiêu: service throw -> controller throw
      chatService.findOrCreateConversation.mockRejectedValue(new Error('conflict'));
      await expect(controller.findOrCreate({} as any, makeReq())).rejects.toThrow('conflict');
    });
  });

  describe('findAll', () => {
    it('valid: maps each conversation via ChatMapperService', async () => {
      // Mục tiêu: đảm bảo mapper được gọi với currentUserId
      chatService.getConversations.mockResolvedValue([
        { conversation_id: 'c1' },
        { conversation_id: 'c2' },
      ]);
      chatMapper.mapConversationToDto
        .mockReturnValueOnce({ conversation_id: 'c1-m' })
        .mockReturnValueOnce({ conversation_id: 'c2-m' });

      const res = await controller.findAll(makeReq('user-9'));
      expect(chatService.getConversations).toHaveBeenCalledWith('user-9');
      expect(chatMapper.mapConversationToDto).toHaveBeenCalledTimes(2);
      expect(res.data).toEqual([{ conversation_id: 'c1-m' }, { conversation_id: 'c2-m' }]);
    });

    it('invalid: bubbles up errors from service', async () => {
      chatService.getConversations.mockRejectedValue(new Error('db down'));
      await expect(controller.findAll(makeReq())).rejects.toThrow('db down');
    });
  });

  describe('getMessages', () => {
    it('valid: uses default page=1 limit=20 when not provided', async () => {
      // Mục tiêu: cover default values
      chatService.getMessagesPaginated.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      chatMapper.mapMessageToDto.mockReturnValue({ message_id: 'm1' });

      const res = await controller.getMessages('conv-1', {} as any);

      expect(chatService.getMessagesPaginated).toHaveBeenCalledWith('conv-1', 1, 20);
      expect(chatMapper.mapMessageToDto).toHaveBeenCalledTimes(1);
      expect(res.data?.data).toEqual([{ message_id: 'm1' }]);
    });

    it('valid: computes paging flags', async () => {
      // Mục tiêu: cover tính totalPages/hasNextPage
      chatService.getMessagesPaginated.mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        total: 5,
      });
      chatMapper.mapMessageToDto.mockImplementation((m: any) => ({ id: m.id }));

      const res = await controller.getMessages('conv-1', { page: 2, limit: 2 } as any);
      expect(res.data?.totalPages).toBe(3);
      expect(res.data?.hasNextPage).toBe(true);
      expect(res.data?.hasPreviousPage).toBe(true);
    });

    it('invalid: bubbles up errors from service', async () => {
      chatService.getMessagesPaginated.mockRejectedValue(new Error('boom'));
      await expect(controller.getMessages('conv-1', { page: 1, limit: 1 } as any)).rejects.toThrow(
        'boom',
      );
    });
  });

  describe('createMessage', () => {
    it('valid: calls service and maps message', async () => {
      // Mục tiêu: đảm bảo senderId lấy từ req
      chatService.createMessage.mockResolvedValue({ message_id: 'm1' });
      chatMapper.mapMessageToDto.mockReturnValue({ message_id: 'm1-dto' });

      const dto = { conversation_id: 'c1', content: 'hi' } as any;
      const res = await controller.createMessage(dto, makeReq('u1'));

      expect(chatService.createMessage).toHaveBeenCalledWith('u1', dto);
      expect(chatMapper.mapMessageToDto).toHaveBeenCalledWith({ message_id: 'm1' });
      expect(res.data).toEqual({ message_id: 'm1-dto' });
    });

    it('invalid: bubbles up errors from service', async () => {
      chatService.createMessage.mockRejectedValue(new Error('invalid'));
      await expect(controller.createMessage({} as any, makeReq())).rejects.toThrow('invalid');
    });
  });

  describe('markAsRead', () => {
    it('valid: calls service with userId and conversationId', async () => {
      // Mục tiêu: đảm bảo gọi markConversationAsRead
      chatService.markConversationAsRead.mockResolvedValue(undefined);
      await controller.markAsRead('conv-9', makeReq('u9'));
      expect(chatService.markConversationAsRead).toHaveBeenCalledWith('u9', 'conv-9');
    });

    it('invalid: bubbles up errors from service', async () => {
      chatService.markConversationAsRead.mockRejectedValue(new Error('nope'));
      await expect(controller.markAsRead('conv-1', makeReq())).rejects.toThrow('nope');
    });
  });

  describe('completeTransaction', () => {
    it('valid: passes conversationId, userId, final_price, notes to service', async () => {
      // Mục tiêu: đảm bảo mapping tham số đúng
      chatService.completeTransaction.mockResolvedValue({ status: 'completed' });

      await controller.completeTransaction(
        'conv-77',
        makeReq('u77'),
        { final_price: 123, notes: 'ok' } as any,
      );

      expect(chatService.completeTransaction).toHaveBeenCalledWith('conv-77', 'u77', 123, 'ok');
    });

    it('invalid: bubbles up errors from service', async () => {
      chatService.completeTransaction.mockRejectedValue(new Error('fail'));
      await expect(
        controller.completeTransaction('c1', makeReq(), { final_price: 1 } as any),
      ).rejects.toThrow('fail');
    });
  });
});
