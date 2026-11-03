const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found at:', envPath);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

console.log('========================================');
console.log('   SMTP CONNECTION & CREDENTIALS CHECK  ');
console.log('========================================');
console.log('SMTP Host :', env.SMTP_HOST || '(not set)');
console.log('SMTP Port :', env.SMTP_PORT || '465');
console.log('SMTP User :', env.SMTP_USER || '(not set)');
console.log('SMTP Pass :', env.SMTP_PASS ? '*'.repeat(Math.min(env.SMTP_PASS.length, 12)) + ` (${env.SMTP_PASS.length} chars)` : '(empty)');
console.log('----------------------------------------');

const isPlaceholder = !env.SMTP_PASS || 
  env.SMTP_PASS.includes('YourRealHostingerPasswordHere') || 
  env.SMTP_PASS.includes('YourBenchmarkPasswordOrTokenHere') || 
  env.SMTP_PASS.toLowerCase().includes('placeholder') ||
  env.SMTP_PASS.toLowerCase().includes('passwordhere');

if (isPlaceholder) {
  console.log('⚠️  Notice: SMTP_PASS is currently set to placeholder text:');
  console.log(`   "${env.SMTP_PASS}"`);
  console.log('👉 Please replace it with your actual Benchmark Email password or API key in .env.local.');
  process.exit(1);
}

const isSecure = env.SMTP_PORT === '465' || env.SMTP_SECURE === 'true';
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587', 10),
  secure: isSecure,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

console.log(`Testing connection to ${env.SMTP_HOST}:${env.SMTP_PORT || '587'}...`);

transporter.verify((err, success) => {
  if (err) {
    console.error('\n❌ SMTP LOGIN FAILED!');
    console.error('Reason:', err.message);
    if (err.message.includes('535') || err.message.toLowerCase().includes('authentication')) {
      console.log('\n💡 What to do:');
      console.log('1. Log in to your Benchmark Email account (https://ui.benchmarkemail.com).');
      console.log(`2. Verify that your SMTP account / username is: ${env.SMTP_USER}`);
      console.log('3. Copy your valid Benchmark SMTP password / token and set it in .env.local:');
      console.log('   SMTP_PASS=your_actual_benchmark_password');
    }
    process.exit(1);
  } else {
    console.log('\n✅ SUCCESS! SMTP credentials are valid and connection is established.');
    console.log('🎉 Your application can now deliver emails to candidates and HR successfully!');
    process.exit(0);
  }
});
