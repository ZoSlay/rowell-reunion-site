import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const updatesHtml = fs.readFileSync(new URL('../updates.html', import.meta.url), 'utf8');
const registerHtml = fs.readFileSync(new URL('../register.html', import.meta.url), 'utf8');

function expectIncludes(html, needle, fileLabel) {
  assert.ok(html.includes(needle), `expected ${fileLabel} to include: ${needle}`);
}

test('updates page includes a separate anonymous sponsor announcement with contact email', () => {
  expectIncludes(updatesHtml, 'Anonymous Sponsorship Available', 'updates.html');
  expectIncludes(updatesHtml, 'A family member has generously offered to cover the registration fee for one adult or one child anonymously.', 'updates.html');
  expectIncludes(updatesHtml, 'rowellfamilyreunion2026@gmail.com', 'updates.html');
});

test('updates page still includes hotel and payment deadlines plus treasurer mailing option', () => {
  expectIncludes(updatesHtml, 'https://group.hilton.com/sdxms1', 'updates.html');
  expectIncludes(updatesHtml, 'June 15, 2026', 'updates.html');
  expectIncludes(updatesHtml, 'June 26, 2026', 'updates.html');
  expectIncludes(updatesHtml, 'Pay by mail to Treasurer Sandy', 'updates.html');
  expectIncludes(updatesHtml, '12820 Prairie Dog Ave, San Diego, CA 92129', 'updates.html');
});

test('registration page offers pay-by-mail guidance with treasurer mailing address', () => {
  expectIncludes(registerHtml, 'Pay by mail to Treasurer Sandy', 'register.html');
  expectIncludes(registerHtml, '12820 Prairie Dog Ave, San Diego, CA 92129', 'register.html');
  expectIncludes(registerHtml, "Family members who choose this route are highly encouraged to use their bank's bill pay / pay-by-mail service because it helps guarantee delivery and provides tracking.", 'register.html');
});

test('registration page mentions anonymous sponsorship availability and contact email', () => {
  expectIncludes(registerHtml, 'A family member has generously offered to cover the registration fee for one adult or one child anonymously.', 'register.html');
  expectIncludes(registerHtml, 'rowellfamilyreunion2026@gmail.com', 'register.html');
});
