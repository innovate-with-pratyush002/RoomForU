const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OtpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        otpHash: {
            type: String,
            required: true
        },
        purpose: {
            type: String,
            required: true,
            enum: ["SIGNUP_VERIFICATION", "PASSWORD_RESET"],
            index: true
        },
        // For SIGNUP_VERIFICATION: holds encrypted pending registration data (AES-256-GCM)
        pendingUserData: {
            type: Schema.Types.Mixed,
            default: null
        },
        // Security: attempt counting to prevent brute-force attacks
        attempts: {
            type: Number,
            default: 0
        },
        maxAttempts: {
            type: Number,
            default: 5
        },
        // Resend rate limiting
        resendCount: {
            type: Number,
            default: 0
        },
        lastSentAt: {
            type: Date,
            default: Date.now
        },
        // For PASSWORD_RESET: single-use, unpredictable reset token issued after OTP verification
        resetTokenHash: {
            type: String,
            default: null,
            index: true
        },
        resetTokenExpiresAt: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        // Automatic document expiration via MongoDB TTL index (default: 10 minutes)
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }
        }
    },
    { timestamps: true }
);

// Compound index for querying active OTP by email and purpose
OtpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("OtpVerification", OtpSchema);
