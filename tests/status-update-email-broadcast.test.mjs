import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');

function makeSheet(initialRows = []) {
  const rows = initialRows.map((row) => row.slice());
  return {
    rows,
    appendRow(row) {
      rows.push(row.slice());
    },
    getLastRow() {
      return rows.length;
    },
    getRange(row, col, numRows, numCols) {
      return {
        getValues() {
          const values = [];
          for (let r = 0; r < numRows; r += 1) {
            const sourceRow = rows[row - 1 + r] || [];
            const valueRow = [];
            for (let c = 0; c < numCols; c += 1) {
              valueRow.push(sourceRow[col - 1 + c]);
            }
            values.push(valueRow);
          }
          return values;
        },
        setValue(value) {
          if (!rows[row - 1]) rows[row - 1] = [];
          rows[row - 1][col - 1] = value;
        }
      };
    }
  };
}

function createSandbox() {
  const registrations = makeSheet([
    ['timestamp', 'family_name', 'first_name', 'last_name', 'email', 'phone', 'num_adults', 'num_children', 'num_under5', 'dietary_notes', 'payment_method', 'total_due', 'amount_paid', 'payment_status', 'confirmation_sent', 'notes'],
    ['2026-05-19T15:54:02.435Z', 'Touchstone', 'Joseph', 'Touchstone', 'jjptouche@gmail.com', '2488775750', 3, 0, 0, '', 'Venmo', 1059, '', '', '', ''],
    ['2026-05-24T21:41:37.078Z', '[duplicate removed]', '', '', '', '', 0, 0, 0, '', '', 0, '', 'REMOVED', '', 'Duplicate registration removed'],
    ['2026-05-31T02:04:42.002Z', 'Touchstone', 'Tyrone', 'Touchstone', 'walterirenet@gmail.com', '7347657013', 3, 0, 0, '', 'Venmo', 1059, '', '', '', ''],
    ['2026-05-31T03:00:00.000Z', 'Touchstone', 'Tyrone', 'Touchstone', 'walterirenet@gmail.com', '7347657013', 3, 0, 0, '', 'Venmo', 1059, '', '', '', '']
  ]);
  const statusUpdates = makeSheet([
    ['timestamp', 'update_id', 'subject', 'message', 'attached_doc_url', 'attached_doc_id', 'sent_to_count', 'status']
  ]);
  const mailCalls = [];
  const openIds = [];
  const sheets = {
    'Registrations': registrations,
    'Status Updates': statusUpdates
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
        openIds.push(id);
        return {
          id,
          getSheetByName(name) {
            return sheets[name] || null;
          },
          insertSheet(name) {
            const sheet = makeSheet([]);
            sheets[name] = sheet;
            return sheet;
          }
        };
      }
    },
    MailApp: {
      sendEmail(options) {
        mailCalls.push(options);
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
  return { sandbox, mailCalls, openIds, statusUpdates };
}

function parseResponse(response) {
  return JSON.parse(response.text);
}

test('status update group email targets unique active registration emails and uses coordinator copy', () => {
  const { sandbox, mailCalls, openIds, statusUpdates } = createSandbox();

  const response = parseResponse(sandbox.handleStatusUpdateCreate({
    subject: 'Hotel reminder',
    message: 'Please book your room.',
    attached_doc_url: '',
    attached_doc_id: '',
    email_group: true
  }));

  assert.equal(response.status, 'success');
  assert.equal(response.sent_to_count, 2);
  assert.deepEqual(openIds, ['1krj2XFd-YXpwFubbNdLS3N0Bi-ZEhm9J3-PliMjPr1M']);
  assert.equal(mailCalls.length, 1);
  assert.equal(mailCalls[0].to, 'rowellfamilyreunion2026@gmail.com');
  assert.equal(mailCalls[0].replyTo, 'rowellfamilyreunion2026@gmail.com');
  assert.equal(mailCalls[0].subject, 'Rowell Reunion 2026 — Hotel reminder');
  assert.equal(mailCalls[0].bcc, 'jjptouche@gmail.com,walterirenet@gmail.com');
  assert.match(mailCalls[0].body, /Reunion Coordinator: Lorenzo Slay <rowellfamilyreunion2026@gmail.com>/);
  assert.equal(statusUpdates.rows.length, 2);
  assert.equal(statusUpdates.rows[1][6], 2);
});


test('admin updates page tells operators the broadcast sends from the reunion Gmail account', () => {
  const adminHtml = fs.readFileSync(new URL('../admin-updates.html', import.meta.url), 'utf8');
  assert.match(adminHtml, /rowellfamilyreunion2026@gmail\.com/);
  assert.match(adminHtml, /sends from the reunion email account/i);
});
