import { encrypt } from "./ccavutil.js";

// 🔐 Environment variables (securely stored)
const workingKey = process.env.CCA_WORKING_KEY;
const accessCode = process.env.CCA_ACCESS_CODE;
const merchantId = process.env.CCA_MERCHANT_ID;

const redirectUrl = `${process.env.PAYMENT_FRONTEND_URL}/success`;
const cancelUrl = `${process.env.PAYMENT_FRONTEND_URL}/failure`;

export const postReq = async (req, res) => {
  try {
    const { amount, planName, userId, orgId } = req.body;
    console.log(req.body);
    const customData = {
      planName,
      ...(userId && { userId }),
      ...(orgId && { orgId }),
    };
    const orderId = "ORD" + Date.now();

    // Build the plain text payload
    const formData = new URLSearchParams({
      merchant_id: merchantId,
      order_id: orderId,
      amount,
      currency: "INR",
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
      language: "EN",
      merchant_param1: JSON.stringify(customData),
    }).toString();

    console.log(formData);

    // Encrypt the payload
    const encRequest = encrypt(formData, workingKey);

    // Build the auto-submit HTML form
    const formHTML = `
      <html>
        <body onload="document.forms[0].submit()">
          <form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction">
            <input type="hidden" id="encRequest" name="encRequest" value="${encRequest}" />
            <input type="hidden" id="access_code" name="access_code" value="${accessCode}" />
          </form>
        </body>
      </html>
    `;

    res.status(200).send(formHTML);
  } catch (error) {
    console.error("Error in CCAvenue postReq:", error);
    res.status(500).send("Error processing payment request.");
  }
};
