import nodemailer from "nodemailer";

export async function transferCreated(
  name,
  email,
  transferAmount,
  transferCurrency,
  transferId
) {
  // Create reset password URL

  // Create transporter using SMTP configuration from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Transfer Created: ${transferId}`,
    html: `
    <p>Dear ${name},</p>
    <p>A transfer of ${transferAmount} ${transferCurrency} was successfully created in your stripe account.</p>
    <p>Transfer ID: ${transferId}</p>
    <p>We appreciate your business!</p>
    <p>Best Regards,<br>Fashbiz</p>`,
  });
}
