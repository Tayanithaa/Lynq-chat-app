const http = require('http');

function request(path, method='GET', body=null, headers={}){
  return new Promise((resolve,reject)=>{
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3004,
      path,
      method,
      headers: Object.assign({}, headers)
    };
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, res => {
      let raw='';
      res.on('data', c=> raw+=c);
      res.on('end', ()=>{
        resolve({ status: res.statusCode, body: raw });
      });
    });
    req.on('error', err => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

(async ()=>{
  try{
    console.log('\n--- Debug user: tayanithaans2196@gmail.com');
    let out = await request('/api/debug/user/tayanithaans2196@gmail.com');
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\n--- Login test-debug');
    out = await request('/api/auth/login','POST',{ username: 'test-debug', password: 'Pass123!' });
    console.log('Status', out.status);
    console.log(out.body);

    let token = null;
    try { token = JSON.parse(out.body).data.token; } catch(e){ }

    if (token) {
      console.log('\n--- Validate token');
      out = await request('/api/auth/validate','POST',null,{ Authorization: `Bearer ${token}` });
      console.log('Status', out.status);
      console.log(out.body);

      console.log('\n--- Ensure receiver person1@example.com exists (register if missing)');
      out = await request('/api/auth/register','POST',{ username: 'person1@example.com', password: 'P1pass', displayName: 'Person One' });
      console.log('Status', out.status);
      console.log(out.body);

      console.log('\n--- Send protected encrypted message');
      const CryptoJS = require('crypto-js');
      const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';
      const key = CryptoJS.SHA256(['test-debug','person1@example.com'].sort().join('-') + SECRET_KEY).toString();
      const encrypted = CryptoJS.AES.encrypt('Ping from runChecks', key).toString();

      out = await request('/api/messages','POST',{ receiverId: 'person1@example.com', encryptedText: encrypted, isEncrypted: true }, { Authorization: `Bearer ${token}` });
      console.log('Status', out.status);
      console.log(out.body);
    } else {
      console.error('No token returned from login; cannot validate or send protected message');
    }

    console.log('\n--- Health');
    out = await request('/health');
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\nChecks complete');
  }catch(err){
    console.error('ERR', err.message || err);
    process.exit(1);
  }
})();
