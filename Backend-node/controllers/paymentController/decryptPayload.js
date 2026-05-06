import { decrypt } from "../../utils/tokenEncryption.js";

export const decryptPayloadAPI = async (req, res) => {
  try {
    const { payload } = req.query;
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    const decrypted = decrypt(decodeURIComponent(payload));
    const parsed = JSON.parse(decrypted);

    if (!parsed.userId && !parsed.orgId) {
      return res.status(400).json({ error: "Invalid data" });
    }

    if (parsed.expires && Date.now() > parsed.expires) {
      return res.status(403).json({ error: "Payload expired" });
    }

    console.log(parsed);

    return res.json({
      userId: parsed.userId || null,
      orgId: parsed.orgId || null,
    });
  } catch (error) {
    console.error("Failed to decrypt payload:", error);
    res.status(500).json({ error: "Invalid or expired payload" });
  }
};
