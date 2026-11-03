const fs = require('fs');
const path = require('path');
const readline = require('readline');
const nodemailer = require('nodemailer');

const envPath = path.resolve(__dirname, '../.env.local');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('======================================================');
console.log('   Taraj Global Solutions - SMTP Password Setup');
console.log('   Account: hr@tarajglobal.com (smtp.hostinger.com:465)');
console.log('======================================================\n');

rl.question('Enter the password for hr@tarajglobal.com: ', async (enteredPassword) => {
  const password = enteredPassword.trim();
  if (!password) {
    console.log('❌ Password cannot be empty.');
    rl.close();
    process.exit(1);
  }

  console.log('\nTesting connection to smtp.hostinger.com...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'hr@tarajglobal.com',
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ Authentication SUCCESSFUL! Password is valid.\n');

    // Update .env.local
    let content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('SMTP_PASS=')) {
      content = content.replace(/SMTP_PASS=.*/, `SMTP_PASS=${password}`);
    } else {
      content += `\nSMTP_PASS=${password}`;
    }
    fs.writeFileSync(envPath, content, 'utf8');

    // Update .env as well
    const defaultEnvPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(defaultEnvPath)) {
      let dContent = fs.readFileSync(defaultEnvPath, 'utf8');
      if (dContent.includes('SMTP_PASS=')) {
        dContent = dContent.replace(/SMTP_PASS=.*/, `SMTP_PASS=${password}`);
      } else {
        dContent += `\nSMTP_PASS=${password}`;
      }
      fs.writeFileSync(defaultEnvPath, dContent, 'utf8');
    }
    console.log('✅ Updated .env.local and .env with valid SMTP password.\n');

    console.log('Sending test confirmation email to rutikarathod7478@gmail.com...');
    const info = await transporter.sendMail({
      from: '"Taraj Global Solutions HR" <hr@tarajglobal.com>',
      to: 'rutikarathod7478@gmail.com',
      replyTo: 'hr@tarajglobal.com',
      subject: 'Thank you for registering with Taraj Global Solutions',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e3a8a;">Taraj Global Solutions</h2>
          <p>Dear Candidate,</p>
          <p>Thank you for registering with <strong>Taraj Global Solutions</strong>.</p>
          <p>We have successfully received your registration details. Our HR team will review your information and contact you regarding the next steps in the recruitment process.</p>
          <p>Please check your registered email regularly for further updates.</p>
          <p>For any queries, please contact our HR team at <a href="mailto:hr@tarajglobal.com">hr@tarajglobal.com</a>.</p>
          <p style="margin-top: 24px;">Best regards,<br><strong>HR Team</strong><br>Taraj Global Solutions<br>Email: hr@tarajglobal.com</p>
        </div>
      `,
      text: `Dear Candidate,\n\nThank you for registering with Taraj Global Solutions.\nWe have successfully received your registration details. Our HR team will review your information and contact you regarding the next steps in the recruitment process.\nPlease check your registered email regularly for further updates.\nFor any queries, please contact our HR team at hr@tarajglobal.com.\n\nBest regards,\nHR Team\nTaraj Global Solutions\nEmail: hr@tarajglobal.com`,
    });

    console.log('🎉 Email dispatched successfully to rutikarathod7478@gmail.com! MessageId:', info.messageId);
    console.log('\nAll done! Candidate registrations will now automatically deliver real emails.');
  } catch (err) {
    console.error('❌ Authentication failed with Hostinger SMTP:');
    console.error(err.message);
    console.log('\nPlease check the password for hr@tarajglobal.com in your Hostinger Webmail / Email panel and try again.');
  } finally {
    rl.close();
  }
});
