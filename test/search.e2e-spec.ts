import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { createE2eApp } from './utils/create-e2e-app';
import { SearchController } from '../src/modules/search/search.controller';
import { SearchService } from '../src/modules/search/search.service';

describe('SearchController (e2e)', () => {
  let app: INestApplication;

  const searchService = {
    search: jest.fn(),
    getSuggestions: jest.fn(),
    getSearchHistory: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: searchService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    it('valid: 200', async () => {
      searchService.search.mockResolvedValue({ data: [], total: 0 });
      await request(app.getHttpServer()).get('/search?page=1&limit=10').expect(200);
      expect(searchService.search).toHaveBeenCalledWith(expect.any(Object), 'user-id-test');
    });

    it('invalid: service throws -> 500', async () => {
      searchService.search.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/search?page=1&limit=10').expect(500);
    });
  });

  describe('GET /search/suggestions', () => {
    it('valid: 200', async () => {
      searchService.getSuggestions.mockResolvedValue(['a']);
      await request(app.getHttpServer()).get('/search/suggestions?keyword=abc').expect(200);
      expect(searchService.getSuggestions).toHaveBeenCalledWith('abc');
    });

    it('invalid: 500', async () => {
      searchService.getSuggestions.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/search/suggestions?keyword=abc').expect(500);
    });
  });

  describe('GET /search/history', () => {
    it('valid: 200', async () => {
      searchService.getSearchHistory.mockResolvedValue([]);
      await request(app.getHttpServer()).get('/search/history').expect(200);
      expect(searchService.getSearchHistory).toHaveBeenCalledWith('user-id-test');
    });

    it('invalid: 500', async () => {
      searchService.getSearchHistory.mockRejectedValue(new Error('boom'));
      await request(app.getHttpServer()).get('/search/history').expect(500);
    });
  });
});
