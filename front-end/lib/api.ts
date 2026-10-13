import type {
  CurrentUserResponse,
  Listing,
  ListingFilters,
  ListingsApiResponse,
  ProfileApiResponse,
  Review,
  User,
} from "@/types/listing";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side execution
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:5000"
    );
  }
  // Server-side execution (Node)
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:5000"
  );
}

/**
 * Typed API request helper with credentials and unified error formatting.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // Don't set Content-Type if body is FormData (let browser set boundary)
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Forward cookies from incoming request when executing in Server Components
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader && !headers.has("Cookie")) {
        headers.set("Cookie", cookieHeader);
      }
    } catch {
      // Context without cookies (e.g. build time static evaluation)
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    // Always include session cookie for cross-origin backend authentication
    credentials: options.credentials ?? "include",
    // In server components, prevent caching for fresh DB state
    cache: options.cache ?? "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data.slice(0, 100)) ||
      `HTTP Error ${response.status}: ${response.statusText}`;

    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}

// -------------------------------------------------------------
// Typed API Services
// -------------------------------------------------------------

export const api = {
  // Auth endpoints
  auth: {
    async getCurrentUser(): Promise<CurrentUserResponse> {
      try {
        return await apiFetch<CurrentUserResponse>("/api/v1/auth/current-user");
      } catch {
        return { success: false, status: 401, authenticated: false, user: null };
      }
    },

    async signin(identifier: string, password: string): Promise<{ success: boolean; user: User; message: string }> {
      return await apiFetch("/api/v1/auth/signin", {
        method: "POST",
        body: JSON.stringify({ username: identifier, password }),
      });
    },

    async signup(payload: {
      name: string;
      email: string;
      username?: string;
      password: string;
    }): Promise<{ success: boolean; user: User; message: string }> {
      return await apiFetch("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async logout(): Promise<{ success: boolean; message: string }> {
      return await apiFetch("/api/v1/auth/logout", {
        method: "POST",
      });
    },
  },

  // Listings endpoints
  listings: {
    async getAll(filters: ListingFilters = {}): Promise<ListingsApiResponse> {
      const searchParams = new URLSearchParams();
      if (filters.search) searchParams.set("search", filters.search);
      if (filters.roomType) searchParams.set("roomType", filters.roomType);
      if (filters.preferredTenant) searchParams.set("preferredTenant", filters.preferredTenant);
      if (filters.availabilityStatus) searchParams.set("availabilityStatus", filters.availabilityStatus);
      if (filters.location) searchParams.set("location", filters.location);
      if (filters.state) searchParams.set("state", filters.state);
      if (filters.minPrice !== undefined) searchParams.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice !== undefined) searchParams.set("maxPrice", String(filters.maxPrice));
      if (filters.sort) searchParams.set("sort", filters.sort);
      if (filters.page) searchParams.set("page", String(filters.page));
      if (filters.limit) searchParams.set("limit", String(filters.limit));

      const queryStr = searchParams.toString();
      const path = `/api/v1/listings${queryStr ? `?${queryStr}` : ""}`;
      return await apiFetch<ListingsApiResponse>(path);
    },

    async getById(id: string): Promise<Listing> {
      const res = await apiFetch<{ success: boolean; data: Listing }>(`/api/v1/listings/${id}`);
      return res.data;
    },

    async create(body: FormData | Record<string, any>): Promise<Listing> {
      const isFormData = body instanceof FormData;
      const res = await apiFetch<{ success: boolean; data: Listing }>("/api/v1/listings", {
        method: "POST",
        body: isFormData ? body : JSON.stringify(body),
      });
      return res.data;
    },

    async update(id: string, body: FormData | Record<string, any>): Promise<Listing> {
      const isFormData = body instanceof FormData;
      const res = await apiFetch<{ success: boolean; data: Listing }>(`/api/v1/listings/${id}`, {
        method: "PUT",
        body: isFormData ? body : JSON.stringify(body),
      });
      return res.data;
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return await apiFetch<{ success: boolean; message: string }>(`/api/v1/listings/${id}`, {
        method: "DELETE",
      });
    },

    async addReview(
      listingId: string,
      review: { rating: number; comment: string }
    ): Promise<Review> {
      const res = await apiFetch<{ success: boolean; data: Review }>(
        `/api/v1/listings/${listingId}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({ review }),
        }
      );
      return res.data;
    },

    async deleteReview(listingId: string, reviewId: string): Promise<{ success: boolean; message: string }> {
      return await apiFetch<{ success: boolean; message: string }>(
        `/api/v1/listings/${listingId}/reviews/${reviewId}`,
        {
          method: "DELETE",
        }
      );
    },
  },

  // Profile endpoints
  profile: {
    async get(): Promise<ProfileApiResponse> {
      return await apiFetch<ProfileApiResponse>("/api/v1/profile");
    },
  },
};
