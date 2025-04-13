import { encrypt } from "../../utils/tokenEncryption.js";

export const generateSecurePaymentLink = async (req, res) => {
  const { userId, orgId } = req.user;

  if (!userId && !orgId) {
    return res.status(400).json({ error: "userId or orgId required" });
  }

  const payload = {
    userId,
    orgId,
    expires: Date.now() + 15 * 60 * 1000, // valid for 15 minutes
  };

  const encrypted = encrypt(JSON.stringify(payload));
  console.log(encrypted);

  const url = `${process.env.PAYMENT_FRONTEND_URL}/?payload=${encodeURIComponent(encrypted)}`;
  return res.json({ url });
};
