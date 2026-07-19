const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => { reject(err); });

    if (body) { req.write(JSON.stringify(body)); }
    req.end();
  });
}

function getCookieToken(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieArr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieArr) {
    const match = c.match(/token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

async function testRegistrationFlow() {
  console.log('1. Logging in as Owner to reset database...');
  const ownerLogin = await request('POST', '/api/auth/login', {
    phone: '081234567890',
    password: 'admin123456'
  });
  
  const ownerToken = getCookieToken(ownerLogin.headers);
  if (!ownerToken) {
    console.error('Failed to log in as Owner.');
    return;
  }

  console.log('2. Resetting database...');
  const resetRes = await request('GET', '/api/admin/reset', null, {
    Cookie: `token=${ownerToken}`
  });
  console.log('Reset response:', resetRes.body);

  console.log('3. Registering new Orang Tua user...');
  const phone = '089999999999';
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Parent Test',
    phone,
    password: 'Password123!',
    role: 'ORANG_TUA'
  });

  const parentToken = getCookieToken(registerRes.headers);
  if (!parentToken) {
    console.error('Failed to register parent. Response:', registerRes.body);
    return;
  }
  console.log('Parent Registration successful. Token acquired.');

  console.log('4. Requesting GET /dashboard as Orang Tua...');
  const dashRes = await request('GET', '/dashboard', null, {
    Cookie: `token=${parentToken}`
  });

  console.log('Parent Dashboard status:', dashRes.statusCode);
  if (dashRes.statusCode === 500) {
    console.error('💥 CRASH DETECTED on Orang Tua Dashboard!');
    console.log(dashRes.body.slice(0, 1000));
  } else {
    console.log('Orang Tua Dashboard loaded successfully!');
  }

  console.log('\n5. Registering new Guru user...');
  const phoneGuru = '088888888888';
  const registerGuruRes = await request('POST', '/api/auth/register', {
    name: 'Guru Test',
    phone: phoneGuru,
    password: 'Password123!',
    role: 'GURU'
  });

  const guruToken = getCookieToken(registerGuruRes.headers);
  if (!guruToken) {
    console.error('Failed to register guru. Response:', registerGuruRes.body);
    return;
  }
  console.log('Guru Registration successful. Token acquired.');

  console.log('6. Requesting GET /dashboard as Guru...');
  const dashGuruRes = await request('GET', '/dashboard', null, {
    Cookie: `token=${guruToken}`
  });

  console.log('Guru Dashboard status:', dashGuruRes.statusCode);
  if (dashGuruRes.statusCode === 500) {
    console.error('💥 CRASH DETECTED on Guru Dashboard!');
    console.log(dashGuruRes.body.slice(0, 1000));
  } else {
    console.log('Guru Dashboard loaded successfully!');
  }
}

testRegistrationFlow().catch(console.error);
