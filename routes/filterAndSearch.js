const wrapAsync = require("../utils/wrapAsync");
const express = require("express");
const router = express.Router();
const listings = require("../controller/filterAndSearch");
const {isLoggedIn} = require("../middleware.js");

// Search all listings
router.get("/",isLoggedIn, wrapAsync(listings.searchBar));

module.exports = router;
