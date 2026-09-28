(function () {
  'use strict';

  function remainingUntil(value, now) {
    if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
    var target = Date.parse(value);
    if (!Number.isFinite(target)) return null;
    var seconds = Math.max(0, Math.ceil((target - now) / 1000));
    return {
      expired: seconds === 0,
      days: Math.floor(seconds / 86400),
      hours: Math.floor(seconds / 3600) % 24,
      minutes: Math.floor(seconds / 60) % 60,
      seconds: seconds % 60
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { remainingUntil: remainingUntil };
  if (typeof document === 'undefined') return;

  document.querySelectorAll('[data-drop-countdown]').forEach(function (clock) {
    var target = clock.dataset.dropAt;
    var status = clock.querySelector('[data-drop-status]');
    var date = clock.querySelector('[data-drop-date]');
    var interval;
    var state;

    function tick() {
      var remaining = remainingUntil(target, Date.now());
      var nextState = !remaining ? 'unscheduled' : remaining.expired ? 'elapsed' : 'counting';
      clock.dataset.state = nextState;
      ['days', 'hours', 'minutes', 'seconds'].forEach(function (unit) {
        var node = clock.querySelector('[data-unit="' + unit + '"]');
        if (node) node.textContent = remaining ? String(remaining[unit]).padStart(2, '0') : '--';
      });
      if (nextState !== state) {
        if (status) status.textContent = nextState === 'counting' ? 'Drop goes live in' : nextState === 'elapsed' ? 'Watch this space for drop updates.' : 'Next drop date to be announced.';
        state = nextState;
      }
      if (nextState !== 'counting' && interval) clearInterval(interval);
    }

    if (date && remainingUntil(target, Date.now())) {
      date.dateTime = target;
      date.textContent = new Intl.DateTimeFormat('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: clock.dataset.timeZone || 'America/New_York', timeZoneName: 'short'
      }).format(new Date(target));
      date.hidden = false;
    } else if (date) {
      date.hidden = true;
    }
    tick();
    if (state === 'counting') interval = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tick();
    });
  });
})();
