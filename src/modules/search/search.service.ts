import { Injectable } from '@nestjs/common';

export interface SearchItem {
  id: string;
  title: string;
  category?: string;
}

@Injectable()
export class SearchService {
  private items: SearchItem[] = [
    { id: '1', title: 'Bán xe máy', category: 'xe' },
    { id: '2', title: 'Cho thuê nhà', category: 'nhà' },
  ];

  search(opts: { q?: string; category?: string }) {
    let res = this.items;
    if (opts.q) {
      const q = opts.q.toLowerCase();
      res = res.filter((i) => i.title.toLowerCase().includes(q));
    }
    if (opts.category) {
      res = res.filter((i) => i.category === opts.category);
    }
    return res;
  }
}
