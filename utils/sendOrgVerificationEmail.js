import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOrgVerificationEmail = async (to, verifyLink, orgName) => {
  const msg = {
    to,
    from: process.env.VERIFIED_SENDER_EMAIL,
    subject: "Verify your email to create your InLuna organization",
    html: `
      <body>
      <div style="font-family: sans-serif; width:100%; margin:0 auto; font-size:16px; color:#333; background:#eeeeee;">
        <header style="padding:24px; background:#0364BD; color:#fff; font-size:22px; border-radius:0 0 10px 10px; font-weight:bold;">InLuna - Verify Email</header>
        <div style="padding:20px;">
          <p>Hello,</p>
          <p>You requested to create the organization <strong>${orgName}</strong> on InLuna.</p>
          <p>Please verify your email to continue with the organization setup.</p>
          <p style="margin:30px 0;">
            <a href="${verifyLink}" style="background:#4f46e5; color:#fff; padding:12px 22px; border-radius:6px; text-decoration:none; display:inline-block;">Verify Email</a>
          </p>
          <p>This link will expire in 24 hours. If you did not request this, you can safely ignore this email.</p>
          <p>Regards,<br/>The InLuna Team</p>
        </div>
        <footer style="padding:16px; font-size:14px; background:#0364BD; color:#fff; border-radius:10px 10px 0 0; text-align:center;">
          <p>Need help? <a href="mailto:support@excellitude.com" style="color:#fff;">Contact Support</a></p>
          <p style="margin-top:8px;">Excellitude Pvt Ltd.</p>
        </footer>
      </div>
      </body>
    `,
  };
  await sgMail.send(msg);
};
