import * as yaml from 'js-yaml';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function convertYamlToJson() {
  try {
    // Read the processed YAML file
    const inputPath = join(__dirname, '..', 'openapitypes', 'combined_processed.yaml');
    const outputDir = join(__dirname, '..', 'openapi-hosted');
    const outputPath = join(outputDir, 'openapi.json');

    // Create output directory if it doesn't exist
    mkdirSync(outputDir, { recursive: true });

    // Read and parse YAML
    const fileContent = readFileSync(inputPath, 'utf8');
    const document: any = yaml.load(fileContent);

    // Convert to JSON with pretty formatting
    const jsonContent = JSON.stringify(document, null, 2);
    writeFileSync(outputPath, jsonContent, 'utf8');

    console.log('Successfully converted OpenAPI YAML to JSON');
    console.log(`Output written to: ${outputPath}`);

    // Also write a YAML version for convenience
    const yamlOutputPath = join(outputDir, 'openapi.yaml');
    writeFileSync(yamlOutputPath, fileContent, 'utf8');
    console.log(`YAML version written to: ${yamlOutputPath}`);
  } catch (error) {
    console.error('Error converting OpenAPI to JSON:', error);
    process.exit(1);
  }
}

// Execute the function
convertYamlToJson();
