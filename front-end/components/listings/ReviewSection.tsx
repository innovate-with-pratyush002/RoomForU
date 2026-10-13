"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Review } from "@/types/listing";

interface ReviewSectionProps {
  listingId: string;
  initialReviews: Review[];
}

function StarRating({
  rating,
  onRate,
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate && onRate(star)}
          className={`${interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}`}
          aria-label={`${star} stars`}
        >
          <Star
            size={18}
            className={`${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ listingId, initialReviews }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newReview = await api.listings.addReview(listingId, { rating, comment });
      setReviews((prev) => [newReview, ...prev]);
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Review Submission Form */}
      <div className="rounded-[28px] border border-slate-300/30 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900">Leave a Review</h3>
        <p className="mt-1 text-xs text-slate-500">
          Share your experience regarding rooms, facilities, and cleanliness.
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Your Rating</label>
            <div className="mt-2">
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Your Comment</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the room? Were utilities and Wi-Fi reliable?"
              className="mt-1.5 w-full rounded-2xl border border-slate-300/80 bg-slate-50/50 p-3 text-sm outline-none transition focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-teal-700 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            {submitting ? "Posting review..." : "Submit Review"}
          </button>
        </form>
      </div>

      {/* Reviews Feed */}
      <div className="rounded-[28px] border border-slate-300/30 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900">
            Ratings & Feedback ({reviews.length})
          </h3>
          <span className="text-xs font-semibold text-slate-500">Verified Reviews</span>
        </div>

        <div className="mt-4 space-y-3">
          {reviews.length > 0 ? (
            reviews.map((rev) => {
              const reviewId = rev.id || rev._id || "";
              return (
                <div
                  key={reviewId}
                  className="relative rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rev.owner || "Anonymous"}</h4>
                      <StarRating rating={rev.rating} />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReview(reviewId)}
                      disabled={deletingId === reviewId}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {rev.comment}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm italic text-slate-500">
              No reviews yet. Be the first to share your experience!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
