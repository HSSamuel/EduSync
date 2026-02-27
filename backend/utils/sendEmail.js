const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  try {
    // 1. Create the Transporter (The Mail Carrier)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the Email Options
    const mailOptions = {
      from: `"EduSync Portal" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html, // We use HTML so the email looks professional!
    };

    // 3. Send the Email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${options.to}`);
  } catch (error) {
    console.error("❌ Email failed to send:", error);
  }
};

module.exports = sendEmail;
