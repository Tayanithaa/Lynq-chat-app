const http = require('http');
const url = 'http://localhost:3004/api/debug/user/tayanithaans2196@gmail.com';
http.get(url, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try { console.log(body); } catch (e) { console.error('PARSE_ERR', e.message); }
  });
}).on('error', err => {
  console.error('ERR', err);
  process.exit(1);
});
