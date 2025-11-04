// Quick server health check
const http = require('http');

function checkEndpoint(path, label) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${label}:`);
        try {
          const json = JSON.parse(data);
          console.log(JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${label} failed:`, err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏱️ ${label} timed out`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Testing backend server on port 3004...\n');
  
  await checkEndpoint('/health', 'Health Check');
  console.log('');
  await checkEndpoint('/api/users/online', 'Online Users');
  
  console.log('\n✨ Test complete!');
}

main();
