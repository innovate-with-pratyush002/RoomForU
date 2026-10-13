export interface Review {
  id: string;
  _id?: string;
  owner: string;
  rating: number;
  comment: string;
  createdAt?: string;
  ownerDetails?: {
    id?: string;
    _id?: string;
    name?: string;
    picture?: string | null;
  };
}

export interface Listing {
  id: string;
  _id?: string;
  title: string;
  description: string;
  image: string;
  imageUrl?: string;
  price: number;
  location: string;
  state: string;
  roomType: "Single" | "Double" | "Shared" | string;
  preferredTenant: "Boys" | "Girls" | "Any" | string;
  availabilityStatus: "Available" | "Booked" | string;
  phone: string;
  contact?: { phone: string };
  owner: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    picture?: string | null;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  reviews: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  picture?: string | null;
  createdAt?: string;
}

export interface CurrentUserResponse {
  success: boolean;
  status: number;
  authenticated: boolean;
  user: User | null;
}

export interface ListingsApiResponse {
  success: boolean;
  status: number;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: Listing[];
}

export interface ListingDetailResponse {
  success: boolean;
  status: number;
  data: Listing;
}

export interface ProfileApiResponse {
  success: boolean;
  status: number;
  user: User;
  listingsCount: number;
  listings: Listing[];
}

export interface ListingFilters {
  search?: string;
  roomType?: string;
  preferredTenant?: string;
  availabilityStatus?: string;
  location?: string;
  state?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: "newest" | "price_asc" | "price_desc" | string;
  page?: number | string;
  limit?: number | string;
}
