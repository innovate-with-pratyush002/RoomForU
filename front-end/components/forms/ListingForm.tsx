"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Listing } from "@/types/listing";
import { LocationPicker } from "./LocationPicker";

interface ListingFormProps {
  listing?: Listing;
}

const inputStyle =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10";

export function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const edit = Boolean(listing);
  const listingId = listing?.id || listing?._id;

  const [title, setTitle] = useState(listing?.title || "");
  const [description, setDescription] = useState(listing?.description || "");
  const [price, setPrice] = useState(listing?.price ? String(listing?.price) : "");
  const [roomType, setRoomType] = useState(listing?.roomType || "Single");
  const [preferredTenant, setPreferredTenant] = useState(listing?.preferredTenant || "Any");
  const [availabilityStatus, setAvailabilityStatus] = useState(listing?.availabilityStatus || "Available");
  const [contact, setContact] = useState(listing?.phone || "");
  const [location, setLocation] = useState(listing?.location || "");
  const [stateName, setStateName] = useState(listing?.state || "");
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(
    listing?.coordinates || { lat: 28.6139, lon: 77.2090 }
  );

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

    // Validation
    if (!title.trim()) return setError("Please provide a listing title.");
    if (!price || Number(price) <= 0) return setError("Please enter a valid monthly price.");
    if (!location.trim()) return setError("Please enter the room address/locality.");
    if (!stateName.trim()) return setError("Please enter the state.");
    if (!contact.trim()) return setError("Please enter a contact phone number.");
    if (!edit && !imageFile) return setError("Please upload an image of the room.");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", String(Number(price)));
      formData.append("roomType", roomType);
      formData.append("preferredTenant", preferredTenant);
      formData.append("availabilityStatus", availabilityStatus);
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
          : err?.message || "Failed to save listing. Please check your connection and inputs."
      );
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1080px] px-4 py-6 pb-20 sm:px-6">
      <div className="mb-4">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={14} /> Back to listings
        </Link>
      </div>

      <div className="rounded-[28px] border border-slate-300/30 bg-white p-6 shadow-md sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-bold tracking-widest text-teal-700 uppercase">
            {edit ? "Edit Room Details" : "Publish New Listing"}
          </span>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {edit ? "Update room information" : "List your room for students"}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
            Provide accurate details, genuine photos, and pinpoint the location on the map to help students find their ideal stay easily.
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
            <span>Listing saved successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Section: Basic info */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Listing Title *</span>
                <input
                  required
                  className={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious PG Room near Knowledge Park Metro"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Description *</span>
                <textarea
                  required
                  rows={4}
                  className={`${inputStyle} min-h-28 py-3`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe room amenities (Wi-Fi, AC, attached washroom, meals, distance from nearby campus, security, etc.)."
                />
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Monthly Price (₹) *</span>
                <input
                  required
                  type="number"
                  min="0"
                  className={inputStyle}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 5500"
                />
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

          {/* Section: Preferences */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">Room Preferences & Status</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Room Type</span>
                <select
                  className={inputStyle}
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Shared">Shared</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Preferred Tenant</span>
                <select
                  className={inputStyle}
                  value={preferredTenant}
                  onChange={(e) => setPreferredTenant(e.target.value)}
                >
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Any">Any</option>
                </select>
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Availability Status</span>
                <select
                  className={inputStyle}
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section: Image Upload */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">
              {edit ? "Room Photo (Upload new to replace)" : "Room Photo *"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload clear real pictures of the room or property (Max 5MB, JPG/PNG/WebP).
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-600/30 bg-teal-50/30 transition hover:border-teal-600 hover:bg-teal-50/60 sm:w-64">
                <UploadCloud size={28} className="text-teal-700" />
                <span className="mt-2 text-xs font-bold text-teal-800">Choose room photo</span>
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

          {/* Section: Location and Map */}
          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-lg font-bold text-slate-900">Location & Coordinates</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">Address / Locality *</span>
                <input
                  required
                  className={inputStyle}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 62, Near Metro Station"
                />
              </label>

              <label>
                <span className="text-xs font-bold text-slate-700 uppercase">State / Region *</span>
                <input
                  required
                  className={inputStyle}
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                />
              </label>

              <div className="md:col-span-2">
                <LocationPicker
                  initialLat={coordinates?.lat}
                  initialLon={coordinates?.lon}
                  onChange={(coords) => setCoordinates(coords)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
                  ? "Updating room..."
                  : "Publishing room..."
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
