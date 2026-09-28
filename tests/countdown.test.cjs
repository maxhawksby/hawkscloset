const { test } = require('node:test');
const assert = require('node:assert/strict');
const { remainingUntil } = require('../hawks-closet-theme/assets/drop-countdown.js');

test('September drop is noon New York, 16:00 UTC', () => {
  assert.deepEqual(remainingUntil('2026-09-26T12:00:00-04:00', Date.parse('2026-09-25T15:59:59Z')), {
    expired: false, days: 1, hours: 0, minutes: 0, seconds: 1
  });
});
test('last partial second remains visible until the actual deadline', () => {
  assert.equal(remainingUntil('2026-09-26T12:00:00-04:00', Date.parse('2026-09-26T15:59:59.900Z')).seconds, 1);
});
test('at and after deadline, no negative numbers', () => {
  for (const now of ['2026-09-26T16:00:00Z', '2026-10-01T00:00:00Z']) {
    assert.deepEqual(remainingUntil('2026-09-26T12:00:00-04:00', Date.parse(now)), {
      expired: true, days: 0, hours: 0, minutes: 0, seconds: 0
    });
  }
});
test('unset, malformed, and ambiguous dates do not start a timer', () => {
  for (const value of ['', undefined, 'not a date', '2026-09-26T12:00:00', '2026-13-26T12:00:00-04:00']) {
    assert.equal(remainingUntil(value, Date.now()), null);
  }
});
