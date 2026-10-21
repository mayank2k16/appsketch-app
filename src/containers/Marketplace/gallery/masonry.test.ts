import type { MarketTemplate } from '@/api/templates';

import { shapesOf, toBlocks } from './masonry';

const app = (n: number) =>
  ({ kind: 'code', key: `a${n}`, app_type: 'mobile' }) as MarketTemplate;
const site = (n: number) =>
  ({ kind: 'code', key: `s${n}`, app_type: 'web' }) as MarketTemplate;
const layout = (n: number) =>
  ({ kind: 'layout', key: `l${n}` }) as MarketTemplate;

describe('gallery masonry', () => {
  it('gives phone apps a tall cell and every 5th website the full width', () => {
    const items = [
      app(1),
      site(1),
      site(2),
      site(3),
      site(4),
      site(5),
      site(6),
      layout(1),
    ];
    expect(shapesOf(items)).toEqual([
      'tall',
      'wide',
      '',
      '',
      '',
      '',
      'wide',
      '',
    ]);
  });

  it('holds a feature back until the columns are level', () => {
    // s2 is the first website, so a feature; it waits while a1 (2 rows) and
    // s1 (1 row) leave a hole, until s3 fills it.
    const blocks = toBlocks([app(1), site(2), site(1), site(3)]);
    expect(blocks.map((b) => b.type)).toEqual(['cols', 'wide']);
    const cols = blocks[0];
    if (cols.type !== 'cols') throw new Error('expected columns');
    expect(cols.left.map((c) => c.template.key)).toEqual(['a1']);
    expect(cols.right.map((c) => c.template.key)).toEqual(['s1', 's3']);
  });

  it('keeps every template exactly once', () => {
    const items = [
      ...Array.from({ length: 9 }, (_, i) => app(i)),
      ...Array.from({ length: 14 }, (_, i) => site(i)),
      ...Array.from({ length: 5 }, (_, i) => layout(i)),
    ];
    const keys = toBlocks(items).flatMap((b) =>
      b.type === 'wide'
        ? [b.card.template.key]
        : [...b.left, ...b.right].map((c) => c.template.key)
    );
    expect(keys.sort()).toEqual(items.map((t) => t.key).sort());
  });
});
