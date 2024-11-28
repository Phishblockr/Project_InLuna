import React from 'react';

export default function EmailBody({ from, subject, body, resetLink, helpLink, userEmail }) {
  // Define the HTML template with placeholders for dynamic data
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .email-header img {
          max-width: 120px;
          margin-bottom: 20px;
        }
        .email-body {
          text-align: left;
          color: #333333;
        }
        .email-body p {
          margin: 10px 0;
        }
        .email-button {
          margin: 20px 0;
        }
        .email-button a {
          background-color: #4285f4;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 16px;
        }
        .email-footer {
          margin-top: 20px;
          font-size: 12px;
          color: #777777;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png" alt="Google Logo">
        </div>
        <div class="email-body">
          <p>Dear ${userEmail},</p>
          <p>We received a request to reset the password for your Google account: <strong>${userEmail}</strong>.</p>
          <p>If you made this request, you can reset your password by following the instructions below:</p>
          <p><strong>Reset Your Password:</strong></p>
          <p>Click the link below to reset your password: <strong><a href="${resetLink}" target="_blank">Reset Password</a></strong></p>
          <p>This link will expire in 24 hours. If you don’t reset your password within this time, you will need to request a new link.</p>
          <p>If you did not request this password reset, please ignore this email. Your account will remain secure, and no changes will be made.</p>
          <p>For additional help, you can visit our help center here: <strong><a href="${helpLink}" target="_blank">Help Center</a></strong></p>
          <p>Thank you,</p>
          <p>The Google Team</p>
        </div>
        <div class="email-button">
          <a href="${resetLink}" target="_blank">Reset Password</a>
        </div>
        <div class="email-footer">
          © 2024 Google Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return (
    <div
      className="email-container"
      dangerouslySetInnerHTML={{ __html: emailHtml }} // Set the HTML content directly
    />
  );
}
