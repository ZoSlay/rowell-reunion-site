import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../family-history.html', import.meta.url), 'utf8');

test('family history uses the confirmed December 15, 1912 wedding date consistently', () => {
  assert.ok(html.includes('December 15, 1912'), 'expected confirmed wedding date to appear');
  assert.equal(html.includes('December 12, 1912'), false, 'expected conflicting December 12, 1912 date to be removed');
});
