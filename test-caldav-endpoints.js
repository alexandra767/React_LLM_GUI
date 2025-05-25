const https = require('https');

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('Usage: node test-caldav-endpoints.js <username> <password>');
  process.exit(1);
}

// Different CalDAV endpoints to try
const endpoints = [
  { name: 'Standard CalDAV', url: 'https://caldav.icloud.com:443/' },
  { name: 'Principal Discovery', url: 'https://caldav.icloud.com:443/principals/' },
  { name: 'Well-known', url: 'https://caldav.icloud.com:443/.well-known/caldav' },
  { name: 'Direct Calendar', url: `https://caldav.icloud.com:443/${username}/calendars/` }
];

const auth = Buffer.from(`${username}:${password}`).toString('base64');

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.url);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '0',
        'User-Agent': 'macOS/12.0 CalendarAgent/1.0'
      }
    };

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`;

    console.log(`\nTesting ${endpoint.name}...`);
    console.log(`URL: ${endpoint.url}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        if (res.statusCode < 400) {
          console.log('✅ Success!');
          console.log('Response preview:', data.substring(0, 200));
        } else {
          console.log('❌ Failed');
          if (res.statusCode === 403) {
            console.log('Forbidden - Apple is blocking access');
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      resolve();
    });

    req.write(body);
    req.end();
  });
}

async function testAll() {
  console.log('Testing Apple CalDAV endpoints...');
  console.log('Username:', username);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(r => setTimeout(r, 1000)); // Wait between requests
  }
  
  console.log('\n\nNote: If all endpoints return 403, Apple has restricted CalDAV for your account.');
  console.log('Consider using the native Calendar.app integration instead.');
}

testAll();