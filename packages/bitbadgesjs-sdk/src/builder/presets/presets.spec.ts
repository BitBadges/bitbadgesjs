/**
 * Builder eval for the collection-preset registry.
 *
 * Preset types document that golden-output tests rely on deterministic
 * renders, but the registry itself had no spec. This is a smoke eval:
 * unique ids, required descriptor fields, skill filter, getPreset.
 * Does not invent product presets.
 */
import { getPreset, listPresets } from './index.js';

describe('builder preset registry', () => {
  const all = listPresets();

  it('exports at least one preset', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('has globally unique presetIds', () => {
    const ids = all.map((p) => p.presetId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each descriptor has id, skill, name, description, paramsSchema', () => {
    for (const p of all) {
      expect(p.presetId).toMatch(/^[a-z0-9]+([.-][a-z0-9]+)+$/);
      expect(p.skillId.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.paramsSchema).toEqual(expect.any(Object));
    }
  });

  it('getPreset returns the matching descriptor fields', () => {
    const sample = all[0];
    const found = getPreset(sample.presetId);
    expect(found).toBeDefined();
    expect(found?.presetId).toBe(sample.presetId);
    expect(found?.skillId).toBe(sample.skillId);
    expect(getPreset('not-a-real-preset')).toBeUndefined();
  });

  it('listPresets({ skill }) only returns that skill', () => {
    const skill = all[0].skillId;
    const scoped = listPresets({ skill });
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every((p) => p.skillId === skill)).toBe(true);
    expect(listPresets({ skill: '__no_such_skill__' })).toEqual([]);
  });
});
