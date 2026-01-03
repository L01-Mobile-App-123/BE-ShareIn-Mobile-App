import { Test, TestingModule } from '@nestjs/testing';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: {
    search: jest.Mock;
    getSuggestions: jest.Mock;
    getSearchHistory: jest.Mock;
  };

  const makeReq = (userId = 'u1') => ({ user: { userId } } as any);

  beforeEach(async () => {
    searchService = {
      search: jest.fn(),
      getSuggestions: jest.fn(),
      getSearchHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: searchService }],
    })
      // Unit test controller: không test Guard ở đây
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(SearchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('valid: calls searchService.search with filters and userId', async () => {
      // Mục tiêu: controller truyền filters + userId
      searchService.search.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      await controller.search({ page: 1, limit: 10 } as any, makeReq('me'));
      expect(searchService.search).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'me');
    });

    it('invalid: bubbles up errors', async () => {
      searchService.search.mockRejectedValue(new Error('boom'));
      await expect(controller.search({} as any, makeReq('me'))).rejects.toThrow('boom');
    });
  });

  describe('getSuggestions', () => {
    it('valid: calls searchService.getSuggestions', async () => {
      searchService.getSuggestions.mockResolvedValue(['a']);
      await controller.getSuggestions('abc');
      expect(searchService.getSuggestions).toHaveBeenCalledWith('abc');
    });

    it('invalid: bubbles up errors', async () => {
      searchService.getSuggestions.mockRejectedValue(new Error('boom'));
      await expect(controller.getSuggestions('abc')).rejects.toThrow('boom');
    });
  });

  describe('getHistory', () => {
    it('valid: calls searchService.getSearchHistory with userId', async () => {
      searchService.getSearchHistory.mockResolvedValue([]);
      await controller.getHistory(makeReq('me'));
      expect(searchService.getSearchHistory).toHaveBeenCalledWith('me');
    });

    it('invalid: bubbles up errors', async () => {
      searchService.getSearchHistory.mockRejectedValue(new Error('boom'));
      await expect(controller.getHistory(makeReq('me'))).rejects.toThrow('boom');
    });
  });
});
