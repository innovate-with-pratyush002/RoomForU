const sampleListings = [
  {
    title: "Single PG near Noida Sector 62 Metro",
    description: "Single PG room for students near Noida Sector 62 Metro Station.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 8500,
    location: "Sector 62, Noida",
    state: "Uttar Pradesh",
    roomType: "Single",
    preferredTenant: "Boys",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.3649, 28.6271]
    }
  },

  {
    title: "Shared PG for Girls near Laxmi Nagar",
    description: "Affordable shared PG near Laxmi Nagar Metro Station.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 5200,
    location: "Laxmi Nagar, Delhi",
    state: "Delhi",
    roomType: "Shared",
    preferredTenant: "Girls",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.2773, 28.6366]
    }
  },

  {
    title: "Double Room near Cyber City",
    description: "cious double room for working professionals near Cyber City.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 7500,
    location: "DLF Cyber City, Gurugram",
    state: "Haryana",
    roomType: "Double",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.0897, 28.4949]
    }
  },

  {
    title: "Budget PG near DU North Campus",
    description: "Low budget PG ideal for DU students near North Campus.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 4800,
    location: "Kamla Nagar, Delhi",
    state: "Delhi",
    roomType: "Shared",
    preferredTenant: "Boys",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.2043, 28.6810]
    }
  },

  {
    title: "Single Room near Whitefield IT Park",
    description: "Quiet single room for IT professionals in Whitefield.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 9500,
    location: "Whitefield, Bengaluru",
    state: "Karnataka",
    roomType: "Single",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.7499, 12.9698]
    }
  },

  {
    title: "Girls PG near Kota Coaching Area",
    description: "Safe PG for girls near Allen and Resonance coaching centers.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 6200,
    location: "Talwandi, Kota",
    state: "Rajasthan",
    roomType: "Shared",
    preferredTenant: "Girls",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [75.8460, 25.1516]
    }
  },

  {
    title: "Shared PG near Marine Drive",
    description: "Shared accommodation near Marine Drive with good connectivity.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 9000,
    location: "Churchgate, Mumbai",
    state: "Maharashtra",
    roomType: "Shared",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [72.8277, 18.9352]
    }
  },

  {
    title: "Single PG near Infopark",
    description: "Single PG room near Kochi Infopark Phase 1.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 8200,
    location: "Kakkanad, Kochi",
    state: "Kerala",
    roomType: "Single",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [76.3612, 10.0159]
    }
  },

  {
    title: "Single Room near Baner IT Park",
    description: "Fully furnished room near Baner business area.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 8800,
    location: "Baner, Pune",
    state: "Maharashtra",
    roomType: "Single",
    preferredTenant: "Boys",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [73.7769, 18.5590]
    }
  },

  {
    title: "Girls PG near T Nagar",
    description: "Well-maintained PG for girls near T Nagar shopping area.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 8600,
    location: "T Nagar, Chennai",
    state: "Tamil Nadu",
    roomType: "Single",
    preferredTenant: "Girls",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [80.2337, 13.0418]
    }
  },

  {
    title: "Shared PG near Patna University",
    description: "Affordable PG near Patna University campus.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 4300,
    location: "Ashok Rajpath, Patna",
    state: "Bihar",
    roomType: "Shared",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [85.1565, 25.6206]
    }
  },

  {
    title: "Single Room near Banjara Hills",
    description: "Premium single room in Banjara Hills.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 10500,
    location: "Banjara Hills, Hyderabad",
    state: "Telangana",
    roomType: "Single",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [78.4483, 17.4156]
    }
  },

  {
    title: "Double Room near Railway Station",
    description: "Double sharing room near Charbagh Railway Station.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 6800,
    location: "Charbagh, Lucknow",
    state: "Uttar Pradesh",
    roomType: "Double",
    preferredTenant: "Any",
    availabilityStatus: "Booked",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [80.9231, 26.8350]
    }
  },

  {
    title: "Single PG near Law University",
    description: "Quiet PG suitable for law students.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 8300,
    location: "Sector 14, Chandigarh",
    state: "Chandigarh",
    roomType: "Single",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [76.7794, 30.7333]
    }
  },

  {
    title: "Shared PG near BHU",
    description: "Budget PG near Banaras Hindu University.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 4500,
    location: "Lanka, Varanasi",
    state: "Uttar Pradesh",
    roomType: "Shared",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [83.0036, 25.2780]
    }
  },

  {
    title: "Girls PG near Ranchi University",
    description: "Safe PG for girls near Ranchi University.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 5000,
    location: "Morabadi, Ranchi",
    state: "Jharkhand",
    roomType: "Shared",
    preferredTenant: "Girls",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [85.3250, 23.3700]
    }
  },

  {
    title: "Single Room near Medical College",
    description: "Ideal room for medical students.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 7900,
    location: "Arera Colony, Bhopal",
    state: "Madhya Pradesh",
    roomType: "Single",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [77.4329, 23.2156]
    }
  },

  {
    title: "Shared PG near City Center Mall",
    description: "Shared PG near Salt Lake City Center Mall.",
    image: { url: "69697edb8906baa755d5cd9c", fileName: "69697edb8906baa755d5cd9c" },
    price: 5600,
    location: "Salt Lake Sector V, Kolkata",
    state: "West Bengal",
    roomType: "Shared",
    preferredTenant: "Any",
    availabilityStatus: "Available",
    contact: { phone: "69697edb8906baa755d5cd9c" },
    user: "69697edb8906baa755d5cd9c",
    reviews: [],
    mapCoordinates: {
      type: "Point",
      coordinates: [88.4333, 22.5726]
    }
  }
];

module.exports = { data: sampleListings };
