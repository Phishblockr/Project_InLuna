import { decrypt } from "./ccavutil.js";

const workingKey = process.env.CCA_WORKING_KEY;

export const postRes = async (req, res) => {
  try {
    // Body should be URL-encoded and already parsed by express
    const { encResp } = req.body;

    if (!encResp) {
      return res.status(400).send("Missing encResp in the request");
    }

    const decryptedResponse = decrypt(encResp, workingKey);

    // Convert decrypted response string into HTML table
    const formattedData = decryptedResponse
      .replace(/=/g, "</td><td>")
      .replace(/&/g, "</td></tr><tr><td>");

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
