import nodemailer from "nodemailer";

export async function paymentSuccess(customerEmail, customerName) {
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
    to: customerEmail, 
    subject: "Payment Successfull",
    html: `
     Dear ${customerName},\n\nYour payment was successfully processed. Thank you for your purchase!\n\nBest regards,\nYour Company Name`
     ,
  });
}
