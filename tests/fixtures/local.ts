import type { LocalData } from '../../src/domain/local';

// Entirely synthetic. No personal backups, data or credentials.
export const fixture = (): LocalData => ({
  ex: [
    {
      id: 'bench',
      n: 'Synthetic bench',
      t: 'kr',
      img: 'data:image/png;base64,AA==',
      extra: { retained: true },
    },
    { id: 'run', n: 'Synthetic run', t: 'di' },
  ],
  prog: [
    {
      id: 'p',
      n: 'Synthetic program',
      extra: 1,
      routines: [
        {
          id: 'r',
          n: 'Routine',
          day: 1,
          ex: ['bench'],
          vals: {
            bench: [{ kg: 20, reps: '8', k: 'w', rpe: 8, custom: 'keep' }],
          },
        },
      ],
    },
  ],
  wk: [
    {
      id: 'w',
      t: 123,
      r: 'r',
      title: 'Synthetic history',
      dur: 30,
      notes: 'retained',
      diff: 2,
      items: [
        { ex: 'bench', sets: [{ kg: 20, reps: 8, done: 1, est: 1, pr: 0 }] },
      ],
    },
  ],
  draft: {
    id: 'draft',
    title: 'Draft',
    items: [{ ex: 'bench', sets: [{ kg: '2.', reps: '', done: 0 }] }],
  },
  pin: { bench: 'note' },
  fav: ['bench'],
  have: ['Barbell'],
  st: { u: 'lb', sets: 3, snd: 0 },
  lay: { home: ['today'], stats: ['month'] },
  ms: { 'Body weight': [{ t: 123, v: 70, extra: 1 }] },
  cm: ['Synthetic custom measure'],
  ph: [
    {
      id: 'photo',
      t: 123,
      img: 'data:image/png;base64,AA==',
      extra: { preserved: 1 },
    },
  ],
  pf: { fn: 'Synthetic', goals: ['strength'] },
  ob: { done: 1, i: 10 },
  wt: { done: 1, i: 2 },
  bk: 123,
  pl: [{ t: 123, ex: 'bench', s: 1, k: 0 }],
  unknownFutureField: { nested: ['keep', 42] },
});
