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
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Transfer Created: ${transferId}`,
    html: `
   <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Hi ${name},</p>

      <p>We're happy to let you know that a transfer has been successfully created to your Stripe account.</p>

      <p><strong>Transfer Details:</strong></p>
      <ul>
        <li><strong>Amount:</strong> ${transferAmount} ${transferCurrency.toUpperCase()}</li>
        <li><strong>Transfer ID:</strong> ${transferId}</li>
      </ul>

      <p>You can expect to see this amount reflected in your connected Stripe account shortly. If you have any questions or concerns, feel free to reach out to our support team.</p>

      <p>Thank you for being part of LESTORES!</p>

      <p>Best regards,<br/>REELESTORES Team</p>
    </div>`,
  });
}
