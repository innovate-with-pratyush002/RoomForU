const Listing = require("../models/listing");
const { destroyCloudinaryImage } = require("../cloudConfig");

//route for showing all listings:=>
module.exports.showAllListings = async (req, res) => {
    const allListings = await Listing.find({})
        .select("title price location state roomType preferredTenant availabilityStatus image user createdAt mapCoordinates")
        .sort({ createdAt: -1 })
        .lean();
    res.render("./listings/listing.ejs", { allListings });
};

//add route where we can add a new listing:=> 
module.exports.showform = (req, res) => {
    res.render("listings/addListing.ejs");
};

module.exports.addListing = async (req, res) => {
    const placeData = req.body.place || {};
    const lat = parseFloat(placeData.lat);
    const lon = parseFloat(placeData.lon);

    if (isNaN(lat) || isNaN(lon)) {
        req.flash("error", "Please select a valid location on the map.");
        return res.redirect("/listings/new");
    }

    let url = req.file ? req.file.path : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";
    let fileName = req.file ? req.file.filename : "default-room";

    const newListing = new Listing({
        title: placeData.title,
        description: placeData.description,
        price: placeData.price ? Number(placeData.price) : 0,
        location: placeData.location,
        state: placeData.state,
        roomType: placeData.roomType,
        preferredTenant: placeData.preferredTenant,
        availabilityStatus: placeData.availabilityStatus || "Available",
        contact: {
            phone: placeData.contact
        },
        user: req.user._id,
        image: { url, fileName },
        mapCoordinates: {
            type: "Point",
            coordinates: [lon, lat]
        }
    });

    await newListing.save();
    req.flash("success", "New location added successfully!");
    return res.redirect("/listings");
};

//edit & update route:=>
module.exports.findForUpdate = async (req, res) => {
    let { id } = req.params;
    const Data = await Listing.findById(id);
    if (!Data) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("./listings/edit.ejs", { Data });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const placeData = req.body.place || {};

    // Input whitelist to prevent mass assignment
    const updateData = {};
    if (typeof placeData.title !== "undefined") updateData.title = placeData.title;
    if (typeof placeData.description !== "undefined") updateData.description = placeData.description;
    if (typeof placeData.price !== "undefined") updateData.price = Number(placeData.price);
    if (typeof placeData.location !== "undefined") updateData.location = placeData.location;
    if (typeof placeData.state !== "undefined") updateData.state = placeData.state;
    if (typeof placeData.roomType !== "undefined") updateData.roomType = placeData.roomType;
    if (typeof placeData.preferredTenant !== "undefined") updateData.preferredTenant = placeData.preferredTenant;
    if (typeof placeData.availabilityStatus !== "undefined") updateData.availabilityStatus = placeData.availabilityStatus;
    if (typeof placeData.contact !== "undefined") {
        updateData.contact = { phone: placeData.contact };
    }

    const lat = parseFloat(placeData.lat);
    const lon = parseFloat(placeData.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
        updateData.mapCoordinates = {
            type: "Point",
            coordinates: [lon, lat]
        };
    }

    if (typeof req.file !== "undefined") {
        const existingListing = await Listing.findById(id).select("image").lean();
        if (existingListing?.image?.fileName) {
            await destroyCloudinaryImage(existingListing.image.fileName);
        }
        updateData.image = {
            url: req.file.path,
            fileName: req.file.filename
        };
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedListing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    req.flash("success", "Location Detail Edited!");
    return res.redirect(`/listings/${id}`);
};

//delete route:=>
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing is Deleted!");
    return res.redirect("/listings");
};

//detail route:=>
module.exports.listingDetails = async (req, res) => {
    let { id } = req.params;
    const Data = await Listing.findById(id).populate({ path: "reviews", populate: { path: "owner" } }).populate("user");

    if (!Data) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("./listings/detail.ejs", { Data });
};
