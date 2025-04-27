// This is official code for CCA just update to be used with es7 this code handles requests form to make payment
import { encrypt } from "./ccavutil.js";

const workingKey = process.env.CCA_WORKING_KEY;
const accessCode = process.env.CCA_ACCESS_CODE;
const merchantId = process.env.CCA_MERCHANT_ID;

// console.log("Working Key",workingKey);
// console.log("Access Code",accessCode);
// console.log("Merchant Id",merchantId);

const redirectUrl = `https://theinluna.com/api/ccavenue/paymentResponse`;
const cancelUrl = `http://localhost:5000/api/ccavenue/paymentResponse`;

// console.log("Redirect Url",redirectUrl);
// console.log("Cancel Url",cancelUrl);

export const postReq = async (req, res) => {
  try {
    const { amount, planName, userId, orgId } = req.body;
    console.log(req.body);
    const customData = {
      planName,
    };
    const customData2 = {
      ...(userId && { userId }),
    };
    const customData3 = {
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
      merchant_param2: JSON.stringify(customData2),
      merchant_param3: JSON.stringify(customData3),
    }).toString();

    // console.log("form Data",formData);

    // Encrypt the payload
    const encRequest = encrypt(formData, workingKey);
    // console.log("Encrypted Request", encRequest);
    

    // Build the auto-submit HTML form
    const formHTML = `
      <html>
        <body onload="document.forms[0].submit()">
          <form id="nonseamless" method="post" name="redirect" action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction">
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
