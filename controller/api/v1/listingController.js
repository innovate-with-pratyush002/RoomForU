const Listing = require("../../../models/listing.js");
const Review = require("../../../models/review.js");
const ExpressError = require("../../../utils/ExpressError.js");
const { destroyCloudinaryImage } = require("../../../cloudConfig.js");

// Escape regex special characters to prevent ReDoS and query crashes
const escapeRegex = (string) => {
    return typeof string === "string" ? string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
};

// Validate geographical coordinates
const isValidCoordinates = (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) return false;
    const [lon, lat] = coords;
    return (
        typeof lon === "number" &&
        typeof lat === "number" &&
        !isNaN(lon) &&
        !isNaN(lat) &&
        lon >= -180 &&
        lon <= 180 &&
        lat >= -90 &&
        lat <= 90
    );
};

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

    const listingType = doc.listingType || "PG";
    const hostelFor = doc.hostelFor || null;
    const roomSharingType = doc.roomSharingType || null;
    const availableBeds = doc.availableBeds !== undefined && doc.availableBeds !== null ? Number(doc.availableBeds) : null;
    const foodFacility = doc.foodFacility || null;

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
        listingType,
        hostelFor,
        roomSharingType,
        availableBeds,
        foodFacility,
        rentPerBed: listingType === "Hostel" ? doc.price : null,
        reviews
    };
};

