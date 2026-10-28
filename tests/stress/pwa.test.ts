import { expect, it } from 'vitest';
import { publicLink, feedbackUrl } from '../../src/platform/links';
import { wrapText } from '../../src/platform/share';
for (const seed of [505, 20261028, 0xabc123])
  it(`share/link boundary stress, seed ${seed}`, () => {
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2 ** 32;
    };
    for (let n = 0; n < 1000; n++) {
      const text = Array.from({ length: 1 + Math.floor(random() * 600) }, () =>
        String.fromCodePoint(65 + Math.floor(random() * 40)),
      ).join('');
      const width = 1 + Math.floor(random() * 50);
      const wrapped = wrapText(text, (s) => s.length, width);
      expect(wrapped.join('')).toBe(text);
      expect(wrapped.every((line) => line.length <= width)).toBe(true);
      const note = `${text}&=?#`;
      expect(
        new URL(feedbackUrl('Other', note)).searchParams.get('body'),
      ).toContain(note);
      const unsafe = ['javascript:', 'data:', 'http:', 'file:'][n % 4] + text;
      expect(publicLink(unsafe)).toBeNull();
    }
  });
