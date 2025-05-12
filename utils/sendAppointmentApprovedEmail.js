import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendAppointmentApprovedEmail = async (
  to,
  subject,
  user,
  date,
  time,
  meetUrl,
) => {
  const msg = {
    to,
    from: process.env.VERIFIED_SENDER_EMAIL,
    subject,
    html: `
        <body>
  <div style="font-family: sans-serif; width:100%; margin: 0 auto; font-size: 18px; color: #333; background-color: #eeeeee;">
    <header style="padding: 26px; background-color: #0364BD; color: #f4f4f4; font-size: 24px; display: flex; align-items: center; gap: 26px; border-radius: 0 0 10px 10px; box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="47.5 47.5 105 105">
        <circle cx="100" cy="100" r="50" fill="white" stroke="red" stroke-width="5"></circle>
        <circle cx="100" cy="100" r="25" fill="black"></circle>
      </svg>
      <span style="font-weight: bold;">InLuna - Appointment Approved 🙏🏻</span>
    </header>
    <div style="padding: 10px; width: 100%;">
      <p>Hi ${user}</p>
      <p>Your Appointment request has been Approved for: <span>${date} at ${time}<span></p>
      <p>Here is your meeting link: <span>${meetUrl}</span></p>
      <p>Thank you for using our services 😊</p>
      <p>Sincerely yours,</p>
      <p>The InLuna team</p>
    </div>
<footer style="padding: 20px; font-size: 14px; color: #777; text-align: center; background-color: #0364BD; color: #f4f4f4; border-radius: 10px 10px 0 0;">
      <p>If you need further assistance, please contact our support team at
          <a href="mailto:support@excellitude.com" style="color: #f4f4f4; text-decoration: none;">support@excellitude.com</a>.
      </p>
      <p style="margin-top: 10px;">Excellitude Pvt ltd.</p>
      <p style="margin-top: 10px;">
          <a href="https://theinluna.com/privacyPolicy" style="color: #f4f4f4; text-decoration: none;">Privacy Policy</a> |
          <a href="https://theinluna.com/termsOfUse" style="color: #f4f4f4; text-decoration: none;">Terms of Service</a>
      </p>
    </footer>
  </div>

  <style>
    /* Ensures mobile style on both desktop and mobile */
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
