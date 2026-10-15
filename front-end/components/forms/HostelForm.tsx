"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Listing } from "@/types/listing";
import { LocationPicker } from "./LocationPicker";

interface HostelFormProps {
  listing?: Listing;
  onChangeType?: () => void;
}

const inputStyle =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10";

export function HostelForm({ listing, onChangeType }: HostelFormProps) {
  const router = useRouter();
  const edit = Boolean(listing);
  const listingId = listing?.id || listing?._id;

  // Hostel specific fields
  const [title, setTitle] = useState(listing?.title || "");
  const [description, setDescription] = useState(listing?.description || "");
  const [price, setPrice] = useState(listing?.price ? String(listing?.price) : "");
  const [hostelFor, setHostelFor] = useState(listing?.hostelFor || "Boys");
  const [roomSharingType, setRoomSharingType] = useState(listing?.roomSharingType || "Single Sharing");
  const [availableBeds, setAvailableBeds] = useState(
    listing?.availableBeds !== undefined && listing?.availableBeds !== null
      ? String(listing?.availableBeds)
      : "1"
  );
  const [foodFacility, setFoodFacility] = useState(listing?.foodFacility || "Included in Rent");
  const [contact, setContact] = useState(listing?.phone || "");

  // Coordinates & Location
  const initLon =
    listing?.coordinates?.lon ??
    (listing as any)?.mapCoordinates?.coordinates?.[0] ??
    77.2090;
  const initLat =
    listing?.coordinates?.lat ??
    (listing as any)?.mapCoordinates?.coordinates?.[1] ??
    28.6139;

  const [location, setLocation] = useState(listing?.location || "");
  const [stateName, setStateName] = useState(listing?.state || "");
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(
    listing ? { lat: initLat, lon: initLon } : { lat: 28.6139, lon: 77.2090 }
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const forwardGeocode = async (locQuery: string, stateQuery: string) => {
    const q = [locQuery.trim(), stateQuery.trim()].filter(Boolean).join(", ");
    if (q.length < 3) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          setCoordinates({
            lat: Number(lat.toFixed(6)),
            lon: Number(lon.toFixed(6)),
          });
        }
      }
    } catch (err) {
      console.error("Forward geocode error:", err);
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      forwardGeocode(val, stateName);
    }, 700);
  };

  const handleStateChange = (val: string) => {
    setStateName(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      forwardGeocode(location, val);
    }, 700);
  };

  const handleAddressResolved = (address: {
    location: string;
    state: string;
    lat: number;
    lon: number;
  }) => {
    if (address.location) {
      setLocation(address.location);
    }
    if (address.state) {
      setStateName(address.state);
    }
    setCoordinates({ lat: address.lat, lon: address.lon });
  };

  // Image Upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    listing?.imageUrl || listing?.image || null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds 5MB limit. Please select a smaller photo.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!title.trim()) return setError("Please enter the hostel name / listing title.");
    if (!price || Number(price) <= 0) return setError("Please enter a valid monthly rent per bed.");
    if (availableBeds === "" || Number(availableBeds) < 0)
      return setError("Please enter the number of vacant beds (0 or more).");
    if (!location.trim()) return setError("Please enter the hostel address/locality.");
    if (!stateName.trim()) return setError("Please enter the state.");
    if (!contact.trim()) return setError("Please enter a contact phone number.");
    if (!edit && !imageFile) return setError("Please upload at least one photo of the hostel.");

    setLoading(true);

    try {
      const formData = new FormData();
      // Category is automatically assigned as Hostel based on owner's selection
      formData.append("listingType", "Hostel");
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", String(Number(price))); // Monthly Rent per Bed
      formData.append("hostelFor", hostelFor);
      formData.append("roomSharingType", roomSharingType);
      formData.append("availableBeds", String(Number(availableBeds)));
      formData.append("foodFacility", foodFacility);
      formData.append("availabilityStatus", Number(availableBeds) > 0 ? "Available" : "Booked");
      formData.append("contact", contact.trim());
      formData.append("phone", contact.trim());
      formData.append("location", location.trim());
      formData.append("state", stateName.trim());

      if (coordinates) {
        formData.append("lat", String(coordinates.lat));
        formData.append("lon", String(coordinates.lon));
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let savedListing: Listing;
      if (edit && listingId) {
        savedListing = await api.listings.update(listingId, formData);
      } else {
        savedListing = await api.listings.create(formData);
      }

      setSuccess(true);
      const targetId = savedListing.id || savedListing._id || listingId;
      setTimeout(() => {
        router.push(`/listings/${targetId}`);
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(
        err?.status === 401
          ? "Please sign in to publish or edit listings."
          : err?.message || "Failed to save hostel listing. Please check your connection and inputs."
      );
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1080px] px-4 py-6 pb-20 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={14} /> Back to listings
        </Link>

        {onChangeType && !edit && (
          <button
            type="button"
            onClick={onChangeType}
            className="text-xs font-bold text-teal-700 underline hover:text-teal-900"
          >
            ← Change Listing Type (Switch to PG)
          </button>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-300/30 bg-white p-6 shadow-md sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700 uppercase tracking-widest">
              Hostel Accommodation
            </span>
            {!edit && <span className="text-xs font-semibold text-slate-400">• Step 2 of 2</span>}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {edit ? "Update Hostel Information" : "List Your Hostel on RoomForU"}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
            Provide accurate hostel details, rent per bed, mess and room facilities, and pin the location on the map.
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 sm:text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 sm:text-sm">
            <CheckCircle size={18} className="shrink-0" />
            <span>Hostel listing saved successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Section: Basic info */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Hostel Name / Title *</span>
                <input
                  required
                  className={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunrise Boys Hostel, Khandari, Agra"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Hostel Facilities & Rules (Optional)</span>
                <textarea
                  rows={4}
                  className={`${inputStyle} min-h-28 py-3`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe hostel rules, mess timings, Wi-Fi, study area, CCTV security, etc."
                />
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Monthly Rent per Bed (₹) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  max="10000000"
                  className={inputStyle}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 5000"
                />
                <span className="mt-1 block text-[11px] font-medium text-slate-500">
                  Specify rent for one bed per month (not the full room).
                </span>
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Contact Phone *</span>
                <input
                  required
                  type="tel"
                  className={inputStyle}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </label>
            </div>
          </div>

          {/* Section: Hostel Specifications & Selection Controls (Consistent Dropdowns in Single Line) */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">Hostel Specifications & Amenities</h2>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Hostel For *</span>
                <select
                  className={inputStyle}
                  value={hostelFor}
                  onChange={(e) => setHostelFor(e.target.value)}
                >
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Room Sharing Type *</span>
                <select
                  className={inputStyle}
                  value={roomSharingType}
                  onChange={(e) => setRoomSharingType(e.target.value)}
                >
                  <option value="Single Sharing">Single Sharing</option>
                  <option value="Double Sharing">Double Sharing</option>
                  <option value="Triple Sharing">Triple Sharing</option>
                  <option value="Four Sharing">Four Sharing</option>
                  <option value="5–6 Sharing">5–6 Sharing</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Available Beds *</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="1000"
                  className={inputStyle}
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(e.target.value)}
                  placeholder="e.g. 3"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Food / Mess Facility *</span>
                <select
                  className={inputStyle}
                  value={foodFacility}
                  onChange={(e) => setFoodFacility(e.target.value)}
                >
                  <option value="Included in Rent">Included in Rent</option>
                  <option value="Available at Extra Cost">Available at Extra Cost</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section: Image Upload (Matches ListingForm Photo Box) */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">
              {edit ? "Hostel Photo (Upload new to replace)" : "Hostel Photo *"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload clear real pictures of the hostel rooms, mess, or facade (Max 5MB, JPG/PNG/WebP).
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-600/30 bg-teal-50/30 transition hover:border-teal-600 hover:bg-teal-50/60 sm:w-64">
                <UploadCloud size={28} className="text-teal-700" />
                <span className="mt-2 text-xs font-bold text-teal-800">
                  {imagePreview ? "Change hostel photo" : "Choose hostel photo"}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-400">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview ? (
                <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:w-64">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    {imageFile ? "New Upload" : "Current Photo"}
                  </span>
                </div>
              ) : (
                <div className="flex h-36 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 sm:w-64">
                  <div className="flex items-center gap-1.5 text-xs">
                    <ImageIcon size={18} />
                    <span>No image selected</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Location and Map (Matches ListingForm) */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">Location & Coordinates</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Address / Locality *</span>
                <input
                  required
                  className={inputStyle}
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="e.g. Khandari, Near St. John's College"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">State / Region *</span>
                <input
                  required
                  className={inputStyle}
                  value={stateName}
                  onChange={(e) => handleStateChange(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                />
              </label>

              <div className="md:col-span-2">
                <LocationPicker
                  initialLat={coordinates?.lat}
                  initialLon={coordinates?.lon}
                  coordinates={coordinates}
                  onChange={(coords) => setCoordinates(coords)}
                  onAddressResolved={handleAddressResolved}
                />
              </div>
            </div>
          </div>

          {/* Submit Button (Matches ListingForm) */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Link
              href="/listings"
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || success}
              className="rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading
                ? edit
                  ? "Updating hostel..."
                  : "Publishing hostel..."
                : edit
                ? "Update Listing"
                : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
