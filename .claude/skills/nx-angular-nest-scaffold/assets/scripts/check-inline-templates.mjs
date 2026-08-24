import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const roots = ['apps', 'libs'];
const maxInlineTemplateLength = 100;
const templatePattern = /template\s*:\s*(`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*")/gs;
const violations = [];

function walk(directory) {
  if (!statSync(directory).isDirectory()) return;

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    if (extname(path) !== '.ts') continue;

    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(templatePattern)) {
      const template = match[1].slice(1, -1).trim();
      if (template.length > maxInlineTemplateLength) {
        violations.push({ path: relative(root, path), length: template.length });
      }
    }
  }
}

for (const directory of roots) {
  try {
    walk(join(root, directory));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

if (violations.length > 0) {
  console.error(`Inline Angular templates must be <= ${maxInlineTemplateLength} characters.`);
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.length} characters; use templateUrl`);
  }
  process.exit(1);
}

console.log(`Inline Angular template check passed (max ${maxInlineTemplateLength} characters).`);
