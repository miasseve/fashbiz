import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(process.env.REFERRAL_SECRET_KEY, "hex"); // must be 64 hex chars = 32 bytes

export function encrypt(text) {
  const iv = crypto.randomBytes(12); // recommended 12-byte IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine iv + encrypted + tag (all hex)
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

export function decrypt(encryptedData) {
  const [ivHex, encryptedHex, tagHex] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString("utf8");
}
