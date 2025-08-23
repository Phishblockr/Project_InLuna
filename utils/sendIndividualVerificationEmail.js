import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendIndividualVerificationEmail = async (to, verifyLink, name) => {
  const msg = {
    to,
    from: process.env.VERIFIED_SENDER_EMAIL,
    subject: "Verify your email to activate your InLuna account",
    html: `
      <div style="font-family:sans-serif;background:#eeeeee;padding:0;margin:0;">
        <div style="max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0364BD;margin-top:0;">InLuna - Email Verification</h2>
          <p>Hi ${name || "there"},</p>
          <p>Thanks for signing up for InLuna. Please verify your email address to activate your individual account.</p>
          <p style="margin:30px 0;">
            <a href="${verifyLink}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a>
          </p>
          <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
          <p style="margin-top:40px;">Regards,<br/>The InLuna Team</p>
        </div>
      </div>
    `,
  };
  await sgMail.send(msg);
};
