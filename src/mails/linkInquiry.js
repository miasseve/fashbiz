import nodemailer from "nodemailer";

// Escape customer-submitted values so markup in a submission cannot alter the
// email or break the layout (shown as plain text).
const esc = (v = "") =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Build the branded HTML body. Kept separate from sending so it can be rendered
// and checked without dispatching a real email.
export function renderLinkInquiryHtml({ name, storeName, contactEmail, webshopUrl, message }) {
  // Brand tokens (DESIGN.md)
  const primary = "#ca2356";
  const pageBg = "#fff5f7";
  const surface = "#ffffff";
  const foreground = "#111827";
  const muted = "#6b7280";
  const border = "#e5e7eb";

  // Safe display values
  const nameText = name ? esc(name) : "—";
  const storeText = esc(storeName);
  const emailText = esc(contactEmail);
  const urlText = esc(webshopUrl);
  const urlHref = encodeURI(webshopUrl || "");
  const messageHtml = message ? esc(message) : "<em style='color:#9ca3af;'>No message provided</em>";
  const replyLabel = esc(name || storeName);

  // One labelled detail row (stacked label + value, email-client safe)
  const detailRow = (label, valueHtml, last = false) => `
    <tr>
      <td style="padding:14px 0;${last ? "" : `border-bottom:1px solid ${border};`}">
        <div style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${muted};margin-bottom:4px;">${label}</div>
        <div style="font-size:15px;line-height:1.5;color:${foreground};word-break:break-word;">${valueHtml}</div>
      </td>
    </tr>`;

  return `
      <div style="margin:0;padding:0;background-color:${pageBg};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${pageBg};width:100%;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:24px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">

                <!-- Header -->
                <tr>
                  <td style="background-color:${primary};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
                    <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.01em;line-height:1.2;">leStores AI</div>
                    <div style="margin-top:10px;color:#ffffff;font-size:16px;font-weight:600;line-height:1.3;opacity:0.92;">New webshop connection request</div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background-color:${surface};padding:32px;border-left:1px solid ${border};border-right:1px solid ${border};">
                    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${foreground};">
                      A customer submitted the &ldquo;Get it now&rdquo; form on the pricing page. Here are their details:
                    </p>

                    <!-- Details card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:#fafafa;border:1px solid ${border};border-radius:12px;">
                      <tr>
                        <td style="padding:4px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                            ${detailRow("Name", nameText)}
                            ${detailRow("Store / Company", storeText)}
                            ${detailRow("Contact Email", `<a href="mailto:${emailText}" style="color:${primary};text-decoration:none;">${emailText}</a>`)}
                            ${detailRow("Webshop URL", `<a href="${urlHref}" target="_blank" rel="noopener noreferrer" style="color:${primary};text-decoration:none;">${urlText}</a>`)}
                            ${detailRow("Message", messageHtml, true)}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Call to action -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:28px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:${emailText}" style="display:inline-block;background-color:${primary};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">
                            Reply to ${replyLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:${surface};border:1px solid ${border};border-top:none;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
                    <div style="border-top:1px solid ${border};padding-top:20px;">
                      <div style="font-size:14px;font-weight:700;color:${foreground};">leStores AI</div>
                      <div style="margin-top:6px;font-size:12px;line-height:1.5;color:${muted};">
                        This inquiry was submitted via the leStores AI pricing page.
                      </div>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
}

export async function linkInquiry({ name, storeName, contactEmail, webshopUrl, message }) {
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
    subject: `New webshop connection request - ${storeName}`,
    html: renderLinkInquiryHtml({ name, storeName, contactEmail, webshopUrl, message }),
  });
}
