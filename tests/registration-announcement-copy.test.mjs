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
  expectIncludes(updatesHtml, 'A family member has generously offered to cover the registration fee for one adult or one child.', 'updates.html');
  expectIncludes(updatesHtml, 'rowellfamilyreunion2026@gmail.com', 'updates.html');
  expectIncludes(updatesHtml, 'If anyone else is interested in volunteering to sponsor, please reach me at the website email.', 'updates.html');
});

test('updates page still includes hotel and payment deadlines plus treasurer mailing option', () => {
  expectIncludes(updatesHtml, 'https://group.hilton.com/sdxms1', 'updates.html');
  expectIncludes(updatesHtml, 'June 15, 2026', 'updates.html');
  expectIncludes(updatesHtml, 'June 26, 2026', 'updates.html');
  expectIncludes(updatesHtml, 'Venmo is the preferred payment method.', 'updates.html');
  expectIncludes(updatesHtml, 'checks payable to <strong>Rowell Family Reunion</strong>', 'updates.html');
  expectIncludes(updatesHtml, 'Treasurer Cassandra Rowell Miller, 12820 Prairie Dog Ave, San Diego, CA 92129', 'updates.html');
  expectIncludes(updatesHtml, '12820 Prairie Dog Ave, San Diego, CA 92129', 'updates.html');
});

test('registration page offers pay-by-mail guidance with treasurer mailing address', () => {
  expectIncludes(registerHtml, 'Venmo is the preferred payment method', 'register.html');
  expectIncludes(registerHtml, 'Pay by check or mail to Treasurer Cassandra Rowell Miller', 'register.html');
  expectIncludes(registerHtml, 'checks payable to <strong>Rowell Family Reunion</strong>', 'register.html');
  expectIncludes(registerHtml, '12820 Prairie Dog Ave, San Diego, CA 92129', 'register.html');
  expectIncludes(registerHtml, "Family members who choose this route are highly encouraged to use their bank's bill pay / pay-by-mail service because it helps guarantee delivery and provides tracking.", 'register.html');
});

test('registration page mentions anonymous sponsorship availability and contact email', () => {
  expectIncludes(registerHtml, 'A family member has generously offered to cover the registration fee for one adult or one child.', 'register.html');
  expectIncludes(registerHtml, 'rowellfamilyreunion2026@gmail.com', 'register.html');
  expectIncludes(registerHtml, 'If anyone else is interested in volunteering to sponsor, please reach me at the website email.', 'register.html');
});

test('updates page is labeled Announcements in title and navigation', () => {
  expectIncludes(updatesHtml, '<title>Announcements', 'updates.html');
  expectIncludes(updatesHtml, '>Announcements</a>', 'updates.html');
  expectIncludes(updatesHtml, '<h1>Announcements</h1>', 'updates.html');
  assert.equal(updatesHtml.includes('<title>Updates'), false, 'expected old Updates title to be removed');
});


test('all top navigation links label updates.html as Announcements', () => {
  const pages = [
    'index.html',
    'events.html',
    'register.html',
    'next-steps.html',
    'family-history.html',
    'generations.html',
    'in-memoriam.html',
    'past-reunions.html',
    'family-archive.html',
    'feedback.html',
    'thank-you.html',
    'dashboard.html',
    'admin-documents.html',
    'admin-roll-call.html',
    'admin-updates.html'
  ];
  for (const page of pages) {
    const html = fs.readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.ok(html.includes('href="updates.html">Announcements</a>') || html.includes('href="updates.html" class="nav-active">Announcements</a>'), `expected ${page} top nav to say Announcements`);
    assert.equal(html.includes('href="updates.html">Updates</a>') || html.includes('href="updates.html" class="nav-active">Updates</a>'), false, `expected ${page} to remove old Updates nav label`);
  }
});
