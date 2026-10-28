import raw from './exercises.json';
import { validateCatalogue } from '../domain/exercise';
export const catalogue = validateCatalogue(raw);
