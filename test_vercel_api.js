const https = require('https');

function requestHttps(method, urlStr, body = null) {
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

async function testVercel() {
  const BASE = 'https://absensi-git-main-kidemy.vercel.app';
  
  console.log(`Checking health on Vercel: ${BASE}/api/health...`);
  try {
    const health = await requestHttps('GET', `${BASE}/api/health`);
    console.log('Health status code:', health.statusCode);
    console.log('Health body:', health.body);
  } catch (err) {
    console.error('Health request failed:', err.message);
  }

  console.log(`\nTesting registration on Vercel: ${BASE}/api/auth/register...`);
  try {
    // Attempt registration with invalid password structure to trigger safe zod validation error and check response code
    const reg = await requestHttps('POST', `${BASE}/api/auth/register`, {
      name: 'Vercel Test Parent',
      phone: '089998887771',
      password: '123', // should fail password strength validation
      role: 'ORANG_TUA'
    });
    console.log('Registration status code:', reg.statusCode);
    console.log('Registration body:', reg.body);
  } catch (err) {
    console.error('Registration request failed:', err.message);
  }
}

testVercel().catch(console.error);
