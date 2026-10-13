const Listing= require("./models/listing.js");
const Review= require("./models/review.js");



module.exports.isLoggedIn=(req, res, next)=> {
    if (req.isAuthenticated()) return next();
    req.flash("error", "You must be signed in first!");
    return res.redirect('/signin');
};

module.exports.isUser=async(req,res,next)=>{
    try {
        let{id}=req.params;
        let listing= await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing does not exist!");
            return res.redirect("/listings");
        }
        const currentUserId = req.user?._id || res.locals.currentUser?._id;
        if (!currentUserId || !listing.user.equals(currentUserId)) {
            req.flash("error","You are not the Owner!");
            return res.redirect(`/listings/${id}`);
        }
        next();
    } catch (err) {
        req.flash("error", "Invalid listing reference!");
        return res.redirect("/listings");
    }
};

module.exports.isReviewOwner=async(req,res,next)=>{
    try {
        let{id,reviewId}=req.params;
        let review= await Review.findById(reviewId);
        if (!review) {
            req.flash("error", "Review does not exist!");
            return res.redirect(`/listings/${id}`);
        }
        const currentUserId = req.user?._id || res.locals.currentUser?._id;
        if (!currentUserId || !review.owner.equals(currentUserId)) {
            req.flash("error","You are not the Owner!");
            return res.redirect(`/listings/${id}`);
        }
        next();
    } catch (err) {
        req.flash("error", "Invalid review reference!");
        return res.redirect(`/listings/${id}`);
    }
};