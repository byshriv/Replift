import { expect, it } from 'vitest';
import { catalogue } from '../../src/data/catalogue';
import { filterExercises } from '../../src/domain/exercise';
import { tabs, useNavigation } from '../../src/state/navigation';
for (const seed of [42, 20261028, 0xdecafbad]) {
  it(`preserves catalogue identity through 5000 navigation/search actions; seed=${seed}`, () => {
    let state = seed >>> 0;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    };
    const original = JSON.stringify(catalogue);
    const queries = [
      '',
      'BENCH',
      '  press ',
      'zzzz',
      'é',
      '<img>',
      ...catalogue.map((x) => x.name.slice(0, 8)),
    ];
    for (let step = 0; step < 5000; step++) {
      const tab = tabs[next() % tabs.length]!;
      const query = queries[next() % queries.length]!;
      useNavigation.getState().navigate(tab);
      useNavigation.getState().search(query);
      expect(useNavigation.getState().tab, `step=${step}`).toBe(tab);
      const result = filterExercises(catalogue, useNavigation.getState().query);
      // Independent oracle checks exact ordered membership, not just no-crash.
      const expected = catalogue.reduce<number[]>((ids, item) => {
        if (item.name.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0)
          ids.push(item.serial);
        return ids;
      }, []);
      expect(
        result.map((x) => x.serial),
        `seed=${seed} step=${step} query=${query}`,
      ).toEqual(expected);
      expect(JSON.stringify(catalogue)).toBe(original);
    }
  });
}
