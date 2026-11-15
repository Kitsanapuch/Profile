(() => {
  'use strict';
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#form-status');
  const button = form?.querySelector('button[type="submit"]');
  if (!form || !status || !button) return;

  const thai = document.documentElement.lang === 'th';
  const copy = thai ? {
    sending: 'กำลังส่งข้อความ…',
    sent: 'ส่งข้อความเรียบร้อยแล้ว ขอบคุณที่ติดต่อครับ',
    failed: 'ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้งหรือใช้อีเมลด้านซ้าย',
  } : {
    sending: 'Sending your message…',
    sent: 'Thanks — your message has been sent.',
    failed: 'The message could not be sent. Please try again or use the email link on the left.',
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    button.disabled = true;
    status.textContent = copy.sending;
    status.dataset.state = 'pending';
    try {
      const payload = Object.fromEntries(new FormData(form));
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Delivery failed');
      form.reset();
      status.textContent = copy.sent;
      status.dataset.state = 'success';
    } catch {
      status.textContent = copy.failed;
      status.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  });
})();
