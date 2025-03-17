import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send Email
export const sendPasswordSetupEmail = async (to, subject, content, user) => {
    const msg = {
        to,
        from: process.env.VERIFIED_SENDER_EMAIL,
        subject,
        html: `
        <body>
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; font-size: 18px; color: #333; background-color: #eeeeee;">
    <header style="padding: 26px; background-color: #0364BD; color: #f4f4f4; font-size: 24px; display: flex; align-items: center; gap: 26px; border-radius: 0 0 10px 10px;">
      <span style="font-weight: bold;">InLuna - Welcome 🙏🏻</span>
    </header>
    <div style="padding: 10px; width: 100%;">
      <p>Hi ${user.name},</p>
      <p>Here is the link to set up your password for your brand new InLuna Account provided by your organization:</p>
      <p>
        <span>${content}</span>
      </p>
      <p>And here are your login details:</p>
      <p>Organization ID: <strong>${user.orgId}</strong></p>
      <p>Username: <strong>${user.username}</strong></p>
      <p>Thank you for using our services 😊</p>
      <p>If you did not make this request, please ignore this email.</p>
      <p>Sincerely,</p>
      <p>The InLuna Team</p>
    </div>
    <footer style="padding: 20px; font-size: 14px; text-align: center; background-color: #0364BD; color: #f4f4f4;">
      <p>If you need further assistance, contact support at 
        <a href="mailto:support@InLuna.com" style="color: #f4f4f4; text-decoration: none;">support@InLuna.com</a>.
      </p>
    </footer>
  </div>
  
  <style>
    @media screen and (max-width: 600px) {
      div[style*="max-width: 600px;"] {
        padding: 20px;
        font-size: 16px;
        text-align: center;
      }
    }
  </style>
</body>
        `,
    };
    await sgMail.send(msg);
};