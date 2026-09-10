const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ subject, html, to }) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"MI Groups Website" <${process.env.SMTP_USER}>`,
      to: to || process.env.NOTIFY_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    // Never let an email failure break the order-submission flow
    console.error('Email notification failed:', err.message);
  }
}

module.exports = sendEmail;
