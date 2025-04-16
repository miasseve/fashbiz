import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(user, resetToken) {
  // Create reset password URL
  const resetURL = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/reset-password?token=${resetToken}`;
  const logoURL = `${process.env.NEXT_PUBLIC_FRONTEND_LIVE_URL}/images/fash.png`;
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
    to: user.email, // assuming 'user' has an email field
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoURL}" alt="Company Logo" style="max-width: 150px; height: auto;">
        </div>  
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">
          Hello, ${user.firstname} ${user.lastname} <br><br>
          We received a request to reset your password. Click the button below to proceed:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetURL}" 
            style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          If you didn’t request a password reset, you can safely ignore this email. This link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          Need help? Contact our support team at <a href="mailto:support@yourwebsite.com" style="color: #007bff;">support@yourwebsite.com</a>
        </p>
      </div>
    `,
  });
}
