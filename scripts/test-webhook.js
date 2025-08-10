const https = require('https');

// Replace with your actual Netlify site URL
const WEBHOOK_URL = 'https://your-site-name.netlify.app/.netlify/functions/whatsapp-webhook';

// Test webhook verification (GET request)
function testWebhookVerification() {
  const verifyToken = 'your_custom_verify_token_here'; // Replace with your actual verify token
  const testUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge`;
  
  https.get(testUrl, (res) => {
    console.log('Webhook verification test:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      if (res.statusCode === 200) {
        console.log('✅ Webhook verification successful!');
      } else {
        console.log('❌ Webhook verification failed');
      }
    });
  }).on('error', (err) => {
    console.error('Error testing webhook:', err.message);
  });
}

// Test webhook endpoint accessibility
function testWebhookAccessibility() {
  const testUrl = WEBHOOK_URL;
  
  https.get(testUrl, (res) => {
    console.log('\nWebhook accessibility test:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    if (res.statusCode === 405) {
      console.log('✅ Webhook endpoint is accessible (405 Method Not Allowed is expected for GET without verification)');
    } else if (res.statusCode === 200) {
      console.log('✅ Webhook endpoint is accessible');
    } else {
      console.log('❌ Webhook endpoint may not be accessible');
    }
  }).on('error', (err) => {
    console.error('Error testing webhook accessibility:', err.message);
  });
}

console.log('Testing WhatsApp Webhook Connection...\n');
console.log('Make sure to:');
console.log('1. Replace "your-site-name" in WEBHOOK_URL with your actual Netlify site name');
console.log('2. Replace "your_custom_verify_token_here" with your actual verify token');
console.log('3. Set up environment variables in Netlify dashboard\n');

testWebhookAccessibility();
testWebhookVerification(); 