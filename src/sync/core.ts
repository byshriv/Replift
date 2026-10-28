import { z } from 'zod';
import { validateData, legacySchema, routineSchema } from '../domain/local';
import type { LocalData } from '../domain/local';

export type Clock = Record<string, number>;
export type Alternative = {
  clock: Clock;
  value: unknown;
  deleted?: true | undefined;
};
export type Document = {
  format: 'replift-sync';
  version: 3;
  legacy: string[];
  records: Record<string, Alternative[]>;
};
const localKeys = new Set(['draft', 'ob', 'wt', 'bk']);
const key = (...parts: string[]) => JSON.stringify(parts);
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const canonical = (value: unknown): string => {
  if (value === undefined)
    throw new Error('Undefined data cannot be synchronized.');
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value)
    .sort(([a], [b]) => compare(a, b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
    .join(',')}}`;
};
export const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
export function join(...clocks: Clock[]): Clock {
  const result: Clock = Object.create(null) as Clock;
  for (const clock of clocks)
    for (const [d, n] of Object.entries(clock))
      result[d] = Math.max(result[d] ?? 0, n);
  return result;
}
export function dominates(a: Clock, b: Clock) {
  return Object.entries(b).every(([d, n]) => (a[d] ?? 0) >= n);
}
function normalize(items: Alternative[]): Alternative[] {
  const payload = (a: Alternative) => [!!a.deleted, a.value];
  // Same causal stamp with different contents is corruption, never a winner rule.
  for (const a of items)
    for (const b of items)
      if (same(a.clock, b.clock) && !same(payload(a), payload(b)))
        throw new Error(
          'Conflicting contents for the same causal version. Data retained.',
        );
  const live = items.filter(
    (a) =>
      !items.some(
        (b) => dominates(b.clock, a.clock) && !dominates(a.clock, b.clock),
      ),
  );
  const groups = new Map<string, Alternative>();
  for (const a of live) {
    const k = canonical(payload(a)),
      prior = groups.get(k);
    groups.set(k, { ...a, clock: join(prior?.clock ?? {}, a.clock) });
  }
  return [...groups.values()].sort((a, b) =>
    compare(canonical(a), canonical(b)),
  );
}
export function merge(a: Document, b: Document): Document {
  const records: Document['records'] = Object.create(
    null,
  ) as Document['records'];
  for (const k of new Set([
    ...Object.keys(a.records),
    ...Object.keys(b.records),
  ]))
    records[k] = normalize([...(a.records[k] ?? []), ...(b.records[k] ?? [])]);
  return {
    format: 'replift-sync',
    version: 3,
    legacy: [...new Set([...a.legacy, ...b.legacy])].sort(),
    records,
  };
}
export function flatten(input: LocalData): Record<string, unknown> {
  const data = validateData(input);
  const records: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const [k, v] of Object.entries(data)) {
    if (localKeys.has(k)) continue;
    if (['ex', 'wk', 'ph'].includes(k)) {
      for (const item of v as { id: string }[]) records[key(k, item.id)] = item;
      records[key('order', k)] = (v as { id: string }[]).map((v) => v.id);
    } else if (k === 'prog') {
      for (const p of data.prog) {
        const { routines, ...meta } = p;
        records[key('prog', p.id)] = meta;
        for (const r of routines)
          records[key('routine', r.id)] = { data: r, program: p.id };
        records[key('order', `routines:${p.id}`)] = routines.map((r) => r.id);
      }
      records[key('order', 'prog')] = data.prog.map((p) => p.id);
    } else if (k === 'ms') {
      for (const [name, values] of Object.entries(data.ms ?? {})) {
        const counts = new Map<number, number>();
        for (const value of values) {
          const occurrence = counts.get(value.t) ?? 0;
          counts.set(value.t, occurrence + 1);
          const id =
            typeof value.id === 'string'
              ? value.id
              : `legacy:${value.t}:${occurrence}`;
          const identity = key('measure', name, id);
          if (Object.hasOwn(records, identity))
            throw new Error(
              'Duplicate measurement identities. Original data retained.',
            );
          records[identity] = { ...value, id };
        }
      }
    } else if (k === 'st') {
      records[key('root', k)] = Object.fromEntries(
        Object.entries(data.st ?? {}).filter(([s]) => !/^dbx|^ls$/i.test(s)),
      );
    } else records[key('root', k)] = v;
  }
  return records;
}
export async function bootstrap(data: LocalData): Promise<Document> {
  // Identical initial records have identical ancestry on every device. Giving
  // each device its own genesis would resurrect stale initial values as conflicts.
  const entries = await Promise.all(
    Object.entries(flatten(data)).map(
      async ([key, value]): Promise<[string, Alternative[]]> => {
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(canonical([key, value])),
        );
        const id = [...new Uint8Array(digest)]
          .map((n) => n.toString(16).padStart(2, '0'))
          .join('');
        return [key, [{ value, clock: { [`initial:${id}`]: 1 } }]];
      },
    ),
  );
  return {
    format: 'replift-sync',
    version: 3,
    legacy: [],
    records: Object.fromEntries(entries),
  };
}
export function update(
  doc: Document | undefined,
  data: LocalData,
  device: string,
  before?: LocalData,
): Document {
  const result: Document = structuredClone(
    doc ?? { format: 'replift-sync', version: 3, legacy: [], records: {} },
  );
  const values = flatten(data);
  const previous = before ? flatten(before) : undefined;
  let clock = join(
    ...Object.values(result.records).flatMap((v) => v.map((a) => a.clock)),
  );
  const n = (clock[device] ?? 0) + 1;
  if (!Number.isSafeInteger(n)) throw new Error('Sync counter exhausted.');
  clock = { ...clock, [device]: n };
  for (const k of new Set([
    ...Object.keys(values),
    ...Object.keys(result.records),
  ])) {
    const present = Object.hasOwn(values, k);
    const value = present ? values[k] : null;
    const alternatives = result.records[k];
    if (
      previous &&
      Object.hasOwn(previous, k) === present &&
      same(Object.hasOwn(previous, k) ? previous[k] : null, value)
    )
      continue;
    // Editing a conflicted record requires explicit review; unrelated edits still progress.
    if (alternatives && alternatives.length > 1) {
      // A new/deleted item must not resolve an existing ordering dispute.
      // Membership is carried by item records; unseen members append stably.
      if ((JSON.parse(k) as string[])[0] === 'order') continue;
      if (
        !same(alternatives[0]!.value, value) ||
        !!alternatives[0]!.deleted === present
      )
        throw new Error(
          'Review this record’s sync conflict before editing it.',
        );
    } else if (
      !alternatives ||
      !same(alternatives[0]!.value, value) ||
      !!alternatives[0]!.deleted === present
    )
      result.records[k] = [
        { value, clock, ...(!present ? { deleted: true as const } : {}) },
      ];
  }
  return result;
}
export function resolve(
  doc: Document,
  record: string,
  expected: string,
  index: number,
  device: string,
): Document {
  const variants = doc.records[record];
  if (!variants || canonical(variants) !== expected || !variants[index])
    throw new Error('Conflict changed. Review the latest alternatives.');
  const result = structuredClone(doc);
  const clock = join(
    ...Object.values(doc.records).flatMap((v) => v.map((a) => a.clock)),
  );
  const next = (clock[device] ?? 0) + 1;
  if (!Number.isSafeInteger(next)) throw new Error('Sync counter exhausted.');
  result.records[record] = [
    { ...variants[index], clock: { ...clock, [device]: next } },
  ];
  return result;
}
export function restoreIntent(
  current: Document,
  data: LocalData,
  backup: Document | undefined,
  device: string,
  intent: string,
): Document {
  const result = structuredClone(current);
  const values = flatten(data);
  const base = join(
    ...Object.values(current.records).flatMap((v) => v.map((a) => a.clock)),
    ...Object.values(backup?.records ?? {}).flatMap((v) =>
      v.map((a) => a.clock),
    ),
  );
  const next = (base[device] ?? 0) + 1;
  if (!Number.isSafeInteger(next)) throw new Error('Sync counter exhausted.');
  for (const key of new Set([
    ...Object.keys(current.records),
    ...Object.keys(values),
    ...Object.keys(backup?.records ?? {}),
  ])) {
    const alternatives = backup?.records[key];
    // Re-version every restored alternative as one explicit, concurrent intent.
    // Ancient backup clocks can never overwrite a newer deletion by accident.
    if (alternatives && alternatives.length > 1)
      result.records[key] = alternatives.map((a, index) => ({
        ...a,
        clock: { ...base, [device]: next, [`restore:${intent}:${index}`]: 1 },
      }));
    else
      result.records[key] = [
        {
          value: Object.hasOwn(values, key) ? values[key] : null,
          ...(!Object.hasOwn(values, key) ? { deleted: true as const } : {}),
          clock: { ...base, [device]: next },
        },
      ];
  }
  result.legacy = [
    ...new Set([...current.legacy, ...(backup?.legacy ?? [])]),
  ].sort();
  return result;
}
export function keepBoth(
  doc: Document,
  record: string,
  expected: string,
  device: string,
  ids: string[],
): Document {
  const variants = doc.records[record];
  const parts = JSON.parse(record) as string[];
  if (
    !variants ||
    variants.length < 2 ||
    variants.some((v) => v.deleted) ||
    !['measure', 'ph'].includes(parts[0]!) ||
    ids.length !== variants.length - 1 ||
    new Set(ids).size !== ids.length
  )
    throw new Error(
      'Keep both is available only for separate measurement readings or photos.',
    );
  const result = resolve(doc, record, expected, 0, device);
  const clock = result.records[record]![0]!.clock;
  variants.slice(1).forEach((variant, index) => {
    const identity =
      parts[0] === 'measure'
        ? key('measure', parts[1]!, ids[index]!)
        : key('ph', ids[index]!);
    if (Object.hasOwn(result.records, identity))
      throw new Error('New record identity already exists.');
    result.records[identity] = [
      { value: { ...(variant.value as object), id: ids[index]! }, clock },
    ];
  });
  return result;
}
export function materialize(doc: Document, local: LocalData): LocalData {
  const data: Record<string, unknown> = {
    ex: [],
    prog: [],
    wk: [],
    ph: [],
    ms: {},
  };
  for (const k of localKeys) if (Object.hasOwn(local, k)) data[k] = local[k];
  const routines: { program: string; data: unknown }[] = [];
  const orders = new Map<string, string[]>();
  for (const [k, alternatives] of Object.entries(doc.records).sort(([a], [b]) =>
    compare(a, b),
  )) {
    const value = alternatives[0]!.value;
    if (alternatives[0]!.deleted) continue;
    const [kind, id] = JSON.parse(k) as string[];
    if (kind === 'order') orders.set(id!, value as string[]);
    else if (kind === 'root') data[id!] = value;
    else if (kind === 'measure') {
      const ms = data.ms as Record<string, unknown[]>;
      // Avoid special property setters on imported names.
      if (!Object.hasOwn(ms, id!))
        Object.defineProperty(ms, id!, {
          value: [],
          enumerable: true,
          writable: true,
        });
      ms[id!]!.push(value);
    } else if (kind === 'routine')
      routines.push(value as (typeof routines)[number]);
    else if (kind === 'prog')
      (data.prog as unknown[]).push({ ...(value as object), routines: [] });
    else (data[kind!] as unknown[]).push(value);
  }
  for (const r of routines) {
    const p = (data.prog as { id: string; routines: unknown[] }[]).find(
      (p) => p.id === r.program,
    );
    if (!p)
      throw new Error(
        'A routine has no program. Review deletion conflicts or recover a backup; both versions are retained.',
      );
    p.routines.push(r.data);
  }
  const sort = (items: { id: string }[], name: string) => {
    const order = orders.get(name) ?? [];
    items.sort((a, b) => {
      const x = order.indexOf(a.id),
        y = order.indexOf(b.id);
      return (
        (x < 0 ? order.length : x) - (y < 0 ? order.length : y) ||
        compare(a.id, b.id)
      );
    });
  };
  for (const name of ['ex', 'wk', 'ph', 'prog'])
    sort(data[name] as { id: string }[], name);
  for (const p of data.prog as { id: string; routines: { id: string }[] }[])
    sort(p.routines, `routines:${p.id}`);
  for (const values of Object.values(
    data.ms as Record<string, { t: number }[]>,
  ))
    values.sort((a, b) => a.t - b.t);
  return validateData(data);
}
const clockSchema = z.record(
  z.string().min(1).max(200),
  z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
);
const docSchema = z.strictObject({
  format: z.literal('replift-sync'),
  version: z.literal(3),
  legacy: z.array(z.string().min(1)),
  records: z.record(
    z.string(),
    z
      .array(
        z.strictObject({
          clock: clockSchema,
          value: z.json(),
          deleted: z.literal(true).optional(),
        }),
      )
      .min(1)
      .max(100),
  ),
});
export function parseDocument(value: unknown): Document {
  const doc = docSchema.parse(value);
  for (const [k, v] of Object.entries(doc.records)) {
    const parts: unknown = JSON.parse(k);
    if (
      !Array.isArray(parts) ||
      parts.some((s) => typeof s !== 'string' || !s) ||
      ![
        'ex',
        'wk',
        'ph',
        'prog',
        'routine',
        'root',
        'measure',
        'order',
      ].includes(parts[0] as string) ||
      parts.length !== (parts[0] === 'measure' ? 3 : 2) ||
      (parts[0] === 'root' &&
        (localKeys.has(parts[1] as string) ||
          [
            '__proto__',
            'prototype',
            'constructor',
            'ex',
            'wk',
            'ph',
            'prog',
            'ms',
          ].includes(parts[1] as string)))
    )
      throw new Error('Invalid sync record identity.');
    if (v.some((a) => !Object.keys(a.clock).length))
      throw new Error('Missing causal version.');
    for (const a of v) {
      if (a.deleted) {
        if (a.value !== null) throw new Error('Invalid deletion marker.');
        continue;
      }
      const [kind, id] = parts as string[];
      if (kind === 'order') {
        const ids = z.array(z.string()).parse(a.value);
        if (new Set(ids).size !== ids.length)
          throw new Error('Duplicate ordering identities.');
      } else if (kind === 'routine') {
        const routine = z
          .strictObject({ program: z.string().min(1), data: routineSchema })
          .parse(a.value).data;
        if (
          routine.id !== id ||
          routine.ex.some((e) => !routine.vals?.[e]) ||
          Object.values(routine.vals ?? {}).some((sets) =>
            sets.some((s) => !s.id),
          )
        )
          throw new Error('Invalid routine identity or set identities.');
      } else if (kind === 'prog') {
        const p = z
          .looseObject({ id: z.literal(id!), n: z.string() })
          .parse(a.value);
        if ('routines' in p)
          throw new Error('Nested cloud routines are unsupported.');
      } else if (kind === 'measure')
        z.looseObject({
          id: z.literal((parts as string[])[2]!),
          t: z.number().finite(),
          v: z.union([z.string(), z.number().finite()]),
        }).parse(a.value);
      else if (kind === 'ex' || kind === 'wk' || kind === 'ph') {
        const schema =
          kind === 'ph'
            ? legacySchema.shape.ph.unwrap().element
            : legacySchema.shape[kind].element;
        const item = schema.parse(a.value);
        if (item.id !== id)
          throw new Error('Record identity differs from its key.');
      }
    }
    normalize(v);
  }
  assertPrivateFree(doc);
  return doc;
}
export function assertPrivateFree(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (/^dbx|token|oauth|secret|authorization|code_verifier/i.test(k))
      throw new Error(
        'Private connection fields cannot enter shared data or backups.',
      );
    assertPrivateFree(v);
  }
}
export function legacyCloud(value: unknown): LocalData {
  const envelope = z
    .strictObject({
      schema: z.literal(1),
      app: z.literal('Replift'),
      updatedAt: z.string().optional(),
      data: z.unknown(),
    })
    .parse(value);
  const data = validateData(envelope.data);
  if (data.st)
    data.st = Object.fromEntries(
      Object.entries(data.st).filter(([k]) => !/^dbx|^ls$/i.test(k)),
    );
  assertPrivateFree(data);
  // Deterministic identities for legacy routine sets, independent of importing device.
  const configured = data.st?.sets;
  const count =
    typeof configured === 'number' &&
    Number.isInteger(configured) &&
    configured >= 1 &&
    configured <= 20
      ? configured
      : 3;
  for (const p of data.prog)
    for (const r of p.routines) {
      r.vals ??= {};
      for (const e of r.ex)
        r.vals[e] ??= Array.from({ length: count }, () => ({
          kg: '',
          reps: '',
        }));
      for (const [e, sets] of Object.entries(r.vals))
        sets.forEach((s, i) => {
          s.id ??= `legacy:${r.id}:${e}:${i}`;
        });
    }
  return data;
}
