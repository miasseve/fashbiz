// ============= lib/emailService.js =============
import nodemailer from 'nodemailer';
 
// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT, // 587 for TLS
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
 
export const emailService = {
  // Send subscription activated email
  async sendSubscriptionActivated(user, subscription) {
    const mailOptions = {
      from:  process.env.EMAIL_USER,
      to: user.email,
      subject: '🎉 Your Subscription is Active!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${subscription.planName}!</h2>
          <p>Hi ${user.firstname},</p>
          <p>Your subscription has been successfully activated.</p>
         
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Subscription Details:</h3>
            <p><strong>Plan:</strong> ${subscription.planName}</p>
            <p><strong>Status:</strong> ${subscription.status}</p>
            <p><strong>Start Date:</strong> ${new Date(subscription.startDate).toLocaleDateString()}</p>
            <p><strong>Next Billing:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</p>
            // ${subscription.trialEnd ? `<p><strong>Trial Ends:</strong> ${new Date(subscription.trialEnd).toLocaleDateString()}</p>` : ''}
          </div>
         
          <p>Thank you for choosing us!</p>
          <p>Best regards,<br>${process.env.APP_NAME} Team</p>
        </div>
      `,
    };
 
    await transporter.sendMail(mailOptions);
  },
 
  // Send subscription cancelled email
  async sendSubscriptionCancelled(user, subscription) {
    const mailOptions = {
      from:  process.env.EMAIL_USER,
      to: user.email,
      subject: 'Subscription Cancellation Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Cancellation</h2>
          <p>Hi ${user.firstname},</p>
          <p>Your subscription has been scheduled for cancellation.</p>
         
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Important Information:</h3>
            <p><strong>Plan:</strong> ${subscription.planName}</p>
            <p><strong>Access Until:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</p>
            <p>You'll continue to have access to your subscription until the end of your billing period.</p>
          </div>
         
          <p>We're sad to see you go! If you change your mind, you can reactivate anytime.</p>
          <p>Best regards,<br>${process.env.APP_NAME} Team</p>
        </div>
      `,
    };
 
    await transporter.sendMail(mailOptions);
  },
 
  // Send subscription plan changed email
  async sendSubscriptionChanged(user, subscription, oldPlanName) {
    const mailOptions = {
      from:  process.env.EMAIL_USER,
      to: user.email,
      subject: 'Subscription Plan Updated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Plan Updated Successfully!</h2>
          <p>Hi ${user.firstname},</p>
          <p>Your subscription plan has been updated.</p>
         
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Plan Change:</h3>
            <p><strong>Previous Plan:</strong> ${oldPlanName}</p>
            <p><strong>New Plan:</strong> ${subscription.planName}</p>
            <p><strong>Next Billing:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</p>
          </div>
         
          <p>Your new plan is now active and ready to use!</p>
          <p>Best regards,<br>${process.env.APP_NAME} Team</p>
        </div>
      `,
    };
 
    await transporter.sendMail(mailOptions);
  },
 
  // Send trial ending soon email
  async sendTrialEndingSoon(user, subscription, daysLeft) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your Trial Ends in ${daysLeft} Days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Trial Ending Soon</h2>
          <p>Hi ${user.firstname},</p>
          <p>Your ${subscription.planName} trial will end in ${daysLeft} days.</p>
         
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Trial Ends:</strong> ${new Date(subscription.trialEnd).toLocaleDateString()}</p>
            <p>Your subscription will automatically continue after the trial ends.</p>
          </div>
         
          <p>If you wish to cancel, you can do so anytime from your account settings.</p>
          <p>Best regards,<br>${process.env.APP_NAME} Team</p>
        </div>
      `,
    };
 
    await transporter.sendMail(mailOptions);
  },
 
  // Send payment failed email
  async sendPaymentFailed(user, subscription) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '⚠️ Payment Failed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Failed</h2>
          <p>Hi ${user.firstname},</p>
          <p>We were unable to process your payment for ${subscription.planName}.</p>
         
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Action Required:</h3>
            <p>Please update your payment method to continue your subscription.</p>
            <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/subscription"
               style="display: inline-block; background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              Update Payment Method
            </a>
          </div>
         
          <p>Best regards,<br>${process.env.APP_NAME} Team</p>
        </div>
      `,
    };
 
    await transporter.sendMail(mailOptions);
  },
};
 