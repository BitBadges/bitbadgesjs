/**
 * Builder eval for the collection-preset registry.
 *
 * Preset types document that golden-output tests rely on deterministic
 * renders, but the registry itself had no spec. This is a smoke eval:
 * unique ids, required descriptor fields, skill filter, getPreset.
 * Also locks deepMergeOverrides semantics used by add_preset_approval.
 * Does not invent product presets.
 */
import { deepMergeOverrides, getPreset, listPresets } from './index.js';

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

describe('deepMergeOverrides', () => {
  it('returns the rendered approval when overrides are nullish or non-object', () => {
    const rendered = { a: 1, nested: { b: 2 } };
    expect(deepMergeOverrides(rendered, undefined)).toEqual(rendered);
    expect(deepMergeOverrides(rendered, null)).toEqual(rendered);
  });

  it('merges objects recursively and leaves missing override keys intact', () => {
    const rendered = { a: 1, nested: { b: 2, c: 3 }, keep: true };
    const merged = deepMergeOverrides(rendered, { nested: { b: 9 }, a: 7 });
    expect(merged).toEqual({ a: 7, nested: { b: 9, c: 3 }, keep: true });
    // Inputs must not be mutated.
    expect(rendered).toEqual({ a: 1, nested: { b: 2, c: 3 }, keep: true });
  });

  it('replaces arrays wholesale instead of concatenating', () => {
    const rendered = { coins: [{ denom: 'ubadge', amount: '1' }, { denom: 'ustake', amount: '2' }] };
    const merged = deepMergeOverrides(rendered, { coins: [{ denom: 'ubadge', amount: '99' }] });
    expect(merged).toEqual({ coins: [{ denom: 'ubadge', amount: '99' }] });
  });

  it('ignores undefined override values but respects explicit null', () => {
    const rendered = { a: 1, b: 2, c: { d: 3 } };
    const merged = deepMergeOverrides(rendered, { a: undefined, b: null, c: { d: undefined, e: 4 } });
    expect(merged).toEqual({ a: 1, b: null, c: { d: 3, e: 4 } });
  });
});
