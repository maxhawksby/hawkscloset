(function () {
  'use strict';
  var form = document.getElementById('smsForm');
  if (!form) return;
  var phoneInput = document.getElementById('smsPhone');
  var consentInput = document.getElementById('smsConsent');
  var button = document.getElementById('smsSubmit');
  var message = document.getElementById('smsMsg');

  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'sms-msg ' + type;
    message.style.display = 'block';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (button.disabled) return;
    var phone = phoneInput.value.trim();
    var digits = phone.replace(/\D/g, '');
    if (!phone || /[^\d+().\s-]/.test(phone)) {
      showMessage('Please enter a valid phone number.', 'error');
      phoneInput.focus();
      return;
    }
    if (digits.length === 10 && !phone.startsWith('+')) digits = '1' + digits;
    if (!/^[1-9]\d{7,14}$/.test(digits) || (!phone.startsWith('+') && !(digits.length === 11 && digits.startsWith('1')))) {
      showMessage('Enter a 10-digit US number, or include + and your country code.', 'error');
      phoneInput.focus();
      return;
    }
    if (!consentInput.checked) {
      showMessage('Please agree to receive texts to continue.', 'error');
      consentInput.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    showMessage('', '');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(form.dataset.publicKey), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'revision': '2024-10-15' },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: form.dataset.source || 'Lock Screen',
              profile: { data: { type: 'profile', attributes: { phone_number: '+' + digits } } }
            },
            relationships: { list: { data: { type: 'list', id: form.dataset.listId } } }
          }
        })
      });
      if (!response.ok) throw new Error('request-failed');
      showMessage('Request received. If you receive a confirmation text, follow its instructions to finish signing up.', 'success');
      phoneInput.disabled = true;
      consentInput.disabled = true;
      button.textContent = 'Request received';
    } catch (error) {
      showMessage(error.name === 'AbortError' ? 'That took too long. Please try again.' : 'We couldn’t save your request. Please try again.', 'error');
      button.disabled = false;
      button.textContent = 'Notify me →';
    } finally {
      clearTimeout(timeout);
    }
  });
})();
