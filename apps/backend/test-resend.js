const https = require('https');

async function testResend() {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  // Replace this with the EXACT email address you used to sign up for Resend
  const testEmail = 'infraops@easyapps360.com';

  const data = JSON.stringify({
    from: 'InfraOps 360 <onboarding@resend.dev>',
    to: [testEmail],
    subject: 'Your InfraOps 360 Verification Code',
    html: '<p>Test OTP: 123456</p>'
  });

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log("Sending email test...");

  const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      try {
        const parsed = JSON.parse(responseBody);
        console.log('Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Response:', responseBody);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error);
  });

  req.write(data);
  req.end();
}

testResend();
