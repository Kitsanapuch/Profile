const DESTINATION = 'kitsanapuch@gmail.com';
const MAX_BODY_BYTES = 8_192;

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function cleanSingleLine(value, maxLength) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length > maxLength || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(text)) return null;
  return text;
}

function validEmail(value) {
  return Boolean(value && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(value));
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return source.origin === target.origin;
  } catch {
    return false;
  }
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      const response = json(405, { error: 'Method not allowed.' });
      response.headers.set('Allow', 'POST');
      return response;
    }

    if (!sameOrigin(request) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return json(403, { error: 'Request not allowed.' });
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return json(415, { error: 'Expected JSON.' });
    }
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json(413, { error: 'Message too large.' });
    }

    let data;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
        return json(413, { error: 'Message too large.' });
      }
      data = JSON.parse(raw);
    } catch {
      return json(400, { error: 'Invalid message.' });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return json(400, { error: 'Invalid message.' });
    }

    // A hidden field catches basic form spam without exposing whether it worked.
    if (data.company) return json(200, { ok: true });

    const name = cleanSingleLine(data.name, 100);
    const email = cleanSingleLine(data.email, 254);
    const subject = cleanSingleLine(data.subject, 140);
    const message = typeof data.message === 'string' ? data.message.trim() : null;
    if (!name || name.length < 2 || !validEmail(email) || !subject || subject.length < 3 ||
        !message || message.length < 15 || message.length > 4_000 ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(message)) {
      return json(400, { error: 'Check the form fields and try again.' });
    }

    // The destination and sender are controlled by the server, never by the visitor.
    const key = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (!key || !from) return json(503, { error: 'Direct messaging is unavailable. Please use the email link.' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const providerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [DESTINATION],
          reply_to: email,
          subject: `[Portfolio] ${subject}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        }),
        signal: controller.signal,
      });
      if (!providerResponse.ok) {
        console.error('Contact delivery failed:', providerResponse.status);
        return json(502, { error: 'The message could not be delivered. Please use the email link.' });
      }
      return json(200, { ok: true });
    } catch (error) {
      console.error('Contact delivery request failed:', error?.name || 'unknown');
      return json(502, { error: 'The message could not be delivered. Please use the email link.' });
    } finally {
      clearTimeout(timeout);
    }
  },
};
