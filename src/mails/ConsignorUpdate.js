import nodemailer from "nodemailer";

export async function consignorUpdate(
  customerEmail,
  customerName,
  consignorEmail,
  consignorName,
  formattedProducts
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

  const productListHTML = formattedProducts
    .map(
      (product) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${product.title}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${product.brand}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">€${product.price.toFixed(
        2
      )}</td>
    </tr>
  `
    )
    .join("");

  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: consignorEmail,
    subject: "Product Purchased",
    html: `
      <p>Dear ${consignorName},</p>
      <p>Customer has purchase the products from store! Below are the details of the products :</p>
      <p>Store Owner Details - ${customerName} ( ${customerEmail} )</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Brand</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productListHTML}
        </tbody>
      </table>
      <p>We appreciate your business!</p>
      <p>Best Regards,<br>REELESTORES Team</p>
    `,
  });
}
