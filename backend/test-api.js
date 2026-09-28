const http = require('http');

const data = JSON.stringify({ phone: '9876543210' });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error('Error:', error));
req.write(data);
req.end();
