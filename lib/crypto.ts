import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_PREFIX = "v1";
const IV_LENGTH = 12;

function getEncryptionKey() {
  const secret = process.env.TELEGRAM_TOKEN_SECRET;

  if (!secret) {
    throw new Error("TELEGRAM_TOKEN_SECRET is required");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptToken(cipher: string): string {
  const [version, iv, authTag, encrypted] = cipher.split(":");

  if (version !== ENCRYPTION_PREFIX || !iv || !authTag || !encrypted) {
    return cipher;
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
