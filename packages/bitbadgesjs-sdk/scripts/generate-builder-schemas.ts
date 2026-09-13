import ts from 'typescript';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(import.meta.dir, '../src/core/builders');
const schemas: Record<string, unknown> = {};
for (const file of readdirSync(directory).filter((name) => name.endsWith('.ts') && !name.endsWith('.spec.ts')).sort()) {
  const source = ts.createSourceFile(file, readFileSync(resolve(directory, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const interfaces = new Map(source.statements.filter(ts.isInterfaceDeclaration).map((node) => [node.name.text, node]));
  const builder = source.statements.find((node): node is ts.FunctionDeclaration =>
    ts.isFunctionDeclaration(node) && !!node.name?.text.startsWith('build') &&
    !!node.parameters[0]?.type && ts.isTypeReferenceNode(node.parameters[0].type) &&
    node.parameters[0].type.typeName.getText(source).endsWith('Params')
  );
  if (!builder) continue;

  function schemaFor(node: ts.TypeNode, ancestors: string[] = []): Record<string, unknown> {
    if (node.kind === ts.SyntaxKind.StringKeyword) return { type: 'string' };
    if (node.kind === ts.SyntaxKind.NumberKeyword) return { type: 'number' };
    if (node.kind === ts.SyntaxKind.BooleanKeyword) return { type: 'boolean' };
    if (ts.isArrayTypeNode(node)) return { type: 'array', items: schemaFor(node.elementType, ancestors) };
    if (ts.isUnionTypeNode(node) && node.types.every((member) => ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal))) {
      return { type: 'string', enum: node.types.map((member) => ((member as ts.LiteralTypeNode).literal as ts.StringLiteral).text) };
    }
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText(source);
      if (ancestors.includes(name)) throw new Error(`Recursive builder input: ${file}:${name}`);
      const declaration = interfaces.get(name);
      if (!declaration) throw new Error(`Unknown builder input type: ${file}:${name}`);
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const member of declaration.members) {
        if (!ts.isPropertySignature(member) || !member.type || !ts.isIdentifier(member.name)) throw new Error(`Unsupported input member in ${file}:${name}`);
        const property = schemaFor(member.type, [...ancestors, name]);
        const documentation = ts.getJSDocCommentsAndTags(member).map((comment) => comment.getText(source)).join(' ').replace(/\/\*\*|\*\/|\*/g, '').trim();
        properties[member.name.text] = { ...property, ...(documentation ? { description: documentation } : {}) };
        if (!member.questionToken) required.push(member.name.text);
      }
      return { type: 'object', additionalProperties: false, properties, required };
    }
    throw new Error(`Unsupported builder input type: ${file}:${node.getText(source)}`);
  }

  schemas[file.replace(/\.ts$/, '')] = {
    builder: builder.name!.text,
    inputSchema: schemaFor(builder.parameters[0].type!)
  };
}

const target = resolve(directory, 'input-schemas.generated.json');
const output = JSON.stringify(schemas, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Builder input schemas are stale. Run bun scripts/generate-builder-schemas.ts');
} else {
  writeFileSync(target, output);
}
console.log(`Builder schemas: ${Object.keys(schemas).length} checked against TypeScript parameter declarations.`);
