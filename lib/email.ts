import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  })
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"FimiHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your FimiHub email address',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(59,31,110,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px;text-align:center;">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:28px;">🏠</span>
            </div>
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FimiHub</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your marketplace for everything</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1a1209;margin:0 0 12px;font-size:22px;font-weight:700;">Hi ${name}, verify your email</h2>
            <p style="color:#6b5f52;font-size:15px;line-height:1.6;margin:0 0 28px;">
              You're almost there! Click the button below to verify your email address and activate your FimiHub account.
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                Verify Email Address
              </a>
            </div>
            <p style="color:#9a8f84;font-size:13px;line-height:1.5;margin:0;">
              This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;">
            <p style="color:#b0a89e;font-size:12px;margin:0;">Or copy this link into your browser:<br>
              <a href="${verificationUrl}" style="color:#7c3aed;word-break:break-all;font-size:12px;">${verificationUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f5f0;padding:20px;text-align:center;border-top:1px solid #e8e0d8;">
            <p style="color:#b0a89e;font-size:12px;margin:0;">© 2025 FimiHub · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  })
}

export async function sendWelcomeEmail(to: string, name: string) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"FimiHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to FimiHub! 🎉',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(59,31,110,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome to FimiHub!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1a1209;margin:0 0 12px;">Hey ${name}! 👋</h2>
            <p style="color:#6b5f52;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Your account is now active. You can start posting ad spaces, browsing listings, and connecting with buyers and sellers across Africa.
            </p>
            <ul style="color:#6b5f52;font-size:15px;line-height:2;margin:0 0 28px;padding-left:20px;">
              <li>Post free ad spaces instantly</li>
              <li>Buy credits to boost your ads</li>
              <li>Manage everything from your dashboard</li>
            </ul>
            <div style="text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://fimihub.com'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;">
                Go to Dashboard
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f5f0;padding:20px;text-align:center;border-top:1px solid #e8e0d8;">
            <p style="color:#b0a89e;font-size:12px;margin:0;">© 2025 FimiHub · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  })
}
