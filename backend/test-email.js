// Import the email engine we built earlier
const sendEmail = require("./utils/sendEmail");

// The mailing list you provided
const mailingList = [
  "smkmayomi@gmail.com",
  "idarajoy199@gmail.com",
  "hssamuel2024@gmail.com",
];

async function runBroadcast() {
  console.log("🚀 Starting Mass Email Broadcast...\n");

  // The beautifully styled HTML message
  const broadcastMessage = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #9333EA; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">📢 EduSync System Update</h2>
      </div>
      <div style="padding: 30px; background-color: #f9fafb;">
        <h3 style="color: #1e3a8a;">Hello EduSync User,</h3>
        <p>This is an official test of the EduSync Mass Broadcast System!</p>
        <p>If you are reading this, the Nodemailer integration is working perfectly. The administration can now successfully send instant updates, newsletters, and alerts directly to Parents, Teachers, and Students.</p>
        
        <div style="background-color: #e0f2fe; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
          <p style="margin: 0; color: #0369a1;"><strong>System Status:</strong> 🟢 Online and Fully Operational</p>
        </div>

        <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
      </div>
    </div>
  `;

  // Loop through the mailing list and send the email to each person
  for (const email of mailingList) {
    console.log(`⏳ Preparing to send to ${email}...`);

    await sendEmail({
      to: email,
      subject: "📢 EduSync System Broadcast Test",
      html: broadcastMessage,
    });
  }

  console.log("\n🎉 Broadcast complete! All emails have been dispatched.");
}

// Execute the function
runBroadcast();
