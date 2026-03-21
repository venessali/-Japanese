import https from 'https';

const req = https.request('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', console.error);
req.write(JSON.stringify({
  model: 'deepseek-chat',
  messages: [{role: 'user', content: 'hello'}]
}));
req.end();
