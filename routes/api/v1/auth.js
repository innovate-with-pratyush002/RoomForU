const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../../../controller/api/v1/authController.js");
const { authLimiter } = require("../../../middleware/security.js");

// Register a new user
router.post("/signup", authLimiter, authController.signup);

// Sign in with username or email & password
router.post("/signin", authLimiter, authController.signin);

// Sign out
router.post("/logout", authController.logout);
router.get("/logout", authController.logout);

// Get currently authenticated session user
router.get("/current-user", authController.currentUser);
router.get("/me", authController.currentUser);

// Google OAuth Initiation
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth Callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/signin?error=oauth_failed"
    }),
    authController.googleCallback
);

module.exports = router;
