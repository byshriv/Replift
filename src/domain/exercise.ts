import { z } from 'zod';

export const loggingType = z.enum([
  'kr',
  'br',
  'du',
  'mn',
  'di',
  'wb',
  'wt',
  'as',
]);
export const exerciseSchema = z.object({
  id: z.string().min(1),
  serial: z.number().int().min(1).max(420),
  name: z.string().min(1),
  muscle: z.string().min(1),
  secondary: z.string(),
  equipment: z.string().min(1),
  loggingType,
});
export type Exercise = z.infer<typeof exerciseSchema>;

export function validateCatalogue(value: unknown): readonly Exercise[] {
  const result = z.array(exerciseSchema).length(420).parse(value);
  if (
    new Set(result.map((item) => item.id)).size !== result.length ||
    result.some((item, index) => item.serial !== index + 1)
  ) {
    throw new Error(
      'Catalogue identities must be unique and serials must remain ordered 1–420',
    );
  }
  return Object.freeze(result.map((item) => Object.freeze(item)));
}

export function filterExercises(
  exercises: readonly Exercise[],
  query: string,
): readonly Exercise[] {
  const text = query.trim().toLowerCase();
  return exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(text),
  );
}
