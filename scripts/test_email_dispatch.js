const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

async function testDispatch() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER || 'info@tgstechinfo.com';
  console.log('----------------------------------------------------');
  console.log(`[Email Dispatch Diagnostic Test]`);
  console.log(`Target Recipient : ${targetEmail}`);
  console.log(`SMTP_HOST        : ${process.env.SMTP_HOST || '(EMPTY)'}`);
  console.log(`SMTP_PORT        : ${process.env.SMTP_PORT || '465'}`);
  console.log(`SMTP_SECURE      : ${process.env.SMTP_SECURE || 'true'}`);
  console.log(`SMTP_USER        : ${process.env.SMTP_USER || 'info@tgstechinfo.com'}`);
  console.log(`SMTP_PASS        : ${process.env.SMTP_PASS ? '******** (configured)' : '(EMPTY - Missing password!)'}`);
  console.log(`SMTP_FROM        : ${process.env.SMTP_FROM || '"Taraj Global Solutions" <info@tgstechinfo.com>'}`);
  console.log('----------------------------------------------------');

  const isPlaceholder = !process.env.SMTP_PASS || 
    process.env.SMTP_PASS === 'your_email_password_here' || 
    process.env.SMTP_PASS === 'YourEmailPasswordHere' ||
    process.env.SMTP_PASS.includes('BenchmarkPasswordOrTokenHere');

  if (!process.env.SMTP_HOST || isPlaceholder) {
    console.log('ℹ️  INFO: SMTP credentials are currently kept as a placeholder in .env.local.');
    process.exit(0);
  }

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log(`Sending live test email to ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Taraj Global Solutions" <info@tgstechinfo.com>',
      to: targetEmail,
      replyTo: process.env.SMTP_USER || 'info@tgstechinfo.com',
      subject: '✅ Taraj Global Solutions - Email System Verification Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">🎉 Email Service Verified Successfully</h2>
          <p>Hello,</p>
          <p>This is a confirmation test email dispatched from <strong>Human RMS (Taraj Global Solutions)</strong>.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-weight: bold; color: #047857;">Connection Status: OPERATIONAL</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #64748b;">All candidate registration notifications, interview test links, offer letters, and HR alerts are now fully operational.</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: 'Human RMS Email Service Verified Successfully. All candidate emails and HR alerts are now fully operational.',
    });

    console.log('✅ Email sent successfully! MessageId:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to dispatch email:', err.message);
    process.exit(1);
  }
}

testDispatch();
