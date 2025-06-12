import crypto from "crypto";
import bcrypt from "bcryptjs";

//send setup password mail
export const generatePasswordSetupLink = async (user, orgId) => {
  const setPassToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(setPassToken, 10);

  user.setupPasswordToken = hashedToken;
  user.setupPasswordExpires = Date.now() + 86400000; // 24 hours
  await user.save();

  const setPasswordLink = `${process.env.FRONT_END_URL}/setupPassword/${setPassToken}`;

  return `<p>Click <a href="${setPasswordLink}">here</a> to set your password.</p>`;
};
