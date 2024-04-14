import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Read the YAML file
const filePath = process.argv[2];
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse YAML content
  try {
    const yamlData = yaml.load(data);

    // Remove all 'title' properties from the YAML data
    removeTitleProperties(yamlData);

    // Convert the modified YAML data back to string
    let modifiedYamlContent = yaml.dump(yamlData);

    //Remove all lines with @category
    modifiedYamlContent = modifiedYamlContent
      .split('\n')
      .filter((line) => !line.includes('@category'))
      .join('\n');

    const lines = modifiedYamlContent.split('\n');
    const newLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (i + 3 < lines.length) {
        if (
          lines[i].trim() === 'anyOf:' &&
          lines[i + 1].trim() === '- type: string' &&
          lines[i + 2].trim() === '- type: number' &&
          lines[i + 3].trim() !== '- type: boolean'
        ) {
          newLines.push(lines[i].replace('anyOf:', `$ref: '#components/schemas/NumberType'`));
          i += 2;
          continue;
        }
      }

      newLines.push(lines[i]);
    }

    modifiedYamlContent = newLines.join('\n');

    // Write the modified content back to the file
    fs.writeFileSync(filePath, modifiedYamlContent, 'utf8');
  } catch (e) {
    console.error('Error parsing or modifying YAML:', e);
  }
});

// Function to remove all 'title' properties recursively
function removeTitleProperties(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeTitleProperties(obj[key]); // Recursive call
    }
    if (key === 'title') {
      delete obj[key];
    }
  }
}
