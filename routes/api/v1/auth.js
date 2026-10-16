const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../../../controller/api/v1/authController.js");
const { authLimiter, otpRequestLimiter, otpVerifyLimiter } = require("../../../middleware/security.js");

const getFrontendUrl = () => {
    return process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost:5000")
        ? process.env.FRONTEND_URL
        : "http://localhost:3000";
};

// --- Signup Email OTP Verification ---
router.post("/signup/request-otp", otpRequestLimiter, authController.requestSignupOtp);
router.post("/signup/resend-otp", otpRequestLimiter, authController.resendSignupOtp);
router.post("/signup/verify", otpVerifyLimiter, authController.verifySignupOtp);

// --- Password Reset via Email OTP ---
router.post("/password-reset/request-otp", otpRequestLimiter, authController.requestPasswordResetOtp);
router.post("/password-reset/resend-otp", otpRequestLimiter, authController.resendPasswordResetOtp);
router.post("/password-reset/verify-otp", otpVerifyLimiter, authController.verifyPasswordResetOtp);
router.post("/password-reset/confirm", otpVerifyLimiter, authController.confirmPasswordReset);

// Register a new user (legacy/direct fallback)
router.post("/signup", authLimiter, authController.signup);

// Sign in with username or email & password
router.post("/signin", authLimiter, authController.signin);

// Sign out
router.post("/logout", authController.logout);
router.get("/logout", authController.logout);

// Delete account alias
const { isLoggedIn } = require("../../../middleware.js");
const profileController = require("../../../controller/api/v1/profileController.js");
router.delete("/account", isLoggedIn, profileController.deleteUserAccount);

// Get currently authenticated session user
router.get("/current-user", authController.currentUser);
router.get("/me", authController.currentUser);

// Google OAuth Initiation
router.get(
    "/google",
    (req, res, next) => {
        if (typeof req.query.returnTo === "string") {
            const raw = req.query.returnTo.trim();
            // Allow only safe relative paths starting with a single '/'
            if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
                req.session.returnTo = raw;
            }
        }
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"], state: true })
);

// Google OAuth Callback
router.get(
    "/google/callback",
    (req, res, next) => {
        passport.authenticate("google", (err, user) => {
            const frontendBase = getFrontendUrl();
            if (err || !user) {
                return res.redirect(`${frontendBase}/signin?error=oauth_failed`);
            }
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return res.redirect(`${frontendBase}/signin?error=oauth_failed`);
                }
                return authController.googleCallback(req, res);
            });
        })(req, res, next);
    }
);

module.exports = router;
