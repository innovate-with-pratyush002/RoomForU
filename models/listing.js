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

    listingType: {
      type: String,
      enum: ["PG", "Hostel"],
      default: "PG"
    },

    roomType: {
      type: String,
      required: function () {
        return this.listingType === "PG";
      }
    },

    preferredTenant: {
      type: String,
      required: function () {
        return this.listingType === "PG";
      }
    },

    // Hostel-specific fields
    hostelFor: {
      type: String,
      enum: ["Boys", "Girls", "Co-ed"],
      required: function () {
        return this.listingType === "Hostel";
      }
    },

    roomSharingType: {
      type: String,
      enum: [
        "Single Sharing",
        "Double Sharing",
        "Triple Sharing",
        "Four Sharing",
        "5–6 Sharing",
        "Dormitory"
      ],
      required: function () {
        return this.listingType === "Hostel";
      }
    },

    availableBeds: {
      type: Number,
      min: 0,
      required: function () {
        return this.listingType === "Hostel";
      }
    },

    foodFacility: {
      type: String,
      enum: ["Included in Rent", "Available at Extra Cost", "Not Available"],
      required: function () {
        return this.listingType === "Hostel";
      }
    },

    availabilityStatus: {
      type: String,
      enum: ["Available", "Booked", "Rented"],
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
listingSchema.index({ listingType: 1 });
listingSchema.index({ listingType: 1, price: 1 });
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






