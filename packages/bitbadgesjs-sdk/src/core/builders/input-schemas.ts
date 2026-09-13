import { z } from 'zod';
import definitions from './input-schemas.generated.json';
import examples from './input-examples.json';

type InputSchema = {
  type: string;
  enum?: string[];
  properties?: Record<string, InputSchema>;
  required?: string[];
  items?: InputSchema;
  additionalProperties?: boolean;
};

function validator(schema: InputSchema): z.ZodTypeAny {
  if (schema.enum) return z.enum(schema.enum as [string, ...string[]]);
  if (schema.type === 'string') return z.string();
  if (schema.type === 'number') return z.number({ invalid_type_error: 'Expected a finite number' }).finite();
  if (schema.type === 'boolean') return z.boolean();
  if (schema.type === 'array' && schema.items) return z.array(validator(schema.items));
  if (schema.type === 'object' && schema.properties && schema.additionalProperties === false) {
    return z.object(Object.fromEntries(Object.entries(schema.properties).map(([key, child]) => {
      const value = validator(child);
      return [key, schema.required?.includes(key) ? value : value.optional()];
    }))).strict();
  }
  throw new Error(`Unsupported builder schema type: ${schema.type}`);
}

export function getBuilderInputSchema(name: string): InputSchema {
  if (!Object.prototype.hasOwnProperty.call(definitions, name)) throw new Error(`Unknown standard builder: ${name}`);
  return definitions[name as keyof typeof definitions].inputSchema as InputSchema;
}

export function parseBuilderInput<T>(name: string, input: T): T {
  return validator(getBuilderInputSchema(name)).parse(input) as T;
}

export function listStandardBuilders() {
  return Object.entries(definitions).map(([id, definition]) => ({ id, ...definition, example: examples[id as keyof typeof examples] }));
}
