const Listing = require("../../../models/listing.js");
const UserAuth = require("../../../models/authentication.js");
const ExpressError = require("../../../utils/ExpressError.js");
const accountService = require("../../../services/accountService.js");

// GET /api/v1/profile
module.exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const [userData, userListings] = await Promise.all([
            UserAuth.findById(userId).select("-hash -salt").lean(),
            Listing.find({ user: userId })
                .select("title price location state roomType preferredTenant availabilityStatus image contact mapCoordinates createdAt")
                .sort({ createdAt: -1 })
                .lean()
        ]);

        if (!userData) {
            throw new ExpressError(404, "User profile not found.");
        }

        const formattedListings = userListings.map((listing) => {
            const doc = listing.toObject ? listing.toObject({ virtuals: true }) : { ...listing };
            const imageUrl =
                doc.image?.url ||
                (typeof doc.image === "string" ? doc.image : null) ||
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";

            return {
                ...doc,
                id: doc._id.toString(),
                image: imageUrl,
                imageUrl,
                phone: doc.contact?.phone || "",
                owner: userData.name,
                coordinates: {
                    lat: doc.mapCoordinates?.coordinates?.[1] ?? 28.6139,
                    lon: doc.mapCoordinates?.coordinates?.[0] ?? 77.2090
                }
            };
        });

        return res.status(200).json({
            success: true,
            status: 200,
            user: {
                id: userData._id.toString(),
                name: userData.name,
                email: userData.email,
                username: userData.username,
                picture: userData.picture || null,
                createdAt: userData.createdAt
            },
            listingsCount: formattedListings.length,
            listings: formattedListings
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/v1/profile
 * Permanently deletes the authenticated user's account and all associated data
 * (profile, listings, uploaded images, reviews on listings, reviews authored on other listings, and sessions).
 */
module.exports.deleteUserAccount = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ExpressError(401, "Authentication required to perform account deletion.");
        }

        const { confirmation, password } = req.body || {};

        // Find the user to verify existence and confirmation text
        const user = await UserAuth.findById(userId);
        if (!user) {
            throw new ExpressError(404, "User account not found.");
        }

        // Verify confirmation input if provided
        const trimmedConfirmation = typeof confirmation === "string" ? confirmation.trim() : "";
        const isDeletePhrase = trimmedConfirmation.toUpperCase() === "DELETE";
        const isUsernameMatch = user.username && trimmedConfirmation.toLowerCase() === user.username.toLowerCase();
        const isEmailMatch = user.email && trimmedConfirmation.toLowerCase() === user.email.toLowerCase();

        // Optional password verification if account uses local password
        if (password && typeof user.authenticate === "function") {
            const authResult = await new Promise((resolve) => {
                user.authenticate(password, (authErr, authenticatedUser) => {
                    resolve(!authErr && Boolean(authenticatedUser));
                });
            });
            if (!authResult && !isDeletePhrase) {
                throw new ExpressError(400, "Incorrect password provided for account deletion.");
            }
        } else if (confirmation !== undefined && !isDeletePhrase && !isUsernameMatch && !isEmailMatch) {
            throw new ExpressError(400, "Please confirm deletion by typing DELETE or your username.");
        }

        // Perform cascading deletion across all collections and Cloudinary
        const deletionSummary = await accountService.deleteUserAccount(userId);

        // Terminate Passport session and invalidate cookies
        req.logout((logoutErr) => {
            if (logoutErr) {
                console.error("Passport logout error during account deletion:", logoutErr);
            }

            const cookieName = process.env.SESSION_COOKIE_NAME || "roomforu.sid";

            const sendResponse = () => {
                res.clearCookie(cookieName, { path: "/" });
                res.clearCookie("connect.sid", { path: "/" });

                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "Your account and all associated data have been permanently deleted.",
                    data: deletionSummary
                });
            };

            if (req.session) {
                req.session.destroy((destroyErr) => {
                    if (destroyErr) {
                        console.error("Session destroy error during account deletion:", destroyErr);
                    }
                    sendResponse();
                });
            } else {
                sendResponse();
            }
        });
    } catch (err) {
        next(err);
    }
};
