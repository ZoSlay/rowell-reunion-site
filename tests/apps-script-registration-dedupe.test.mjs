import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');

function createSandbox(rows = []) {
  const sheetRows = rows.map((row) => row.slice());
  const sheet = {
    appendRow(row) {
      sheetRows.push(row.slice());
    },
    getLastRow() {
      return sheetRows.length;
    },
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          const values = [];
          for (let r = 0; r < numRows; r += 1) {
            const sourceRow = sheetRows[row - 1 + r] || [];
            const valueRow = [];
            for (let c = 0; c < numCols; c += 1) {
              valueRow.push(sourceRow[col - 1 + c]);
            }
            values.push(valueRow);
          }
          return values;
        }
      };
    }
  };

  const sandbox = {
    console,
    JSON,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Date,
    SpreadsheetApp: {
      openById(id) {
        return {
          id,
          getSheetByName(name) {
            assert.equal(name, 'Registrations');
            return sheet;
          }
        };
      }
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return {
          text,
          mimeType: null,
          setMimeType(type) {
            this.mimeType = type;
            return this;
          }
        };
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return { sandbox, sheetRows };
}

function parseResponse(response) {
  return JSON.parse(response.text);
}

const basePayload = {
  family_name: 'Touchstone',
  first_name: 'Tyrone',
  last_name: 'Randy Touchstone',
  email: 'ktouchstone7@gmail.com',
  phone: '7347657013',
  num_adults: 3,
  num_children: 0,
  num_under5: 0,
  dietary_notes: '',
  payment_method: 'Venmo',
  total_due: 1059,
  notes: ''
};

test('handleRegistration ignores a near-identical duplicate inside the dedupe window', () => {
  const recentTimestamp = new Date(Date.now() - 30 * 1000).toISOString();
  const existingRows = [[
    recentTimestamp,
    'Touchstone',
    'Tyrone',
    'Randy Touchstone',
    'ktouchstone7@gmail.com',
    '7347657013',
    3,
    0,
    0,
    '',
    'Venmo',
    1059,
    '',
    '',
    '',
    ''
  ]];
  const { sandbox, sheetRows } = createSandbox(existingRows);

  const response = parseResponse(sandbox.handleRegistration({ ...basePayload }));

  assert.equal(response.status, 'success');
  assert.equal(response.type, 'registration');
  assert.equal(response.deduped, true);
  assert.equal(sheetRows.length, 1);
});

test('handleRegistration appends when the registration payload changes', () => {
  const existingRows = [[
    '2026-05-24T21:41:37.078Z',
    'Touchstone',
    'Tyrone',
    'Randy Touchstone',
    'ktouchstone7@gmail.com',
    '7347657013',
    3,
    0,
    0,
    '',
    'Venmo',
    1059,
    '',
    '',
    '',
    ''
  ]];
  const { sandbox, sheetRows } = createSandbox(existingRows);

  const response = parseResponse(sandbox.handleRegistration({ ...basePayload, num_children: 1, total_due: 1341 }));

  assert.equal(response.status, 'success');
  assert.equal(response.deduped, false);
  assert.equal(sheetRows.length, 2);
});
