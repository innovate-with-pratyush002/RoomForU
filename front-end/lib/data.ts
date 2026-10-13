import { api } from "@/lib/api";
import type { Listing, ListingFilters } from "@/types/listing";

/**
 * Fetch all listings from MongoDB via REST API with optional filtering, search, and pagination.
 */
export async function getListings(filters: ListingFilters = {}): Promise<{
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const res = await api.listings.getAll(filters);
    return {
      listings: res.data || [],
      total: res.total || 0,
      page: res.page || 1,
      totalPages: res.totalPages || 1,
    };
  } catch (error) {
    console.error("Failed to fetch listings from backend API:", error);
    return {
      listings: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Fetch a single listing by its ID from MongoDB via REST API.
 */
export async function getListing(id: string): Promise<Listing | null> {
  try {
    if (!id) return null;
    return await api.listings.getById(id);
  } catch (error) {
    console.error(`Failed to fetch listing with id ${id} from API:`, error);
    return null;
  }
}
