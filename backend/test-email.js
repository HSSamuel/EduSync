const sendEmail = require('./utils/sendEmail');

async function main() {
  const to = process.argv[2] || process.env.TEST_EMAIL_TO || process.env.EMAIL_USER;

  if (!to) {
    console.error('Missing recipient. Pass an email as an argument or set TEST_EMAIL_TO.');
    process.exit(1);
  }

  try {
    const info = await sendEmail({
      to,
      subject: 'EduSync SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>EduSync SMTP Test</h2>
          <p>This confirms your SMTP configuration is working.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('Test email sent successfully.');
    console.log('Message ID:', info.messageId);
    if (info.accepted) console.log('Accepted:', info.accepted.join(', '));
    if (info.rejected?.length) console.log('Rejected:', info.rejected.join(', '));
  } catch (error) {
    console.error('SMTP test failed:', error?.message || error);
    process.exit(1);
  }
}

main();
