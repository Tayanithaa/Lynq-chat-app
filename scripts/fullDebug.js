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
    console.log('\n1) Debug check for existing user (tayanithaans2196@gmail.com)');
    let out = await request('/api/debug/user/tayanithaans2196@gmail.com');
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\n2) Register test-debug user (Pass123!)');
    out = await request('/api/auth/register','POST',{ username: 'test-debug', password: 'Pass123!', displayName: 'Test Debug' });
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\n3) Login test-debug');
    out = await request('/api/auth/login','POST',{ username: 'test-debug', password: 'Pass123!' });
    console.log('Status', out.status);
    console.log(out.body);

    let token = null;
    try {
      const j = JSON.parse(out.body);
      token = j?.data?.token;
    } catch(e){}

    if (!token) {
      console.error('Login did not return token; aborting protected message test.');
      return;
    }

    console.log('\n4) Send protected message as test-debug to "person1@example.com"');
    out = await request('/api/messages','POST',{ receiverId: 'person1@example.com', text: 'Hello from test-debug' }, { Authorization: `Bearer ${token}` });
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\n5) Health endpoint');
    out = await request('/health');
    console.log('Status', out.status);
    console.log(out.body);

    console.log('\nFull debug script completed');
  }catch(err){
    console.error('ERR', err.message || err);
    process.exit(1);
  }
})();
