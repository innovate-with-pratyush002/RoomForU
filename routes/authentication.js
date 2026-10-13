const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const router = express.Router();
const passport = require("passport");
const ListingControllers = require("../controller/authentication.js");
const { authLimiter } = require("../middleware/security.js");

// Signup routes
router.get("/signup", ListingControllers.signUpForm);
router.post("/signup", authLimiter, wrapAsync(ListingControllers.Signup));

// Google OAuth routes
router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/signin?error=oauth_failed" }),
    (req, res) => {
        res.redirect("/listings");
    }
);

// Signin routes
router.get("/signin", ListingControllers.signinForm);
router.post(
    "/signin",
    authLimiter,
    passport.authenticate("local", { failureRedirect: "/signin", failureFlash: true }),
    wrapAsync(ListingControllers.SignIn)
);

// Logout routes
router.get("/logout", ListingControllers.logout);
router.post("/logout", ListingControllers.logout);

module.exports = router;