import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
const json: z.ZodType<Json> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string(), z.array(json), z.record(json)]));
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const pointer = z
  .string()
  .regex(/^\/(?:[^~]|~[01])*$/)
  .refine((value) => !value.split('/').some((part) => ['__proto__', 'prototype', 'constructor'].includes(part)), 'Unsafe pointer segment');
const common = { id, path: pointer, requirement: z.string().min(1) };
const assertion = z.discriminatedUnion('operator', [
  z.object({ ...common, operator: z.literal('equals'), expected: json }).strict(),
  z.object({ ...common, operator: z.literal('contains'), expected: json }).strict(),
  z.object({ ...common, operator: z.literal('length'), expected: z.number().int().nonnegative() }).strict()
]);
const goldenCase = z
  .object({
    version: z.literal(1),
    id,
    prompt: z.string().min(1),
    tool: z.string().regex(/^build_[a-z0-9_]+$/),
    input: z.record(json),
    clarifications: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict()),
    limitations: z.array(z.string().min(1)).min(1),
    assertions: z.array(assertion).min(1),
    mutations: z.array(z.object({ id, path: pointer, value: json, mustFail: z.array(id).min(1) }).strict())
  })
  .strict()
  .superRefine((value, context) => {
    for (const key of ['assertions', 'mutations'] as const) {
      if (new Set(value[key].map((item) => item.id)).size !== value[key].length)
        context.addIssue({ code: 'custom', path: [key], message: 'Duplicate IDs' });
    }
    const ids = new Set(value.assertions.map((item) => item.id));
    if (value.mutations.some((mutation) => mutation.mustFail.some((key) => !ids.has(key))))
      context.addIssue({ code: 'custom', path: ['mutations'], message: 'Unknown assertion in mustFail' });
  });
export type GoldenCase = z.infer<typeof goldenCase>;

export function parseCases(input: unknown): GoldenCase[] {
  const cases = z.array(goldenCase).min(1).parse(input);
  if (new Set(cases.map((item) => item.id)).size !== cases.length) throw new Error('Duplicate case IDs');
  return cases;
}

function segments(path: string): string[] {
  return path
    .slice(1)
    .split('/')
    .map((key) => key.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function readAt(root: unknown, keys: string[]): { found: boolean; value?: unknown } {
  let value = root;
  for (const key of keys) {
    if (value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) return { found: false };
    value = (value as Record<string, unknown>)[key];
  }
  return { found: true, value };
}

export function evaluateArtifact(testCase: GoldenCase, artifact: unknown) {
  return testCase.assertions.map((check) => {
    const actual = readAt(artifact, segments(check.path));
    const passed =
      actual.found &&
      (check.operator === 'equals'
        ? isDeepStrictEqual(actual.value, check.expected)
        : check.operator === 'length'
          ? Array.isArray(actual.value) && actual.value.length === check.expected
          : Array.isArray(actual.value) && actual.value.some((value) => isDeepStrictEqual(value, check.expected)));
    return { ...check, passed, found: actual.found, ...(actual.found ? { actual: actual.value } : {}) };
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type MutationResult = { id: string; caught: boolean; failedAssertions: string[]; error?: string };
type CaseResult = {
  id: string;
  passed: boolean;
  assertions: ReturnType<typeof evaluateArtifact>;
  mutations: MutationResult[];
  limitations: string[];
  error?: string;
};

export async function runCases(cases: GoldenCase[], produce: (testCase: GoldenCase) => Promise<unknown>) {
  const results: CaseResult[] = [];
  for (const testCase of parseCases(cases)) {
    const result: CaseResult = { id: testCase.id, passed: false, assertions: [], mutations: [], limitations: testCase.limitations };
    try {
      const artifact = json.parse(await produce(clone(testCase)));
      result.assertions = evaluateArtifact(testCase, artifact);
      for (const mutation of testCase.mutations) {
        const mutated = clone(artifact);
        const keys = segments(mutation.path);
        const leaf = keys.pop()!;
        const parent = readAt(mutated, keys);
        if (!parent.found || parent.value === null || typeof parent.value !== 'object' || !Object.prototype.hasOwnProperty.call(parent.value, leaf)) {
          result.mutations.push({ id: mutation.id, caught: false, failedAssertions: [], error: 'Mutation target does not exist' });
          continue;
        }
        (parent.value as Record<string, unknown>)[leaf] = clone(mutation.value);
        const failedAssertions = evaluateArtifact(testCase, mutated)
          .filter((check) => !check.passed)
          .map((check) => check.id);
        const changed = !isDeepStrictEqual(artifact, mutated);
        result.mutations.push({
          id: mutation.id,
          caught:
            changed &&
            mutation.mustFail.every((key) => result.assertions.some((check) => check.id === key && check.passed) && failedAssertions.includes(key)),
          failedAssertions,
          ...(!changed ? { error: 'Mutation did not change the artifact' } : {})
        });
      }
      result.passed = result.assertions.every((check) => check.passed) && result.mutations.every((mutation) => mutation.caught);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }
    results.push(result);
  }
  return {
    version: 1,
    scope: 'artifact-contracts',
    maturity: 'experimental',
    interpretation: 'Diagnostic only; not a source of truth or proof of correctness.',
    chainExecution: 'not-run',
    passed: results.every((result) => result.passed),
    summary: {
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length
    },
    results
  };
}
