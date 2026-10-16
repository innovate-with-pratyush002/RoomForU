const crypto = require("crypto");

/**
 * Generates a cryptographically secure 6-digit numeric OTP string (100000 - 999999).
 */
function generateNumericOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Creates a SHA-256 hash of a string (OTP, reset token, etc.) for secure database storage.
 */
function hashSecret(secret) {
    if (!secret || typeof secret !== "string") {
        throw new Error("Secret must be a valid string to hash");
    }
    return crypto.createHash("sha256").update(secret).digest("hex");
}

/**
 * Compares two hex-encoded hashes using timingSafeEqual to protect against timing attacks.
 */
function timingSafeEqualHex(candidateHex, storedHex) {
    if (typeof candidateHex !== "string" || typeof storedHex !== "string") {
        return false;
    }
    const bufA = Buffer.from(candidateHex, "hex");
    const bufB = Buffer.from(storedHex, "hex");
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically strong, random 32-byte hex token for password reset verification.
 */
function generateRandomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Derives a 32-byte key from the application session secret for AES-256-GCM encryption.
 */
function getEncryptionKey() {
    const secret = process.env.SESSION_SECRET || "fallback_development_session_secret_key_2025";
    return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts an object payload using AES-256-GCM.
 * Used to securely protect pending signup registration credentials at rest until email verification.
 */
function encryptPayload(data) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const jsonStr = JSON.stringify(data);
    let encrypted = cipher.update(jsonStr, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
        iv: iv.toString("hex"),
        content: encrypted,
        tag: authTag
    };
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
function decryptPayload(encryptedObj) {
    if (!encryptedObj || !encryptedObj.iv || !encryptedObj.content || !encryptedObj.tag) {
        throw new Error("Invalid encrypted payload structure");
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedObj.iv, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(encryptedObj.tag, "hex"));

    let decrypted = decipher.update(encryptedObj.content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
}

/**
 * Masks an email for safe client hints (e.g., "pratyush@example.com" -> "pr***h@example.com").
 */
function maskEmail(email) {
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return "";
    }
    const [local, domain] = email.trim().toLowerCase().split("@");
    if (local.length <= 2) {
        return `${local[0]}*@${domain}`;
    }
    const maskedLocal = `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
}

module.exports = {
    generateNumericOtp,
    hashSecret,
    timingSafeEqualHex,
    generateRandomToken,
    encryptPayload,
    decryptPayload,
    maskEmail
};
