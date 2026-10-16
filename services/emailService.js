/**
 * Transactional Email Service for RoomForU using Brevo (formerly Sendinblue).
 * Provides secure delivery for Signup Verification OTPs and Password Reset OTPs.
 */

const ExpressError = require("../utils/ExpressError.js");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Checks if Brevo configuration credentials are fully present.
 */
function isBrevoConfigured() {
    return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

/**
 * Base method to dispatch an email via Brevo REST API v3.
 * Gracefully falls back to structured console logging in development mode if credentials are pending.
 */
async function sendEmail({ toEmail, toName, subject, htmlContent, textContent }) {
    if (!toEmail || typeof toEmail !== "string") {
        throw new ExpressError(400, "Recipient email address is required.");
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "RoomForU";
    const apiKey = process.env.BREVO_API_KEY;

    // Development fallback if Brevo credentials are not yet supplied
    if (!apiKey || !senderEmail) {
        console.log("------------------------------------------------------------");
        console.log(`[RoomForU Email DEV - Brevo Pending]`);
        console.log(`To: ${toName || "User"} <${toEmail}>`);
        console.log(`Subject: ${subject}`);
        console.log(`Text Preview: ${textContent || "HTML content only"}`);
        console.log("------------------------------------------------------------");
        return {
            success: true,
            messageId: `dev-mock-${Date.now()}`,
            mocked: true
        };
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail.trim()
        },
        to: [
            {
                email: toEmail.trim().toLowerCase(),
                name: toName ? toName.trim() : toEmail.split("@")[0]
            }
        ],
        subject: subject,
        htmlContent: htmlContent,
        ...(textContent ? { textContent: textContent } : {})
    };

    try {
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey.trim(),
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMsg = data?.message || data?.error || `HTTP ${response.status}: Failed to dispatch email via Brevo.`;
            console.error(`[Brevo API Error ${response.status}]:`, data);
            throw new ExpressError(502, `Email delivery failed: ${errorMsg}`);
        }

        return {
            success: true,
            messageId: data.messageId || "brevo-sent",
            mocked: false
        };
    } catch (err) {
        if (err instanceof ExpressError) throw err;
        console.error("[Email Service Network Error]:", err.message);
        throw new ExpressError(503, "Unable to communicate with email delivery service. Please try again shortly.");
    }
}

/**
 * Builds standard RoomForU branded HTML email container.
 */
function buildEmailTemplate({ title, subtitle, contentHtml, footerNote }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
    .logo span { color: #f97316; }
    .tagline { font-size: 13px; opacity: 0.9; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .heading { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
    .otp-box { background-color: #f0fdfa; border: 2px dashed #0f766e; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0f766e; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f766e; margin: 0; }
    .info-box { background-color: #f8fafc; border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Room<span>ForU</span></h1>
      <p class="tagline">Student Accommodation & Room Sharing Platform</p>
    </div>
    <div class="content">
      <h2 class="heading">${title}</h2>
      ${subtitle ? `<p class="text">${subtitle}</p>` : ""}
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} RoomForU. All rights reserved.</p>
      ${footerNote ? `<p style="margin: 0;">${footerNote}</p>` : `<p style="margin: 0;">This is an automated security message. Please do not reply directly to this email.</p>`}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends Signup Email Verification OTP.
 */
async function sendSignupOtpEmail({ toEmail, name, otp }) {
    const subject = `${otp} is your RoomForU verification code`;
    const title = "Verify Your Email Address";
    const subtitle = `Hi ${name || "there"}, welcome to RoomForU! Please verify your email to activate your account.`;

    const contentHtml = `
      <div class="otp-box">
        <div class="otp-label">Your 6-Digit Verification Code</div>
        <div class="otp-code">${otp}</div>
      </div>
      <div class="info-box">
        <strong>Security Notice:</strong>
        <ul style="margin: 6px 0 0; padding-left: 18px;">
          <li>This code is valid for <strong>10 minutes</strong>.</li>
          <li>Never share this code with anyone. RoomForU support will never ask for your code.</li>
          <li>If you did not request to create an account, you can safely ignore this email.</li>
        </ul>
      </div>
    `;

    const textContent = `Welcome to RoomForU!\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not sign up on RoomForU, please ignore this email.`;

    const htmlContent = buildEmailTemplate({
        title,
        subtitle,
        contentHtml,
        footerNote: "You received this email because someone registered with this address on RoomForU."
    });

    return await sendEmail({
        toEmail,
        toName: name,
        subject,
        htmlContent,
        textContent
    });
}

/**
 * Sends Password Reset OTP.
 */
async function sendPasswordResetOtpEmail({ toEmail, name, otp }) {
    const subject = `${otp} is your RoomForU password reset code`;
    const title = "Reset Your Password";
    const subtitle = `Hi ${name || "there"}, we received a request to reset your RoomForU account password.`;

    const contentHtml = `
      <div class="otp-box">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${otp}</div>
      </div>
      <div class="info-box">
        <strong>Important:</strong>
        <ul style="margin: 6px 0 0; padding-left: 18px;">
          <li>This verification code will expire in <strong>10 minutes</strong>.</li>
          <li>If you did not initiate this password reset, please change your password immediately or contact support.</li>
          <li>Never forward this code to any third party.</li>
        </ul>
      </div>
    `;

    const textContent = `RoomForU Password Reset\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes.\nIf you did not request a password reset, please ignore this email or review your account security.`;

    const htmlContent = buildEmailTemplate({
        title,
        subtitle,
        contentHtml,
        footerNote: "You received this email because a password reset was requested for your RoomForU account."
    });

    return await sendEmail({
        toEmail,
        toName: name,
        subject,
        htmlContent,
        textContent
    });
}

module.exports = {
    isBrevoConfigured,
    sendEmail,
    sendSignupOtpEmail,
    sendPasswordResetOtpEmail
};
