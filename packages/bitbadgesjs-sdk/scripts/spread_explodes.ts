import * as yaml from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Schema {
  type?: string;
  properties?: Record<string, any>;
  $ref?: string;
  required?: string[];
}

interface Parameter {
  in?: string;
  name?: string;
  schema?: Schema;
  explode?: boolean;
  style?: string;
  required?: boolean;
}

function resolveReference(ref: string, document: any): Schema | undefined {
  const path = ref.replace('#/', '').split('/');
  let current = document;
  for (const segment of path) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}

function expandParameter(param: Parameter, document: any): Parameter[] {
  if (!param.schema?.$ref || !param.explode) {
    return [param];
  }

  const referencedSchema = resolveReference(param.schema.$ref, document);
  if (!referencedSchema) {
    // Dangling $ref — target schema was removed upstream (e.g. a
    // deprecated payload typeconv no longer emits). Keep the param
    // unexpanded instead of crashing the whole publish. #0408
    return [param];
  }
  if (!referencedSchema.properties || Object.keys(referencedSchema.properties).length === 0) {
    return [];
  }

  return Object.entries(referencedSchema.properties).map(([propName, propSchema]) => ({
    in: param.in,
    name: propName,
    required: referencedSchema.required?.includes(propName) ?? false,
    schema: propSchema,
    style: param.style
  }));
}

function processYaml() {
  try {
    // Specify the input and output paths relative to the script
    const inputPath = join(__dirname, '..', 'openapitypes', 'combined.yaml');
    const outputPath = join(__dirname, '..', 'openapitypes', 'combined_processed.yaml');

    // Read and parse YAML
    const fileContent = readFileSync(inputPath, 'utf8');
    const document: any = yaml.load(fileContent);

    // Guard: no paths means upstream assembly failed and combined.yaml
    // is the raw typeconv output (typeconv emits an empty `paths: {}`,
    // so the loop below would otherwise complete silently and overwrite
    // the good file). Refuse to propagate it. #0408
    if (!document || !document.paths || Object.keys(document.paths).length === 0) {
      console.error('Error processing YAML: spec has no paths — upstream assembly failed, refusing to write.');
      process.exit(1);
    }

    // Process all paths
    for (const path of Object.values(document.paths)) {
      for (const method of Object.values(path)) {
        if (Array.isArray(method.parameters)) {
          const newParameters: Parameter[] = [];

          for (const param of method.parameters) {
            if (param.explode && param.in === 'query') {
              const expanded = expandParameter(param, document);
              if (expanded.length > 0) {
                newParameters.push(...expanded);
              }
            } else {
              newParameters.push(param);
            }
          }

          method.parameters = newParameters;
        }
      }
    }

    // Write processed YAML
    const newYaml = yaml.dump(document, { lineWidth: -1 });
    writeFileSync(outputPath, newYaml);
    console.log('Successfully processed YAML file');
    console.log(`Output written to: ${outputPath}`);
    //Print the entire file
    console.log(newYaml);
  } catch (error) {
    console.error('Error processing YAML:', error);
    process.exit(1);
  }
}

// Execute the function
processYaml();
