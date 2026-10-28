import type { LocalData } from './local';
import { epley, exercise, num, type Set, weighted } from './workout';
export type Context = {
  weight: string;
  rpe: number | null;
  energy: number;
  sleep: number;
  soreness: number;
  stress: number;
  rest: number;
};
export type Guess = { weight: number; reps: number; probability: number };
export const defaultContext: Context = {
  weight: '',
  rpe: null,
  energy: 1,
  sleep: 1,
  soreness: 1,
  stress: 1,
  rest: 1,
};
export function reconstruct(
  d: LocalData,
  itemIndex: number,
  setIndex: number,
  c: Context,
): Guess[] {
  const draft = d.draft,
    it = draft?.items[itemIndex];
  if (!draft || !it || !weighted(d, it.ex) || it.sets[setIndex]?.done)
    return [];
  const history = [...d.wk]
    .sort((a, b) => b.t - a.t)
    .map((w) => ({
      w,
      sets:
        w.items
          .find((i) => i.ex === it.ex)
          ?.sets.filter(
            (s) =>
              s.done &&
              !s.est &&
              s.k !== 'w' &&
              num(s.kg) > 0 &&
              num(s.reps) > 0,
          ) ?? [],
    }))
    .filter((h) => h.sets.length)
    .slice(0, 4)
    .sort((a, b) => Number(b.w.r === draft.r) - Number(a.w.r === draft.r));
  if (!history.length) return [];
  const weights = [0.5, 0.3, 0.2, 0.1];
  const base = (n: number) =>
    history.reduce(
      (a, h, j) =>
        a + weights[j]! * epley(h.sets[Math.min(n, h.sets.length - 1)]!),
      0,
    ) / weights.slice(0, history.length).reduce((a, b) => a + b, 0);
  const today = it.sets
    .map((s, n) => ({ ...s, n }))
    .filter(
      (s) =>
        s.done &&
        !s.est &&
        s.n !== setIndex &&
        s.k !== 'w' &&
        num(s.kg) > 0 &&
        num(s.reps) > 0,
    );
  let strength = base(setIndex);
  if (today.length)
    strength *= Math.pow(
      today.reduce((a, s) => a + epley(s) / base(s.n), 0) / today.length,
      0.7,
    );
  const nudge =
    [0.97, 1, 1.02][c.energy]! *
    [0.985, 1, 1.01][c.sleep]! *
    [1.005, 1, 0.97][c.soreness]! *
    [1, 1, 0.985][c.stress]! *
    [0.97, 1, 1.01][c.rest]!;
  strength *= today.length ? 1 + (nudge - 1) / 2 : nudge;
  const mean = (s: Set[]) => s.reduce((a, s) => a + epley(s), 0) / s.length;
  const trend =
    history.length > 1 ? mean(history[0]!.sets) / mean(history[1]!.sets) : 1;
  strength *= 1 + 0.3 * Math.max(-0.1, Math.min(0.1, trend - 1));
  const earlier = draft.items
    .slice(0, itemIndex)
    .filter((i) => exercise(d, i.ex)?.m === exercise(d, it.ex)?.m)
    .reduce((a, i) => a + i.sets.filter((s) => s.done).length, 0);
  strength *= 1 - 0.01 * Math.min(earlier, 6);
  const allWeights = [
      ...new Set(
        history
          .flatMap((h) => h.sets.map((s) => num(s.kg)))
          .concat(today.map((s) => num(s.kg))),
      ),
    ].sort((a, b) => a - b),
    diffs = allWeights
      .slice(1)
      .map((n, i) => n - allWeights[i]!)
      .filter((n) => n > 0.4),
    step = diffs.length ? Math.min(...diffs) : d.st?.u === 'lb' ? 2.27 : 2.5;
  const nearest = today.reduce<(typeof today)[number] | null>(
    (a, s) =>
      !a || Math.abs(s.n - setIndex) < Math.abs(a.n - setIndex) ? s : a,
    null,
  );
  const last = num(
      nearest?.kg ??
        history[0]!.sets[Math.min(setIndex, history[0]!.sets.length - 1)]!.kg,
    ),
    known = num(c.weight);
  let up = nearest ? 0.14 : 0.25,
    down = nearest ? 0.14 : 0.15;
  if (c.energy === 2) {
    up += 0.05;
    down -= 0.05;
  }
  if (c.energy === 0) {
    up -= 0.05;
    down += 0.05;
  }
  const candidates =
    known > 0
      ? [[known, 1]]
      : [
          [last, 1 - up - down],
          [last + step, up],
          [Math.max(step, last - step), down],
        ];
  const sigma =
    (history.length < 2 ? 2.4 : 1.6) *
    (today.length ? 0.85 : 1) *
    (c.rpe !== null ? 0.85 : 1) *
    (known > 0 ? 0.9 : 1);
  const scores: { weight: number; reps: number; score: number }[] = [];
  for (const [weight, prior] of candidates) {
    const mu = Math.max(
      1,
      30 * (strength / weight! - 1) + (c.rpe === null ? 0 : 0.6 * (c.rpe - 8)),
    );
    for (
      let reps = Math.max(1, Math.round(mu) - 3);
      reps <= Math.round(mu) + 3;
      reps++
    )
      scores.push({
        weight: weight!,
        reps,
        score:
          Math.log(Math.max(prior!, 0.01)) -
          (reps - mu) ** 2 / (2 * sigma * sigma),
      });
  }
  const max = Math.max(...scores.map((s) => s.score)),
    z = scores.reduce((a, s) => a + Math.exp(s.score - max), 0);
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => ({
      weight: s.weight,
      reps: s.reps,
      probability: Math.exp(s.score - max) / z,
    }));
}
