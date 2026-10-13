const Listing = require("../models/listing");

const LISTING_PROJECTION = "title price location state roomType preferredTenant availabilityStatus image user createdAt mapCoordinates";

// Search by city, area, keywords
module.exports.searchBar = async (req, res) => {
  const search = req.query.search?.trim();
 
  let listings = [];

  if (search) {
    listings = await Listing.find(
      { $text: { $search: search } },
      { score: { $meta: "textScore" } }
    )
      .select(LISTING_PROJECTION)
      .sort({ score: { $meta: "textScore" } })
      .limit(60)
      .lean();
  } else {
    listings = await Listing.find({})
      .select(LISTING_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();
  }

  if (listings.length === 0) {
    req.flash("error", "No rooms found for your search");
  }

  res.render("listings/listing", { allListings: listings });
};

