import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function expectIncludes(needle) {
  assert.ok(html.includes(needle), `expected dashboard.html to include: ${needle}`);
}

test('dashboard includes a committee action tracker section for unresolved issues', () => {
  expectIncludes('Committee Action Tracker');
  expectIncludes('id="committee-tracker-table"');
  expectIncludes('<th scope="col">Issue</th>');
  expectIncludes('<th scope="col">Issue Date</th>');
  expectIncludes('<th scope="col">Due Date</th>');
  expectIncludes('<th scope="col">Disposition</th>');
});

test('dashboard seeds the committee action tracker with current reunion follow-ups', () => {
  expectIncludes('A/V Saturday-only quote follow-up');
  expectIncludes('Mattie &amp; Sylvester Rowell wedding date confirmation');
  expectIncludes('Resolved');
  expectIncludes('Unresolved');
});
