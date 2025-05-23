import nodemailer from "nodemailer";

export async function transferFailed(
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
    subject: `Transfer Failed: ${transferId}`,
    html: `
   <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Hi ${name},</p>

      <p>We encountered an issue while processing a transfer to your Stripe account.</p>

      <p><strong>Transfer Details:</strong></p>
      <ul>
        <li><strong>Amount:</strong> ${transferAmount} ${transferCurrency.toUpperCase()}</li>
        <li><strong>Transfer ID:</strong> ${transferId}</li>
      </ul>

      <p>This failure may be due to incorrect account information or issues with the connected Stripe account. Please check your Stripe dashboard or reach out to us for assistance.</p>

      <p>If you believe this was a mistake or need support resolving it, feel free to contact our support team.</p>

      <p>Thank you for using Fashbiz.</p>

      <p>Best regards,<br/>Fashbiz Team</p>
    </div>`,
  });
}
