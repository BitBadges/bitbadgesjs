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
}

interface Parameter {
    in?: string;
    name?: string;
    schema?: Schema;
    explode?: boolean;
    style?: string;
    required?: boolean;
}

function resolveReference(ref: string, document: any): Schema {
    const path = ref.replace('#/', '').split('/');
    let current = document;
    for (const segment of path) {
        current = current[segment];
    }
    return current;
}

function expandParameter(param: Parameter, document: any): Parameter[] {
    if (!param.schema?.$ref || !param.explode) {
        return [param];
    }

    const referencedSchema = resolveReference(param.schema.$ref, document);
    if (!referencedSchema.properties) {
        return [param];
    }

    return Object.entries(referencedSchema.properties).map(([propName, propSchema]) => ({
        in: param.in,
        name: propName,
        required: param.required,
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

        // Process all paths
        for (const path of Object.values(document.paths)) {
            for (const method of Object.values(path)) {
                if (Array.isArray(method.parameters)) {
                    const newParameters: Parameter[] = [];

                    for (const param of method.parameters) {
                        if (param.explode && param.in === 'query') {
                            newParameters.push(...expandParameter(param, document));
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
        console.log(`Ou tput written to: ${outputPath}`);
        //Print the entire file
        console.log(newYaml)
    } catch (error) {
        console.error('Error processing YAML:', error);
    }
}

// Execute the function
processYaml();
