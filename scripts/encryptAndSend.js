const http = require('http');
const CryptoJS = require('crypto-js');

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

function generateKey(a,b){
  const SECRET_KEY = 'lynq-chat-secret-key-2024-secure';
  const combined = [a,b].sort().join('-');
  return CryptoJS.SHA256(combined + SECRET_KEY).toString();
}

function encryptMessage(plain, sender, receiver){
  const key = generateKey(sender, receiver);
  const encrypted = CryptoJS.AES.encrypt(plain, key).toString();
  return encrypted;
}

(async ()=>{
  try{
    // ensure receiver exists
    await request('/api/auth/register','POST',{ username: 'person1@example.com', password: 'P1pass', displayName: 'Person One' });
    // login as test-debug
    let out = await request('/api/auth/login','POST',{ username: 'test-debug', password: 'Pass123!' });
    const j = JSON.parse(out.body);
    const token = j?.data?.token;
    if (!token) { console.error('No token'); return; }

    const plain = 'Top secret message';
    const encryptedText = encryptMessage(plain, 'test-debug', 'person1@example.com');

    console.log('Sending encrypted message, encryptedText length:', encryptedText.length);

    out = await request('/api/messages','POST',{ receiverId: 'person1@example.com', encryptedText, isEncrypted: true }, { Authorization: `Bearer ${token}` });
    console.log('Status', out.status);
    console.log(out.body);
  }catch(err){ console.error('ERR',err.message||err); process.exit(1); }
})();
