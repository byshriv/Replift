import { expect, it } from 'vitest';
import {
  ANDROID_REDIRECT,
  androidCallback,
  backController,
} from '../../src/platform/android';

for (const seed of [606, 20261028, 0xa6d01d])
  it(`Android Back/return stress seed ${seed}`, async () => {
    let state = seed >>> 0,
      now = 10000,
      sheet = false,
      away = false,
      unsaved = false;
    let exits = 0,
      armed: number | null = null;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 2 ** 32;
    };
    const back = backController({
      closeSheet: () => {
        if (!sheet) return false;
        sheet = false;
        return true;
      },
      home: () => {
        if (!away) return false;
        away = false;
        return true;
      },
      unsaved: () => unsaved,
      hint: () => {},
      exit: async () => {
        exits++;
      },
      now: () => now,
    });
    let expectedExits = 0;
    for (let n = 0; n < 2000; n++) {
      now += Math.floor(random() * 2500);
      sheet = random() < 0.2;
      away = random() < 0.2;
      unsaved = random() < 0.2;
      if (sheet || away || unsaved) armed = null;
      else if (armed !== null && now - armed < 2000) {
        expectedExits++;
        armed = null;
      } else armed = now;
      await back();
      expect(exits).toBe(expectedExits);
      const value = `${ANDROID_REDIRECT}${n % 2 ? '/evil' : ''}?code=${n}&state=${state}`;
      expect(!!androidCallback(value)).toBe(n % 2 === 0);
    }
  });
