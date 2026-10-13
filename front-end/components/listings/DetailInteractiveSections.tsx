"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { ListingMapWrapper } from "@/components/maps/ListingMapWrapper";
import type { Review } from "@/types/listing";

interface DetailInteractiveSectionsProps {
  listingId: string;
  coordinates: { lat: number; lon: number };
  title: string;
  location: string;
  initialReviews: Review[];
  currentUser?: {
    id?: string;
    _id?: string;
    username?: string;
    name?: string;
  } | null;
}

export function DetailInteractiveSections({
  listingId,
  coordinates,
  title,
  location,
  initialReviews,
  currentUser,
}: DetailInteractiveSectionsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newReview = await api.listings.addReview(listingId, { rating, comment });
      const currentUserId = currentUser?.id || currentUser?._id;
      const reviewWithUser: Review = {
        ...newReview,
        ownerId: newReview.ownerId || currentUserId,
        owner: newReview.owner || currentUser?.username || currentUser?.name || "You",
      };
      setReviews((prev) => [reviewWithUser, ...prev]);
      setComment("");
      setRating(5);
    } catch (err: any) {
      setError(
        err?.status === 401
          ? "Please sign in to post a review."
          : err?.message || "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setDeletingId(reviewId);
    try {
      await api.listings.deleteReview(listingId, reviewId);
      setReviews((prev) => prev.filter((r) => (r.id || r._id) !== reviewId));
    } catch (err: any) {
      alert(err?.message || "Could not delete review. You may not be authorized.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Middle Section: Location Map on Left, Add Your Rating on Right */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] items-start">
        {/* Left: Location Map */}
        <div className="rounded-[28px] border border-slate-300/20 bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold text-slate-900">Location Map</h2>
            <p className="text-[13px] text-slate-500">Quick area view</p>
          </div>
          <div className="overflow-hidden rounded-[22px] bg-[#d8e7e5]">
            <ListingMapWrapper
              lat={coordinates.lat}
              lon={coordinates.lon}
              title={title}
              location={location}
            />
          </div>
        </div>

        {/* Right: Add Your Rating */}
        <div className="rounded-[28px] border border-slate-300/20 bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold text-slate-900">Add Your Rating</h2>
            <p className="text-[13px] text-slate-500">Share your experience</p>
          </div>

          <div className="rounded-[22px] border border-slate-200/60 bg-[#f8fbff] p-4">
            <h3 className="text-[15px] font-bold text-[#0f766e]">Share Your Experience</h3>

            {error && (
              <p className="mt-2 rounded-xl bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmitReview} className="mt-3 flex flex-col gap-3">
              <div>
                <p className="text-[13px] font-bold text-slate-900">Rating:</p>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer transition hover:scale-110"
                      aria-label={`${star} star`}
                    >
                      <Star
                        size={20}
                        className={
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comment-input" className="block text-[13px] font-bold text-slate-900">
                  Comment
                </label>
                <textarea
                  id="comment-input"
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your thoughts..."
                  className="mt-1.5 min-h-[88px] w-full rounded-2xl border border-slate-300/60 bg-white p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-fit rounded-xl bg-[#0f766e] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b5c56] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Bottom Section: Reviews & Ratings */}
      <section className="mt-4 rounded-[28px] border border-slate-300/20 bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold text-slate-900">Reviews & Ratings</h2>
          <p className="text-[13px] text-slate-500">{reviews.length} total</p>
        </div>

        <div className="rounded-[22px] border border-slate-200/60 bg-[#f8fbff] p-4">
          {reviews.length === 0 ? (
            <p className="py-3 text-center text-sm italic text-slate-500">
              Be the first to leave a review!
            </p>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => {
                const reviewId = review.id || review._id || "";
                const currentUserId = currentUser?.id || currentUser?._id;
                const reviewOwnerId =
                  review.ownerId ||
                  (review.ownerDetails ? (review.ownerDetails.id || review.ownerDetails._id) : null);

                const isReviewOwner = Boolean(
                  currentUserId &&
                  ((reviewOwnerId && String(currentUserId) === String(reviewOwnerId)) ||
                   (currentUser?.username && review.owner && currentUser.username === review.owner) ||
                   (currentUser?.name && review.owner && currentUser.name === review.owner))
                );

                return (
                  <article
                    key={reviewId}
                    className="flex flex-col justify-between rounded-[18px] border border-slate-200/60 bg-white p-3.5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {review.owner || "User"}
                        </h4>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-200 text-slate-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                        {review.comment}
                      </p>
                    </div>

                    {isReviewOwner && (
                      <div className="mt-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(reviewId)}
                          disabled={deletingId === reviewId}
                          className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 transition hover:bg-orange-100 disabled:opacity-50"
                          title="Delete review"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
