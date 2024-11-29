import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = parseInt(process.env.IV_LENGTH);

export const encrypt = (text) => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText) => {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from (encryptedHex, "hex");

    const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const decryptedBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decryptedBuffer.toString("utf8");
}
