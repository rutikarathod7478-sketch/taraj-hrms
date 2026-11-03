const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
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

async function run() {
  const baseUrl = env.BENCHMARK_API_BASE_URL || 'https://clientapi.benchmarkemail.com';
  const apiKey = env.BENCHMARK_API_KEY;

  console.log('====================================================');
  console.log('   BENCHMARK EMAIL API & CREDENTIALS VERIFICATION   ');
  console.log('====================================================');
  console.log('Base URL : ', baseUrl);
  console.log('API Key  : ', apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)` : '(not set)');
  console.log('----------------------------------------------------');

  if (!apiKey) {
    console.error('❌ BENCHMARK_API_KEY is missing in .env.local');
    process.exit(1);
  }

  // 1. Check account / confirmed emails
  try {
    console.log('Testing endpoint: /Client/ConfirmedEmail/All ...');
    const res = await fetch(`${baseUrl}/Client/ConfirmedEmail/All`, {
      method: 'GET',
      headers: {
        'AuthToken': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status Code : ${res.status} ${res.statusText}`);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error Response:', data);
    }
  } catch (err) {
    console.error('Network Error:', err.message);
  }

  // 2. Also test Contact endpoint
  try {
    console.log('\nTesting endpoint: /Contact/ ...');
    const res = await fetch(`${baseUrl}/Contact/`, {
      method: 'GET',
      headers: {
        'AuthToken': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status Code : ${res.status} ${res.statusText}`);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      console.log('✅ Contact Lists Response:', Array.isArray(data) ? `Found ${data.length} list(s)` : data);
    } else {
      console.log('❌ Contact Error Response:', data);
    }
  } catch (err) {
    console.error('Network Error:', err.message);
  }

  // 3. Test Emails endpoint
  try {
    console.log('\nTesting endpoint: /Emails/ ...');
    const res = await fetch(`${baseUrl}/Emails/`, {
      method: 'GET',
      headers: {
        'AuthToken': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status Code : ${res.status} ${res.statusText}`);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      console.log('✅ Emails Response:', JSON.stringify(data, null, 2).slice(0, 500));
    } else {
      console.log('❌ Emails Error Response:', data);
    }
  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

run();
