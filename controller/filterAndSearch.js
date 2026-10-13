const Listing = require("../models/listing");

// Search by city, area, keywords
module.exports.searchBar= async (req, res) => {
  const search = req.query.search?.trim();
 
  let listings = [];

  if (search) {
    listings = await Listing.find(
      { $text: { $search: search } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
  } else {
    listings = await Listing.find({});
  }

  if (listings.length === 0) {
  req.flash("error", "No rooms found for your search");
  }

  res.render("listings/listing", { allListings: listings });

};

