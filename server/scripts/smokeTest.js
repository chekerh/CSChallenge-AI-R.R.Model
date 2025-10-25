const fetch = require('node-fetch');

const BASE = process.env.BASE || 'http://127.0.0.1:4000';

async function signup(email = `test${Date.now()}@local`, password = 'secret'){
  const res = await fetch(`${BASE}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name: 'Smoke Tester' }) });
  return res.json();
}

async function login(email, password){
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return res.json();
}

async function createResume(token, title = 'Smoke Resume', text = 'Experience: built stuff'){
  const res = await fetch(`${BASE}/resumes/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, text }) });
  return res.json();
}

async function processVersion(token, versionId){
  const res = await fetch(`${BASE}/resumes/versions/${versionId}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({}) });
  return res.json();
}

(async function(){
  try{
    console.log('Starting smoke test against', BASE);
    const email = `smoke${Date.now()}@local`;
    const pw = 'secret';
    const su = await signup(email, pw);
    console.log('signup:', su);
    const li = await login(email, pw);
    console.log('login:', li?.token ? 'OK' : li);
    const token = li?.token;
    if(!token){ console.error('no token, abort'); process.exit(2); }
    const created = await createResume(token, 'Smoke Resume', 'This is a short resume body for a smoke test.');
    console.log('created resume:', created);
    const versionId = created?.versionId;
    if(!versionId){ console.error('no version returned'); process.exit(3); }
    const proc = await processVersion(token, versionId);
    console.log('process result:', proc);
    console.log('Smoke test finished');
  }catch(e){
    console.error('smoke test failed', e);
    process.exit(1);
  }
})();
