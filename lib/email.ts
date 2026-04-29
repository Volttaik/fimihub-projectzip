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

const EMAIL_BASE_STYLES = `
  body { margin:0; padding:0; background:#f4f4f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a; }
  table { border-collapse:collapse; }
  a { color:#7c3aed; text-decoration:none; }
`

function emailShell(opts: { previewText: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>FimiHub</title>
  <style>${EMAIL_BASE_STYLES}</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;">
  <span style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.previewText}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #f0f0f3;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#7c3aed;border-radius:8px;padding:8px 14px;">
                    <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.2px;">FimiHub</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f0f0f3;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                You received this email from FimiHub. If this wasn't you, please ignore this message.<br>
                &copy; ${new Date().getFullYear()} FimiHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="background:#7c3aed;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${label}</a>
      </td>
    </tr>
  </table>`
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
) {
  const transporter = getTransporter()
  const body = `
    <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">Verify your email address</h1>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Hi ${name}, welcome to FimiHub. Please confirm your email address to activate your account and start posting.
    </p>
    <div style="text-align:center;margin:28px 0;">
      ${ctaButton(verificationUrl, 'Verify email address')}
    </div>
    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      This link will expire in 24 hours. If you didn't create a FimiHub account, you can safely ignore this email.
    </p>
    <hr style="border:none;border-top:1px solid #f0f0f3;margin:24px 0;">
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
      Trouble with the button? Copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color:#7c3aed;word-break:break-all;">${verificationUrl}</a>
    </p>`
  await transporter.sendMail({
    from: `"FimiHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your FimiHub email address',
    html: emailShell({ previewText: 'Confirm your email to activate your FimiHub account.', bodyHtml: body }),
  })
}

export async function sendWelcomeEmail(to: string, name: string, siteUrl?: string) {
  const transporter = getTransporter()
  const dashboardUrl = `${siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://fimihub.com'}/dashboard`
  const body = `
    <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">Welcome to FimiHub, ${name}</h1>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
      Your account is now active. You can post ad spaces, browse listings, and connect with buyers and sellers across Africa.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.6;">&bull; Post ad spaces for free</td></tr>
      <tr><td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.6;">&bull; Buy credits to boost your ads</td></tr>
      <tr><td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.6;">&bull; Manage everything from your dashboard</td></tr>
    </table>
    <div style="text-align:center;margin:8px 0 0;">
      ${ctaButton(dashboardUrl, 'Go to dashboard')}
    </div>`
  await transporter.sendMail({
    from: `"FimiHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to FimiHub',
    html: emailShell({ previewText: 'Your FimiHub account is now active.', bodyHtml: body }),
  })
}
