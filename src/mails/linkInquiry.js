import nodemailer from "nodemailer";

export async function linkInquiry({ storeName, contactEmail, webshopUrl, message }) {
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

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "mia@le-stores.com",
    replyTo: contactEmail,
    subject: `Link inquiry from ${storeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 12px;">
          New Link Plan Inquiry
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #555; width: 140px; vertical-align: top;">Store Name</td>
            <td style="padding: 10px 12px;">${storeName}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px 12px; font-weight: bold; color: #555; vertical-align: top;">Contact Email</td>
            <td style="padding: 10px 12px;"><a href="mailto:${contactEmail}">${contactEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; font-weight: bold; color: #555; vertical-align: top;">Webshop URL</td>
            <td style="padding: 10px 12px;"><a href="${webshopUrl}" target="_blank">${webshopUrl}</a></td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px 12px; font-weight: bold; color: #555; vertical-align: top;">Message</td>
            <td style="padding: 10px 12px;">${message || "<em>No message provided</em>"}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          This inquiry was submitted via the leStores AI pricing page.
        </p>
      </div>
    `,
  });
}
