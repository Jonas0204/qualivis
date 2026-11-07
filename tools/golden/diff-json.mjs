// Lists all leaf paths where two JSON documents differ.
// Usage: node tools/golden/diff-json.mjs <expected.json> <actual.json> [maxLines]
import { readFileSync } from 'node:fs';

const [a, b, maxArg] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: diff-json.mjs <expected.json> <actual.json> [maxLines]');
  process.exit(2);
}
const left = JSON.parse(readFileSync(a, 'utf8'));
const right = JSON.parse(readFileSync(b, 'utf8'));
const max = Number(maxArg ?? 60);
const diffs = [];

function walk(x, y, path) {
  if (diffs.length >= 10_000 || Object.is(x, y)) return;
  if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) {
    diffs.push(`${path}: ${JSON.stringify(x)} -> ${JSON.stringify(y)}`);
    return;
  }
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${path}.${k}`);
}
walk(left, right, '$');

const byPrefix = {};
for (const d of diffs) {
  const p = d.split(':')[0].replace(/\.\d+/g, '[]').split('.').slice(0, 4).join('.');
  byPrefix[p] = (byPrefix[p] ?? 0) + 1;
}
console.log(`total differences: ${diffs.length}`);
console.log('by path prefix:', byPrefix);
console.log(diffs.slice(0, max).join('\n'));
process.exit(diffs.length === 0 ? 0 : 1);
