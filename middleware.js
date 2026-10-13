const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

// Helper to determine if the incoming request expects a JSON API response
const isApiRequest = (req) => {
    if (!req) return false;
    const url = req.originalUrl || req.url || "";
    return (
        url.startsWith("/api") ||
        Boolean(req.xhr) ||
        Boolean(req.headers?.accept && req.headers.accept.includes("application/json")) ||
        Boolean(req.headers?.["content-type"] && req.headers["content-type"].includes("application/json"))
    );
};

module.exports.isApiRequest = isApiRequest;

// Middleware to verify user is authenticated
module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();

    if (isApiRequest(req)) {
        return res.status(401).json({
            success: false,
            status: 401,
            message: "Authentication required. Please sign in to continue."
        });
    }

    req.flash("error", "You must be signed in first!");
    return res.redirect("/signin");
};

// Middleware to verify user owns the listing before mutation
module.exports.isUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).select("_id user");

        if (!listing) {
            if (isApiRequest(req)) {
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: "Listing not found."
                });
            }
            req.flash("error", "Listing does not exist!");
            return res.redirect("/listings");
        }

        const currentUserId = req.user?._id || res.locals.currentUser?._id;
        const listingOwnerId = listing.user?._id ? listing.user._id.toString() : listing.user?.toString();

        if (!currentUserId || listingOwnerId !== currentUserId.toString()) {
            if (isApiRequest(req)) {
                return res.status(403).json({
                    success: false,
                    status: 403,
                    message: "Forbidden: You are not authorized to modify this listing."
                });
            }
            req.flash("error", "You are not the Owner!");
            return res.redirect(`/listings/${id}`);
        }

        req.listing = listing;
        next();
    } catch (err) {
        if (isApiRequest(req)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Invalid listing ID format."
            });
        }
        req.flash("error", "Invalid listing reference!");
        return res.redirect("/listings");
    }
};

// Middleware to verify user owns the review before mutation
module.exports.isReviewOwner = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;
        const review = await Review.findById(reviewId).select("_id owner");

        if (!review) {
            if (isApiRequest(req)) {
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: "Review not found."
                });
            }
            req.flash("error", "Review does not exist!");
            return res.redirect(`/listings/${id}`);
        }

        const currentUserId = req.user?._id || res.locals.currentUser?._id;
        const reviewOwnerId = review.owner?._id ? review.owner._id.toString() : review.owner?.toString();

        if (!currentUserId || reviewOwnerId !== currentUserId.toString()) {
            if (isApiRequest(req)) {
                return res.status(403).json({
                    success: false,
                    status: 403,
                    message: "Forbidden: You are not authorized to modify this review."
                });
            }
            req.flash("error", "You are not the Owner!");
            return res.redirect(`/listings/${id}`);
        }

        req.review = review;
        next();
    } catch (err) {
        if (isApiRequest(req)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Invalid review ID format."
            });
        }
        req.flash("error", "Invalid review reference!");
        return res.redirect(`/listings/${id}`);
    }
};