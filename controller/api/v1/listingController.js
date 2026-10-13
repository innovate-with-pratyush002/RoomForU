const Listing = require("../../../models/listing.js");
const Review = require("../../../models/review.js");
const ExpressError = require("../../../utils/ExpressError.js");

// Formatter to provide clean, normalized responses compatible with both Next.js frontend and standard REST clients
const formatListingResponse = (listing) => {
    if (!listing) return null;
    const doc = listing.toObject ? listing.toObject({ virtuals: true }) : { ...listing };

    const imageUrl =
        doc.image?.url ||
        (typeof doc.image === "string" ? doc.image : null) ||
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";

    const phone = doc.contact?.phone || "";
    const ownerName = doc.user?.name || "Host";
    const lon = doc.mapCoordinates?.coordinates?.[0] ?? 77.2090;
    const lat = doc.mapCoordinates?.coordinates?.[1] ?? 28.6139;

    const ownerId = doc.user?._id ? doc.user._id.toString() : (doc.user ? doc.user.toString() : null);

    // Format nested reviews if populated
    const reviews = (doc.reviews || []).map((rev) => {
        if (!rev) return null;
        if (typeof rev === "object" && rev._id) {
            const revOwnerId = rev.owner?._id ? rev.owner._id.toString() : (rev.owner ? rev.owner.toString() : null);
            return {
                id: rev._id.toString(),
                _id: rev._id.toString(),
                comment: rev.comment,
                rating: rev.rating,
                owner: rev.owner?.name || (typeof rev.owner === "string" ? rev.owner : "Anonymous"),
                ownerId: revOwnerId,
                ownerDetails: rev.owner && typeof rev.owner === "object" ? {
                    id: revOwnerId,
                    _id: revOwnerId,
                    name: rev.owner.name,
                    picture: rev.owner.picture
                } : null,
                createdAt: rev.createdAt
            };
        }
        return rev;
    }).filter(Boolean);

    return {
        ...doc,
        id: doc._id.toString(),
        userId: ownerId,
        user: doc.user && typeof doc.user === "object" ? {
            id: ownerId,
            _id: ownerId,
            name: doc.user.name,
            email: doc.user.email,
            picture: doc.user.picture
        } : ownerId,
        image: imageUrl, // String URL expected by frontend components
        imageUrl: imageUrl,
        phone: phone,
        owner: ownerName,
        coordinates: { lat, lon },
        reviews
    };
};

