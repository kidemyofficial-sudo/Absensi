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

async function getLiveRenderError() {
  const BASE = 'https://absensi-git-main-kidemy.vercel.app';
  
  // Wait 35 seconds to let Vercel finish building the new error.tsx
  console.log('Waiting 35 seconds for Vercel build to complete...');
  await new Promise(resolve => setTimeout(resolve, 35000));

  const randomPhone = '08' + Math.floor(1000000000 + Math.random() * 9000000000);
  console.log(`1. Registering new Guru user: ${randomPhone}...`);
  
  const reg = await requestHttps('POST', `${BASE}/api/auth/register`, {
    name: 'Vercel Diagnostic Guru',
    phone: randomPhone,
    password: 'Password123!',
    role: 'GURU'
  });

  const token = getCookieToken(reg.headers);
  if (!token) {
    console.error('Failed to register on Vercel.');
    return;
  }
  console.log('Registered. Token acquired.');

  console.log('2. Requesting GET /dashboard with token to capture Server Error...');
  const dash = await requestHttps('GET', `${BASE}/dashboard`, null, {
    Cookie: `token=${token}`
  });

  console.log('Dashboard status code:', dash.statusCode);

  // Search for the Error Boundary content in the HTML
  if (dash.body.includes('Dashboard gagal dimuat')) {
    console.log('\n🚨 ERROR BOUNDARY RENDERED SUCCESSFULLY!');
    
    // Attempt to extract the error message
    const msgMatch = dash.body.match(/Dashboard gagal dimuat<\/h2><p[^>]*>([^<]+)<\/p>(?:<p[^>]*>([^<]+)<\/p>)?(?:<p[^>]*>([^<]+)<\/p>)?/);
    if (msgMatch) {
      console.log('Extracted messages:', msgMatch.slice(1).filter(Boolean));
    } else {
      console.log('HTML contains boundary but message extraction regex failed. Here is a snippet:');
      const index = dash.body.indexOf('Dashboard gagal dimuat');
      console.log(dash.body.slice(index - 200, index + 800));
    }
  } else {
    console.log('\n❌ Error boundary not found in response HTML. Here is a snippet of the head:');
    console.log(dash.body.slice(0, 1500));
  }
}

getLiveRenderError().catch(console.error);
