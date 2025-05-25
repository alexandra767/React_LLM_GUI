const https = require('https');

// Get credentials from command line or use test values
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('Usage: node test-apple-calendar-auth.js <username> <password>');
  process.exit(1);
}

// Create auth header
const auth = Buffer.from(`${username}:${password}`).toString('base64');

const options = {
  hostname: 'caldav.icloud.com',
  port: 443,
  path: '/',
  method: 'PROPFIND',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/xml; charset=utf-8',
    'Depth': '0'
  }
};

const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`;

console.log('Testing Apple Calendar authentication...');
console.log('Username:', username);
console.log('Auth header:', `Basic ${auth.substring(0, 20)}...`);

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse:');
    if (res.statusCode === 200 || res.statusCode === 207) {
      console.log('✅ Authentication successful!');
      console.log('Response preview:', data.substring(0, 200) + '...');
    } else if (res.statusCode === 401) {
      console.log('❌ Authentication failed - invalid credentials');
      console.log('Response:', data);
    } else {
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(body);
req.end();