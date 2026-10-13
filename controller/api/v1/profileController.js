const Listing = require("../../../models/listing.js");
const UserAuth = require("../../../models/authentication.js");
const ExpressError = require("../../../utils/ExpressError.js");

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
