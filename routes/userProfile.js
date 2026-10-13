const wrapAsync = require("../utils/wrapAsync");
const express = require("express");
const router = express.Router();
const profile = require("../controller/userProfile");
const {isLoggedIn} = require("../middleware.js");


//Profile details of user
router.get("/",isLoggedIn, wrapAsync(profile.userProfile));

module.exports = router;