import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { catalogue } from '../../src/data/catalogue';
import { filterExercises, validateCatalogue } from '../../src/domain/exercise';
describe('baseline exercise contract', () => {
  it('matches all baseline tuples, original slug identities and serial order', () => {
    const source = readFileSync('reference/Replift-PWA/index.html', 'utf8');
    const match = source.match(/const LIB=(\[.*?\]);/);
    if (!match?.[1]) throw new Error('Missing baseline library');
    const tuples = JSON.parse(match[1]) as string[][];
    expect(catalogue).toHaveLength(420);
    catalogue.forEach((exercise, i) => {
      expect([
        exercise.name,
        exercise.muscle,
        exercise.secondary,
        exercise.equipment,
        exercise.loggingType,
      ]).toEqual(tuples[i]);
      expect(exercise.id).toBe(
        exercise.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
      expect(exercise.serial).toBe(i + 1);
    });
    expect(catalogue[0]?.name).toBe('Barbell Bench Press');
    expect(new Set(catalogue.map((x) => x.loggingType)).size).toBe(8);
  });
  it('rejects missing, duplicate, reordered or unsupported records', () => {
    expect(() => validateCatalogue(catalogue.slice(1))).toThrow();
    expect(() =>
      validateCatalogue(
        catalogue.map((x, i) => (i === 1 ? { ...x, id: catalogue[0]?.id } : x)),
      ),
    ).toThrow();
    expect(() => validateCatalogue([...catalogue].reverse())).toThrow();
    expect(() =>
      validateCatalogue(
        catalogue.map((x, i) =>
          i === 0 ? { ...x, loggingType: 'unknown' } : x,
        ),
      ),
    ).toThrow();
  });
  it('filters without mutating the catalogue and handles empty results', () => {
    expect(filterExercises(catalogue, '  BARBELL BENCH PRESS ')).toEqual([
      catalogue[0],
      catalogue[1],
      catalogue[8],
    ]);
    expect(filterExercises(catalogue, '')).toHaveLength(420);
    expect(filterExercises(catalogue, '<script>')).toEqual([]);
    expect(Object.isFrozen(catalogue[0])).toBe(true);
  });
});
