const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../../../middleware.js");
const profileController = require("../../../controller/api/v1/profileController.js");

// GET /api/v1/profile - Current user profile and created listings
router.get("/", isLoggedIn, profileController.getUserProfile);

// DELETE /api/v1/profile - Permanently delete current user profile, listings, reviews, and account data
router.delete("/", isLoggedIn, profileController.deleteUserAccount);

module.exports = router;