// GET /api/v1/listings
module.exports.getAllListings = async (req, res, next) => {
    try {
        const {
            search,
            listingType,
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

        // Listing Type filter (All, PG, Hostel)
        if (typeof listingType === "string") {
            const cleanType = listingType.trim();
            if (cleanType === "Hostel") {
                filter.listingType = "Hostel";
            } else if (cleanType === "PG") {
                filter.listingType = { $in: ["PG", null] };
            }
        }

        // Safe flexible search with escaped regex to prevent ReDoS / query crashes
        if (typeof search === "string" && search.trim()) {
            const escapedTerm = escapeRegex(search.trim());
            const searchRegex = { $regex: escapedTerm, $options: "i" };
            filter.$or = [
                { title: searchRegex },
                { location: searchRegex },
                { state: searchRegex },
                { description: searchRegex },
                { roomSharingType: searchRegex },
                { hostelFor: searchRegex },
                { foodFacility: searchRegex }
            ];
        }

        // Room and Tenant filters with strict enum type coercion to prevent NoSQL operator injection
        const allowedRoomTypes = ["Single", "Double", "Shared", "Single Room", "Shared Room", "1 BHK", "2 BHK", "3 BHK", "PG"];
        if (typeof roomType === "string" && allowedRoomTypes.includes(roomType.trim())) {
            filter.roomType = roomType.trim();
        }

        const allowedTenantTypes = ["Boys", "Girls", "Any", "Students", "Working Professionals", "Family"];
        if (typeof preferredTenant === "string" && allowedTenantTypes.includes(preferredTenant.trim())) {
            filter.preferredTenant = preferredTenant.trim();
        }

        const allowedAvailability = ["Available", "Booked", "Rented"];
        if (typeof availabilityStatus === "string" && allowedAvailability.includes(availabilityStatus.trim())) {
            filter.availabilityStatus = availabilityStatus.trim();
        }

        // Location filters with escaped substrings
        if (typeof location === "string" && location.trim()) {
            filter.location = { $regex: escapeRegex(location.trim()), $options: "i" };
        }
        if (typeof state === "string" && state.trim()) {
            filter.state = { $regex: escapeRegex(state.trim()), $options: "i" };
        }

        // Price range
        const parsedMin = minPrice !== undefined ? Number(minPrice) : null;
        const parsedMax = maxPrice !== undefined ? Number(maxPrice) : null;
        if ((parsedMin !== null && !isNaN(parsedMin)) || (parsedMax !== null && !isNaN(parsedMax))) {
            filter.price = {};
            if (parsedMin !== null && !isNaN(parsedMin)) filter.price.$gte = parsedMin;
            if (parsedMax !== null && !isNaN(parsedMax)) filter.price.$lte = parsedMax;
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
                .select("title price location state roomType preferredTenant availabilityStatus image user createdAt mapCoordinates listingType hostelFor roomSharingType availableBeds foodFacility")
                .populate("user", "name picture") // Privacy: Do not leak host personal email on public feed
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean()
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
            .populate("user", "name email picture")
            .lean();

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
        const listingType = payload.listingType === "Hostel" ? "Hostel" : "PG";

        const {
            title,
            description,
            price,
            location,
            state,
            // PG fields
            roomType,
            preferredTenant,
            // Hostel fields
            hostelFor,
            roomSharingType,
            availableBeds,
            foodFacility,
            availabilityStatus = "Available"
        } = payload;

        // Contact phone resolution
        const contactPhone = typeof payload.contact === "object" ? payload.contact.phone : (payload.contact || payload.phone);

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
        if (!isValidCoordinates(coordinates)) {
            coordinates = [77.2090, 28.6139];
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

        // Common validations
        if (!title || price === undefined || !location || !state || !contactPhone) {
            throw new ExpressError(400, "Title, price, location, state, and contact phone are required.");
        }
        if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 200) {
            throw new ExpressError(400, "Title must be between 3 and 200 characters.");
        }
        if (description && (typeof description !== "string" || description.trim().length > 5000)) {
            throw new ExpressError(400, "Description cannot exceed 5000 characters.");
        }
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 10000000) {
            throw new ExpressError(400, "Price must be a valid positive number up to 10,000,000.");
        }
        if (typeof location !== "string" || location.trim().length < 2 || location.trim().length > 100) {
            throw new ExpressError(400, "Location must be between 2 and 100 characters.");
        }
        if (typeof state !== "string" || state.trim().length < 2 || state.trim().length > 100) {
            throw new ExpressError(400, "State must be between 2 and 100 characters.");
        }
        const cleanPhone = String(contactPhone).trim();
        if (cleanPhone.length < 7 || cleanPhone.length > 20) {
            throw new ExpressError(400, "Contact phone must be between 7 and 20 characters.");
        }

        let newListing;

        if (listingType === "Hostel") {
            // Specific Hostel Validations
            if (!hostelFor || !roomSharingType || availableBeds === undefined || !foodFacility) {
                throw new ExpressError(400, "Hostel for (Boys/Girls/Co-ed), room sharing type, available beds, and food facility are required for hostel listings.");
            }
            const validHostelFor = ["Boys", "Girls", "Co-ed"];
            if (!validHostelFor.includes(hostelFor)) {
                throw new ExpressError(400, `Invalid hostelFor. Allowed: ${validHostelFor.join(", ")}`);
            }
            const validSharing = ["Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing", "5–6 Sharing", "Dormitory"];
            if (!validSharing.includes(roomSharingType)) {
                throw new ExpressError(400, `Invalid roomSharingType. Allowed: ${validSharing.join(", ")}`);
            }
            const numBeds = Number(availableBeds);
            if (isNaN(numBeds) || numBeds < 0 || numBeds > 10000) {
                throw new ExpressError(400, "Available beds must be a non-negative number.");
            }
            const validFood = ["Included in Rent", "Available at Extra Cost", "Not Available"];
            if (!validFood.includes(foodFacility)) {
                throw new ExpressError(400, `Invalid foodFacility. Allowed: ${validFood.join(", ")}`);
            }

            newListing = new Listing({
                listingType: "Hostel",
                title: title.trim(),
                description: (description || "").trim(),
                price: numericPrice,
                location: location.trim(),
                state: state.trim(),
                hostelFor,
                roomSharingType,
                availableBeds: numBeds,
                foodFacility,
                // Fallbacks for general filters
                roomType: roomSharingType,
                preferredTenant: hostelFor === "Co-ed" ? "Any" : hostelFor,
                availabilityStatus: numBeds > 0 ? "Available" : "Booked",
                contact: { phone: cleanPhone },
                user: req.user._id,
                image: { url, fileName },
                mapCoordinates: {
                    type: "Point",
                    coordinates
                }
            });
        } else {
            // Specific PG Validations
            if (!roomType || !preferredTenant) {
                throw new ExpressError(400, "Missing required PG listing fields: roomType and preferredTenant are required.");
            }
            const validRoomTypes = ["Single", "Double", "Shared", "Single Room", "Shared Room", "1 BHK", "2 BHK", "3 BHK", "PG"];
            if (!validRoomTypes.includes(roomType)) {
                throw new ExpressError(400, `Invalid roomType. Allowed: ${validRoomTypes.join(", ")}`);
            }
            const validTenants = ["Boys", "Girls", "Any", "Students", "Working Professionals", "Family"];
            if (!validTenants.includes(preferredTenant)) {
                throw new ExpressError(400, `Invalid preferredTenant. Allowed: ${validTenants.join(", ")}`);
            }
            const validStatus = ["Available", "Rented", "Booked"];
            if (!validStatus.includes(availabilityStatus)) {
                throw new ExpressError(400, `Invalid availabilityStatus. Allowed: ${validStatus.join(", ")}`);
            }

            newListing = new Listing({
                listingType: "PG",
                title: title.trim(),
                description: (description || "").trim(),
                price: numericPrice,
                location: location.trim(),
                state: state.trim(),
                roomType,
                preferredTenant,
                availabilityStatus,
                contact: { phone: cleanPhone },
                user: req.user._id,
                image: { url, fileName },
                mapCoordinates: {
                    type: "Point",
                    coordinates
                }
            });
        }

        await newListing.save();

        const populatedListing = await Listing.findById(newListing._id).populate("user", "name email picture");

        return res.status(201).json({
            success: true,
            status: 201,
            message: `${listingType} listing created successfully.`,
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
        // Preserve immutable listing category
        updateData.listingType = req.listing?.listingType || "PG";
        if (payload.title !== undefined) {
            if (typeof payload.title !== "string" || payload.title.trim().length < 3 || payload.title.trim().length > 200) {
                throw new ExpressError(400, "Title must be between 3 and 200 characters.");
            }
            updateData.title = payload.title.trim();
        }
        if (payload.description !== undefined) {
            if (typeof payload.description !== "string" || payload.description.trim().length > 5000) {
                throw new ExpressError(400, "Description cannot exceed 5000 characters.");
            }
            updateData.description = payload.description.trim();
        }
        if (payload.price !== undefined) {
            const numPrice = Number(payload.price);
            if (isNaN(numPrice) || numPrice <= 0 || numPrice > 10000000) {
                throw new ExpressError(400, "Price must be a valid positive number up to 10,000,000.");
            }
            updateData.price = numPrice;
        }
        if (payload.location !== undefined) {
            if (typeof payload.location !== "string" || payload.location.trim().length < 2 || payload.location.trim().length > 100) {
                throw new ExpressError(400, "Location must be between 2 and 100 characters.");
            }
            updateData.location = payload.location.trim();
        }
        if (payload.state !== undefined) {
            if (typeof payload.state !== "string" || payload.state.trim().length < 2 || payload.state.trim().length > 100) {
                throw new ExpressError(400, "State must be between 2 and 100 characters.");
            }
            updateData.state = payload.state.trim();
        }

        // PG specific updates
        if (payload.roomType !== undefined) {
            const validRoomTypes = ["Single", "Double", "Shared", "Single Room", "Shared Room", "1 BHK", "2 BHK", "3 BHK", "PG"];
            if (!validRoomTypes.includes(payload.roomType)) {
                throw new ExpressError(400, `Invalid roomType. Allowed: ${validRoomTypes.join(", ")}`);
            }
            updateData.roomType = payload.roomType;
        }
        if (payload.preferredTenant !== undefined) {
            const validTenants = ["Boys", "Girls", "Any", "Students", "Working Professionals", "Family"];
            if (!validTenants.includes(payload.preferredTenant)) {
                throw new ExpressError(400, `Invalid preferredTenant. Allowed: ${validTenants.join(", ")}`);
            }
            updateData.preferredTenant = payload.preferredTenant;
        }

        // Hostel specific updates
        if (payload.hostelFor !== undefined) {
            const validHostelFor = ["Boys", "Girls", "Co-ed"];
            if (!validHostelFor.includes(payload.hostelFor)) {
                throw new ExpressError(400, `Invalid hostelFor. Allowed: ${validHostelFor.join(", ")}`);
            }
            updateData.hostelFor = payload.hostelFor;
        }
        if (payload.roomSharingType !== undefined) {
            const validSharing = ["Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing", "5–6 Sharing", "Dormitory"];
            if (!validSharing.includes(payload.roomSharingType)) {
                throw new ExpressError(400, `Invalid roomSharingType. Allowed: ${validSharing.join(", ")}`);
            }
            updateData.roomSharingType = payload.roomSharingType;
        }
        if (payload.availableBeds !== undefined) {
            const numBeds = Number(payload.availableBeds);
            if (isNaN(numBeds) || numBeds < 0 || numBeds > 10000) {
                throw new ExpressError(400, "Available beds must be a non-negative number.");
            }
            updateData.availableBeds = numBeds;
            if (numBeds === 0 && !payload.availabilityStatus) {
                updateData.availabilityStatus = "Booked";
            }
        }
        if (payload.foodFacility !== undefined) {
            const validFood = ["Included in Rent", "Available at Extra Cost", "Not Available"];
            if (!validFood.includes(payload.foodFacility)) {
                throw new ExpressError(400, `Invalid foodFacility. Allowed: ${validFood.join(", ")}`);
            }
            updateData.foodFacility = payload.foodFacility;
        }

        if (payload.availabilityStatus !== undefined) {
            const validStatus = ["Available", "Rented", "Booked"];
            if (!validStatus.includes(payload.availabilityStatus)) {
                throw new ExpressError(400, `Invalid availabilityStatus. Allowed: ${validStatus.join(", ")}`);
            }
            updateData.availabilityStatus = payload.availabilityStatus;
        }

        const contactPhone = typeof payload.contact === "object" ? payload.contact.phone : (payload.contact || payload.phone);
        if (contactPhone !== undefined) {
            const cleanPhone = String(contactPhone).trim();
            if (cleanPhone.length < 7 || cleanPhone.length > 20) {
                throw new ExpressError(400, "Contact phone must be between 7 and 20 characters.");
            }
            updateData.contact = { phone: cleanPhone };
        }

        // Coordinates resolution
        let updateCoords = null;
        if (payload.mapCoordinates && Array.isArray(payload.mapCoordinates.coordinates)) {
            updateCoords = payload.mapCoordinates.coordinates;
        } else if (payload.coordinates && typeof payload.coordinates === "object") {
            const lon = parseFloat(payload.coordinates.lon);
            const lat = parseFloat(payload.coordinates.lat);
            if (!isNaN(lon) && !isNaN(lat)) {
                updateCoords = [lon, lat];
            }
        } else if (payload.lon !== undefined && payload.lat !== undefined) {
            const lon = parseFloat(payload.lon);
            const lat = parseFloat(payload.lat);
            if (!isNaN(lon) && !isNaN(lat)) {
                updateCoords = [lon, lat];
            }
        }
        if (updateCoords && isValidCoordinates(updateCoords)) {
            updateData.mapCoordinates = { type: "Point", coordinates: updateCoords };
        }

        if (req.file) {
            // Delete old Cloudinary image to prevent orphaned storage leaks
            const existingListing = await Listing.findById(id).select("image").lean();
            if (existingListing?.image?.fileName) {
                await destroyCloudinaryImage(existingListing.image.fileName);
            }

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

        if (typeof comment !== "string" || comment.trim().length === 0 || comment.trim().length > 1000) {
            throw new ExpressError(400, "Review comment must be between 1 and 1000 characters.");
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
            Listing.updateMany({ reviews: reviewId }, { $pull: { reviews: reviewId } }),
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
