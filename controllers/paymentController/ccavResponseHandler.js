// This is official code for CCA just update to be used with es7 to be replaced with transactionController.js
import {
  saveToAdminDB,
  saveToOrgDB,
  saveToUserDB,
} from "../../utils/transactionService.js";
import { decrypt } from "./ccavutil.js";

export const postRes = async (req, res) => {
  try {
    const workingKey = process.env.CCA_WORKING_KEY;
    const { encResp } = req.body;
    console.log("encResp", encResp);

    if (!encResp) {
      return res.status(400).send("Missing encResp in the request");
    }

    const decryptedResponse = decrypt(encResp, workingKey);

    // Parse the decrypted query string into an object
    const params = Object.fromEntries(
      decryptedResponse.split("&").map((pair) => pair.split("=")),
    );

    // Convert decrypted response string into HTML table
    const formattedData = decryptedResponse
      .replace(/=/g, "</td><td>")
      .replace(/&/g, "</td></tr><tr><td>");

    const {
      order_id,
      tracking_id,
      currency,
      amount,
      payment_mode,
      order_status,
      merchant_param1,
      merchant_param2,
      merchant_param3,
    } = params;

    const userId = merchant_param2;
    const orgId = merchant_param3;

    console.log("Decrypted Response:", params);
    console.log("Order Id:", params.order_id);
    console.log("Transaction Id:", params.tracking_id);
    console.log("Amount:", params.amount);

    const transaction = {
      transaction_id: tracking_id,
      order_id,
      amount: amount,
      currency,
      plan_name: merchant_param1,
      payment_status: order_status,
      payment_mode,
      created_at: new Date(),
      user_id: merchant_param2 || null,
      org_id: merchant_param3 || null,
      source: merchant_param2 ? "user" : "org",
      gateway_response: params,
    };

    // Admin Database
    await saveToAdminDB(transaction);

    // Individividual Database
    if (userId) await saveToUserDB(userId, transaction);

    // Tenant Database
    if (orgId) await saveToOrgDB(orgId, transaction);

    if (!order_id || !order_status) {
      console.error("Invalid response data");
      return res.redirect(
        "http://localhost:5137/failure?reason=invalid_response",
      );
    }

    // Redirect to frontend success/failure page
    if (order_status === "Success") {
      return res.redirect(
        `http://localhost:5137/success?order_id=${order_id}&transaction_id=${tracking_id}&amount=${amount}&plan_name=${merchant_param1}&payment_mode=${payment_mode}&amount=${amount}`,
      );
    } else {
      return res.redirect(
        `http://localhost:5137/failure?order_id=${order_id}&transaction_id=${tracking_id}&amount=${amount}&plan_name=${merchant_param1}&payment_mode=${payment_mode}&amount=${amount}`,
      );
    }

    const htmlOutput = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>CCAvenue Payment Response</title>
        </head>
        <body>
          <center>
            <h2 style="color:blue;">Payment Response</h2>
            <table border="1" cellpadding="8" cellspacing="0">
              <tr><td>${formattedData}</td></tr>
              <p>${decryptedResponse}</p>
              <pre>${JSON.stringify(transaction, null, 2)}</pre>
            </table>
          </center>
        </body>
      </html>
    `;

    res.status(200).send(htmlOutput);
  } catch (error) {
    console.error("Error handling CCAvenue response:", error);
    res
      .status(500)
      .send("Something went wrong while processing the payment response.");
  }
};
