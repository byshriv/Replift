import { create } from 'zustand';
export const tabs = [
  'Home',
  'Stats',
  'Workout',
  'Library',
  'Settings',
] as const;
export type Tab = (typeof tabs)[number];
interface Navigation {
  tab: Tab;
  query: string;
  navigate: (tab: Tab) => void;
  search: (query: string) => void;
}
// Intentionally transient: Phase 1 never reads or writes legacy user storage.
export const useNavigation = create<Navigation>((set) => ({
  tab: 'Home',
  query: '',
  navigate: (tab) => set({ tab }),
  search: (query) => set({ query }),
}));
