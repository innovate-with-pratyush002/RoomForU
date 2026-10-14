const mongoose = require("mongoose");
const UserAuth = require("../models/authentication.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { destroyCloudinaryImage } = require("../cloudConfig.js");
const ExpressError = require("../utils/ExpressError.js");

/**
 * Account Service
 * Provides centralized, manageable, and production-grade logic for user account operations,
 * specifically cascading deletions across all associated models and external resources (e.g. Cloudinary).
 */
class AccountService {
    /**
     * Delete all listings owned by a user, including:
     * - Deleting their associated images from Cloudinary
     * - Deleting all reviews posted on these listings
     * - Deleting the listing documents themselves
     *
     * @param {mongoose.Types.ObjectId|string} userId
     * @returns {Promise<{ deletedListingsCount: number, deletedListingReviewsCount: number, imagesDestroyedCount: number }>}
     */
    async deleteUserListings(userId) {
        const userListings = await Listing.find({ user: userId }).select("_id image reviews").lean();
        if (!userListings || userListings.length === 0) {
            return {
                deletedListingsCount: 0,
                deletedListingReviewsCount: 0,
                imagesDestroyedCount: 0
            };
        }

        const listingIds = userListings.map((listing) => listing._id);

        // 1. Collect all review IDs posted on these listings to delete from Review collection
        const allListingReviewIds = userListings.reduce((acc, listing) => {
            if (Array.isArray(listing.reviews) && listing.reviews.length > 0) {
                acc.push(...listing.reviews);
            }
            return acc;
        }, []);

        let deletedListingReviewsCount = 0;
        if (allListingReviewIds.length > 0) {
            const reviewDeleteResult = await Review.deleteMany({ _id: { $in: allListingReviewIds } });
            deletedListingReviewsCount = reviewDeleteResult.deletedCount || 0;
        }

        // 2. Collect Cloudinary asset filenames to destroy
        const imageFileNames = userListings
            .map((listing) => listing.image?.fileName)
            .filter((fileName) => Boolean(fileName) && fileName !== "default-room" && fileName !== "custom-image");

        if (imageFileNames.length > 0) {
            // Delete asynchronously without breaking transaction/flow on partial network failure
            await Promise.allSettled(imageFileNames.map((fileName) => destroyCloudinaryImage(fileName)));
        }

        // 3. Delete all listings owned by the user
        const listingDeleteResult = await Listing.deleteMany({ _id: { $in: listingIds } });

        return {
            deletedListingsCount: listingDeleteResult.deletedCount || 0,
            deletedListingReviewsCount,
            imagesDestroyedCount: imageFileNames.length
        };
    }

    /**
     * Delete all reviews authored by this user across ANY listings in the platform:
     * - Removes the review references from the respective listings
     * - Deletes the review documents from the Review collection
     *
     * @param {mongoose.Types.ObjectId|string} userId
     * @returns {Promise<{ deletedAuthoredReviewsCount: number }>}
     */
    async deleteUserAuthoredReviews(userId) {
        const authoredReviews = await Review.find({ owner: userId }).select("_id").lean();
        if (!authoredReviews || authoredReviews.length === 0) {
            return { deletedAuthoredReviewsCount: 0 };
        }

        const authoredReviewIds = authoredReviews.map((r) => r._id);

        // 1. Pull review references from any listings that contain them
        await Listing.updateMany(
            { reviews: { $in: authoredReviewIds } },
            { $pull: { reviews: { $in: authoredReviewIds } } }
        );

        // 2. Delete the reviews from the Review collection
        const reviewDeleteResult = await Review.deleteMany({ _id: { $in: authoredReviewIds } });

        return {
            deletedAuthoredReviewsCount: reviewDeleteResult.deletedCount || 0
        };
    }

    /**
     * Clean up session records in MongoDB store for this user (if persistent MongoStore is used)
     *
     * @param {mongoose.Types.ObjectId|string} userId
     * @returns {Promise<{ clearedSessionsCount: number }>}
     */
    async purgeUserSessions(userId) {
        try {
            if (mongoose.connection && mongoose.connection.collection) {
                const sessionsCol = mongoose.connection.collection("sessions");
                const result = await sessionsCol.deleteMany({
                    session: { $regex: String(userId) }
                });
                return { clearedSessionsCount: result.deletedCount || 0 };
            }
        } catch (err) {
            console.warn("Notice: Session cleanup encountered non-fatal notice:", err.message);
        }
        return { clearedSessionsCount: 0 };
    }

    /**
     * Permanently deletes a user account and ALL associated platform data:
     * 1. Listings and associated Cloudinary media
     * 2. Reviews on user listings
     * 3. Reviews written by user on other listings (with ref removal)
     * 4. User profile and authentication record
     * 5. Active database sessions
     *
     * Extensible for future features (e.g. bookings, bookmarks, notifications).
     *
     * @param {mongoose.Types.ObjectId|string} userId
     * @returns {Promise<Object>} Comprehensive summary of deleted data
     */
    async deleteUserAccount(userId) {
        if (!userId) {
            throw new ExpressError(400, "User ID is required for account deletion.");
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Verify user exists
        const user = await UserAuth.findById(userObjectId);
        if (!user) {
            throw new ExpressError(404, "User account not found.");
        }

        // 2. Delete user's listings, their images, and reviews attached to those listings
        const listingsCleanup = await this.deleteUserListings(userObjectId);

        // 3. Delete reviews written by this user on other listings and remove references
        const authoredReviewsCleanup = await this.deleteUserAuthoredReviews(userObjectId);

        // 4. Hook for future models (e.g., Bookings, Favorites, Messages, Notifications)
        // await this.deleteUserFutureArtifacts(userObjectId);

        // 5. Invalidate persistent session records across all devices
        const sessionCleanup = await this.purgeUserSessions(userObjectId);

        // 6. Delete the User authentication & profile document from the database
        await UserAuth.findByIdAndDelete(userObjectId);

        return {
            success: true,
            user: {
                id: userObjectId.toString(),
                name: user.name,
                email: user.email,
                username: user.username
            },
            summary: {
                listingsDeleted: listingsCleanup.deletedListingsCount,
                imagesDestroyed: listingsCleanup.imagesDestroyedCount,
                listingReviewsDeleted: listingsCleanup.deletedListingReviewsCount,
                authoredReviewsDeleted: authoredReviewsCleanup.deletedAuthoredReviewsCount,
                sessionsCleared: sessionCleanup.clearedSessionsCount
            }
        };
    }
}

module.exports = new AccountService();
