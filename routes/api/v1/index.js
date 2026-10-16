const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.js");
const listingRoutes = require("./listings.js");
const profileRoutes = require("./profile.js");
const { apiLimiter } = require("../../../middleware/security.js");

// Apply general API rate limiting to all v1 endpoints
router.use(apiLimiter);

// Root v1 index endpoint
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "RoomForU REST API",
        version: "v1",
        endpoints: {
            health: "GET /api/v1/health",
            auth: {
                requestSignupOtp: "POST /api/v1/auth/signup/request-otp",
                resendSignupOtp: "POST /api/v1/auth/signup/resend-otp",
                verifySignupOtp: "POST /api/v1/auth/signup/verify",
                requestPasswordResetOtp: "POST /api/v1/auth/password-reset/request-otp",
                resendPasswordResetOtp: "POST /api/v1/auth/password-reset/resend-otp",
                verifyPasswordResetOtp: "POST /api/v1/auth/password-reset/verify-otp",
                confirmPasswordReset: "POST /api/v1/auth/password-reset/confirm",
                signup: "POST /api/v1/auth/signup",
                signin: "POST /api/v1/auth/signin",
                logout: "POST /api/v1/auth/logout",
                currentUser: "GET /api/v1/auth/current-user",
                googleOAuth: "GET /api/v1/auth/google"
            },
            listings: {
                getAll: "GET /api/v1/listings",
                getOne: "GET /api/v1/listings/:id",
                create: "POST /api/v1/listings",
                update: "PUT|PATCH /api/v1/listings/:id",
                delete: "DELETE /api/v1/listings/:id",
                addReview: "POST /api/v1/listings/:id/reviews",
                deleteReview: "DELETE /api/v1/listings/:id/reviews/:reviewId"
            },
            profile: "GET /api/v1/profile"
        }
    });
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "RoomForU REST API",
        version: "v1",
        status: "operational",
        timestamp: new Date().toISOString()
    });
});

// Mount sub-routers
router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
