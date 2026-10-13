const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const UserAuth = require("./authentication.js");
const { destroyCloudinaryImage } = require("../cloudConfig.js");

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    image: {
      url: String,
      fileName: String
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    roomType: {
      type: String,
      enum: ["Single", "Double", "Shared"],
      required: true
    },

    preferredTenant: {
      type: String,
      enum: ["Boys", "Girls", "Any"],
      required: true
    },

    availabilityStatus: {
      type: String,
      enum: ["Available", "Booked"],
      default: "Available"
    },

    contact: {
      phone: {
        type: String,
        trim: true,
        required: true
      }
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "UserAuth",
      required: true
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review"
      }
    ],

    mapCoordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number], 
        required: true
      }
    }
  },
  {
    timestamps: true
  }
);


// INDEXES
listingSchema.index({ mapCoordinates: "2dsphere" });
listingSchema.index({ location: 1, state: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ user: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ roomType: 1, price: 1 });
listingSchema.index({ availabilityStatus: 1 });

listingSchema.index({
  title: "text",
  location: "text",
  description: "text"
});

// Delete related reviews and Cloudinary image when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    if (listing.reviews && listing.reviews.length > 0) {
      await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
    if (listing.image?.fileName) {
      await destroyCloudinaryImage(listing.image.fileName);
    }
  }
});


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;