// GET /api/v1/listings
module.exports.getAllListings = async (req, res, next) => {
    try {
        const {
            search,
            roomType,
            preferredTenant,
            availabilityStatus,
            minPrice,
            maxPrice,
            location,
            state,
            sort = "newest",
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // Flexible search across title, location, state, and description
        if (search && search.trim()) {
            const term = search.trim();
            const searchRegex = { $regex: term, $options: "i" };
            filter.$or = [
                { title: searchRegex },
                { location: searchRegex },
                { state: searchRegex },
                { description: searchRegex }
            ];
        }

        // Room and Tenant filters
        if (roomType) filter.roomType = roomType;
        if (preferredTenant) filter.preferredTenant = preferredTenant;
        if (availabilityStatus) filter.availabilityStatus = availabilityStatus;

        // Location filters (case-insensitive substring)
        if (location) filter.location = { $regex: location.trim(), $options: "i" };
        if (state) filter.state = { $regex: state.trim(), $options: "i" };

        // Price range
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") sortOption = { price: 1 };
        if (sort === "price_desc") sortOption = { price: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [total, listings] = await Promise.all([
            Listing.countDocuments(filter),
            Listing.find(filter)
                .populate("user", "name email picture")
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
        ]);

        return res.status(200).json({
            success: true,
            status: 200,
            count: listings.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            data: listings.map(formatListingResponse)
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/v1/listings/:id
module.exports.getListingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: { path: "owner", select: "name picture" }
            })
            .populate("user", "name email picture");

        if (!listing) {
            throw new ExpressError(404, "Listing not found.");
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: formatListingResponse(listing)
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/listings
module.exports.createListing = async (req, res, next) => {
    try {
        // Accept payload either directly or nested under place (for form compatibility)
        const payload = req.body.place || req.body;

        const {
            title,
            description,
            price,
            location,
            state,
            roomType,
            preferredTenant,
            availabilityStatus = "Available"
        } = payload;

        // Contact phone resolution
        const contactPhone = typeof payload.contact === "object" ? payload.contact.phone : (payload.contact || payload.phone);

        if (!title || !price || !location || !state || !roomType || !preferredTenant || !contactPhone) {
            throw new ExpressError(400, "Missing required listing fields: title, price, location, state, roomType, preferredTenant, and contact phone are required.");
        }

        // Coordinates resolution
        let coordinates = [77.2090, 28.6139]; // Default coordinates (Delhi)
        if (payload.mapCoordinates && Array.isArray(payload.mapCoordinates.coordinates)) {
            coordinates = payload.mapCoordinates.coordinates;
        } else if (payload.coordinates && typeof payload.coordinates === "object") {
            const lon = parseFloat(payload.coordinates.lon);
            const lat = parseFloat(payload.coordinates.lat);
            if (!isNaN(lon) && !isNaN(lat)) coordinates = [lon, lat];
        } else if (payload.lon !== undefined && payload.lat !== undefined) {
            const lon = parseFloat(payload.lon);
            const lat = parseFloat(payload.lat);
            if (!isNaN(lon) && !isNaN(lat)) coordinates = [lon, lat];
        }

        // Image resolution
        let url = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";
        let fileName = "default-room";

        if (req.file) {
            url = req.file.path;
            fileName = req.file.filename;
        } else if (payload.imageUrl || payload.image) {
            url = payload.imageUrl || (typeof payload.image === "string" ? payload.image : payload.image?.url) || url;
        }

        const newListing = new Listing({
            title: title.trim(),
            description: (description || "").trim(),
            price: Number(price),
            location: location.trim(),
            state: state.trim(),
            roomType,
            preferredTenant,
            availabilityStatus,
            contact: { phone: String(contactPhone).trim() },
            user: req.user._id,
            image: { url, fileName },
            mapCoordinates: {
                type: "Point",
                coordinates
            }
        });

        await newListing.save();

        const populatedListing = await Listing.findById(newListing._id).populate("user", "name email picture");

        return res.status(201).json({
            success: true,
            status: 201,
            message: "Listing created successfully.",
            data: formatListingResponse(populatedListing)
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/v1/listings/:id & PATCH /api/v1/listings/:id
module.exports.updateListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body.place || req.body;

        const updateData = {};
        if (payload.title !== undefined) updateData.title = payload.title.trim();
        if (payload.description !== undefined) updateData.description = payload.description.trim();
        if (payload.price !== undefined) updateData.price = Number(payload.price);
        if (payload.location !== undefined) updateData.location = payload.location.trim();
        if (payload.state !== undefined) updateData.state = payload.state.trim();
        if (payload.roomType !== undefined) updateData.roomType = payload.roomType;
        if (payload.preferredTenant !== undefined) updateData.preferredTenant = payload.preferredTenant;
        if (payload.availabilityStatus !== undefined) updateData.availabilityStatus = payload.availabilityStatus;

        const contactPhone = typeof payload.contact === "object" ? payload.contact.phone : (payload.contact || payload.phone);
        if (contactPhone !== undefined) {
            updateData.contact = { phone: String(contactPhone).trim() };
        }

        // Coordinates resolution
        if (payload.mapCoordinates && Array.isArray(payload.mapCoordinates.coordinates)) {
            updateData.mapCoordinates = payload.mapCoordinates;
        } else if (payload.coordinates && typeof payload.coordinates === "object") {
            const lon = parseFloat(payload.coordinates.lon);
            const lat = parseFloat(payload.coordinates.lat);
            if (!isNaN(lon) && !isNaN(lat)) {
                updateData.mapCoordinates = { type: "Point", coordinates: [lon, lat] };
            }
        } else if (payload.lon !== undefined && payload.lat !== undefined) {
            const lon = parseFloat(payload.lon);
            const lat = parseFloat(payload.lat);
            if (!isNaN(lon) && !isNaN(lat)) {
                updateData.mapCoordinates = { type: "Point", coordinates: [lon, lat] };
            }
        }

        if (req.file) {
            updateData.image = {
                url: req.file.path,
                fileName: req.file.filename
            };
        } else if (payload.imageUrl) {
            updateData.image = {
                url: payload.imageUrl,
                fileName: "custom-image"
            };
        } else if (typeof payload.image === "string" && payload.image.startsWith("http")) {
            updateData.image = {
                url: payload.image,
                fileName: "custom-image"
            };
        }

        const updatedListing = await Listing.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        })
            .populate({
                path: "reviews",
                populate: { path: "owner", select: "name picture" }
            })
            .populate("user", "name email picture");

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Listing updated successfully.",
            data: formatListingResponse(updatedListing)
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/listings/:id
module.exports.deleteListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Listing and associated reviews deleted successfully."
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/listings/:id/reviews
module.exports.createReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payload = req.body.review || req.body;
        const { comment, rating } = payload;

        if (!comment || rating === undefined) {
            throw new ExpressError(400, "Review comment and rating (1-5) are required.");
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new ExpressError(400, "Rating must be a number between 1 and 5.");
        }

        const listing = await Listing.findById(id);
        if (!listing) {
            throw new ExpressError(404, "Listing not found.");
        }

        const newReview = new Review({
            comment: comment.trim(),
            rating: Math.round(ratingNum),
            owner: req.user._id
        });

        listing.reviews.push(newReview._id);

        await Promise.all([newReview.save(), listing.save()]);

        const populatedReview = await Review.findById(newReview._id).populate("owner", "name picture");

        return res.status(201).json({
            success: true,
            status: 201,
            message: "Review added successfully.",
            data: {
                id: populatedReview._id.toString(),
                _id: populatedReview._id.toString(),
                comment: populatedReview.comment,
                rating: populatedReview.rating,
                owner: populatedReview.owner?.name || "Anonymous",
                ownerId: req.user._id.toString(),
                ownerDetails: populatedReview.owner,
                createdAt: populatedReview.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/v1/listings/:id/reviews/:reviewId
module.exports.deleteReview = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        await Promise.all([
            Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }),
            Review.findByIdAndDelete(reviewId)
        ]);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Review deleted successfully."
        });
    } catch (err) {
        next(err);
    }
};
