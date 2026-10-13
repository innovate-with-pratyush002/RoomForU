const Listing= require("../models/listing.js");
const CurrentUser= require("../models/authentication.js");

//Profile route:=>
module.exports.userProfile = async (req, res) => {
    let User_id = req.user?._id || res.locals.currentUser?._id;
    if (!User_id) {
        req.flash("error", "You must be signed in to view your profile!");
        return res.redirect("/signin");
    }
    const UserData = await CurrentUser.findById(User_id);
    if (!UserData) {
        req.flash("error", "User does not exist!");
        return res.redirect("/listings");
    }
    const allListings = await Listing.find({ user: User_id })
      .populate({ path: "reviews", populate: { path: "owner" } })
      .populate("user");

    res.render("./userAuthentication/userProfile.ejs", { UserData, allListings});
 }
