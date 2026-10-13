"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Calendar, Mail, Building, PlusCircle, AlertCircle, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing, User } from "@/types/listing";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await api.profile.get();
        if (isMounted) {
          setUser(data.user);
          setListings(data.listings || []);
        }
      } catch (err: any) {
        if (isMounted) {
          if (err?.status === 401 || err?.status === 403) {
            setUnauthenticated(true);
          } else {
            setError(err?.message || "Failed to load user profile.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await api.listings.delete(listingId);
      setListings((prev) => prev.filter((item) => (item.id || item._id) !== listingId));
    } catch (err: any) {
      alert(err?.message || "Failed to delete listing.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />
          <div className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <section className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-slate-300/30 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <LogIn size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Sign In Required</h2>
          <p className="mt-2 text-sm text-slate-600">
            Please sign in to view your profile and manage your student room listings.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/listings"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Return to Browse Listings
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">Could not load profile</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Verified Member";

  return (
    <div className="pb-20">
      {/* Profile Header Banner */}
      <section className="border-b border-slate-200/80 bg-white px-4 py-10 shadow-xs">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-teal-700 text-2xl font-black text-white shadow-md sm:size-24 sm:text-3xl">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="size-full rounded-3xl object-cover"
                />
              ) : (
                (user?.name || "U").charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                <UserCheck size={13} /> Active Host
              </span>
              <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                {user?.name || "User"}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-teal-700" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-teal-700" />
                  Joined {joinDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building size={14} className="text-teal-700" />
                  {listings.length} Active {listings.length === 1 ? "Listing" : "Listings"}
                </span>
              </div>
            </div>

            <Link
              href="/listings/new"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
            >
              <PlusCircle size={15} />
              Add New Listing
            </Link>
          </div>
        </div>
      </section>

      {/* User Listings Section */}
      <section className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Your Room Listings</h2>
            <p className="text-xs text-slate-500">
              Manage and update your published properties
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total: {listings.length}
          </span>
        </div>

        {listings.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id || listing._id}
                listing={listing}
                profile
                onDelete={handleDeleteListing}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Building size={36} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-lg font-bold text-slate-800">No listings published yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              You haven&apos;t added any student rooms yet. Click below to add your first room!
            </p>
            <Link
              href="/listings/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
            >
              <PlusCircle size={14} /> Add First Listing
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
