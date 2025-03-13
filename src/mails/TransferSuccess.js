import nodemailer from "nodemailer";

export async function transferSuccess(email,transferAmount, transferCurrency,paidTransfer) {
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
    subject: `Transfer Paid: ${paidTransfer.id}`,
    html: `
     A transfer of ${transferAmount} ${transferCurrency} was successfully paid to your account. \n\nTransfer ID: ${paidTransfer.id}\n\nThank you for using our platform.`

  });
}
