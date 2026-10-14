const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../../../controller/api/v1/authController.js");
const { authLimiter } = require("../../../middleware/security.js");

const getFrontendUrl = () => {
    return process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost:5000")
        ? process.env.FRONTEND_URL
        : "http://localhost:3000";
};

// Register a new user
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
        if (req.query.returnTo) {
            req.session.returnTo = req.query.returnTo;
        }
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
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
