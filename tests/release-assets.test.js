import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('published asset credits stay synchronized with the project credits', () => {
  const source = readFileSync(new URL('../assets/CREDITS.md', import.meta.url), 'utf8');
  const published = readFileSync(new URL('../public/assets/CREDITS.md', import.meta.url), 'utf8');
  assert.equal(published, source, 'Copy every credit update into the public deployment');
});
