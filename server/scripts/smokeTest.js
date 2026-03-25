const fetch = require('node-fetch');

const BASE = process.env.BASE || 'http://127.0.0.1:4000';

async function parseJsonResponse(res, context) {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    console.error(
      `[smoke:${context}] Expected JSON from API, got non-JSON (first 160 chars):`,
      text.slice(0, 160)
    );
    console.error(
      'Hint: point BASE at UtopiaHire API, e.g.  cd server && BASE=http://127.0.0.1:4011 npm run smoke'
    );
    throw new Error(`${context}: invalid JSON (wrong BASE or server not running?)`);
  }
}

async function signup(email = `test${Date.now()}@example.com`, password = 'secretpass') {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Smoke Tester' }),
  });
  return parseJsonResponse(res, 'signup');
}

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonResponse(res, 'login');
}

async function createResume(
  token,
  title = 'Smoke Resume',
  text = 'Experience: built stuff'
) {
  const res = await fetch(`${BASE}/resumes/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, text }),
  });
  return parseJsonResponse(res, 'createResume');
}

async function processVersion(token, versionId) {
  const res = await fetch(`${BASE}/resumes/versions/${versionId}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  return parseJsonResponse(res, 'processVersion');
}

(async function () {
  try {
    console.log('Starting smoke test against', BASE);
    const email = `smoke${Date.now()}@example.com`;
    const pw = 'secretpass';
    const su = await signup(email, pw);
    console.log('signup:', su);
    const li = await login(email, pw);
    console.log('login:', li?.token ? 'OK' : li);
    const token = li?.token;
    if (!token) {
      console.error('no token, abort');
      process.exit(2);
    }
    const created = await createResume(
      token,
      'Smoke Resume',
      'This is a short resume body for a smoke test.'
    );
    console.log('created resume:', created);
    const versionId = created?.versionId;
    if (!versionId) {
      console.error('no version returned');
      process.exit(3);
    }
    const proc = await processVersion(token, versionId);
    console.log('process result:', proc);
    console.log('Smoke test finished');
  } catch (e) {
    console.error('smoke test failed', e);
    process.exit(1);
  }
})();
