import http from 'http';

const data = JSON.stringify({
  vocabList: [],
  grammarList: [],
  apiKey: 'test'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/quiz',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', console.error);
req.write(data);
req.end();
