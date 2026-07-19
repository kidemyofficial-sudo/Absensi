const https = require('https');

function requestHttps(method, urlStr, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
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

async function testDashboardLayoutCrash() {
  const BASE = 'https://absensi-git-main-kidemy.vercel.app';
  const randomPhone = '08' + Math.floor(1000000000 + Math.random() * 9000000000);
  
  console.log(`1. Registering new Guru user: ${randomPhone}...`);
  const reg = await requestHttps('POST', `${BASE}/api/auth/register`, {
    name: 'Vercel Diagnostic Guru',
    phone: randomPhone,
    password: 'Password123!',
    role: 'GURU'
  });

  const token = getCookieToken(reg.headers);
  if (!token) return;

  console.log('2. Requesting GET /settings (should test (dashboard)/layout)...');
  const settingsRes = await requestHttps('GET', `${BASE}/settings`, null, {
    Cookie: `token=${token}`
  });
  console.log('-> GET /settings status code on Vercel:', settingsRes.statusCode);

  console.log('3. Requesting GET /dashboard (should test (dashboard)/dashboard/page)...');
  const dashRes = await requestHttps('GET', `${BASE}/dashboard`, null, {
    Cookie: `token=${token}`
  });
  console.log('-> GET /dashboard status code on Vercel:', dashRes.statusCode);
}

testDashboardLayoutCrash().catch(console.error);
