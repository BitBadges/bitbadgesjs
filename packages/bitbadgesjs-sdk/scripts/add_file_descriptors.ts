import * as fs from 'fs-extra';
import * as path from 'path';

const addJsExtensionToImports = (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const updatedContent = fileContent.replace(/(from\s+['"])(\.{1,2}\/[^'"]+|@\/[^'"]+)(['"])/g, (match, p1, p2, p3) => {
    return p1 + (p2.endsWith('.js') ? p2 : p2 + '.js') + p3;
  });

  if (updatedContent !== fileContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`Updated imports in ${filePath}`);
  }
};

const processDirectory = (dirPath: string) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      addJsExtensionToImports(fullPath);
    }
  });
};

// Replace this with the path to your root directory
const rootDir = '/home/trevormil/CompSci/bitbadges/bitbadges-indexer/src';

processDirectory(rootDir);
