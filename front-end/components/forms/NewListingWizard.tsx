"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Home, Building, Check, ArrowRight } from "lucide-react";
import { ListingForm } from "@/components/forms/ListingForm";
import { HostelForm } from "@/components/forms/HostelForm";

export function NewListingWizard() {
  const [selectedType, setSelectedType] = useState<"PG" | "Hostel" | null>(null);

  if (selectedType === "PG") {
    return <ListingForm onChangeType={() => setSelectedType(null)} />;
  }

  if (selectedType === "Hostel") {
    return <HostelForm onChangeType={() => setSelectedType(null)} />;
  }

  // Step 1: Listing Type Selector
  return (
    <section className="mx-auto max-w-[960px] px-4 py-8 pb-24 sm:px-6">
      <div className="mb-6">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={14} /> Back to listings
        </Link>
      </div>

      <div className="rounded-[28px] border border-slate-300/30 bg-white p-6 shadow-md sm:p-10">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700 uppercase tracking-widest">
            Step 1 of 2
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Choose What You Want to List
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Select the type of accommodation you are listing to open the right form with specific pricing and amenity fields.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Card 1: PG */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedType("PG")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedType("PG")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-[24px] border-2 border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-700 hover:shadow-xl focus:border-teal-700 focus:outline-hidden"
          >
            <div>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition duration-200 group-hover:bg-teal-700 group-hover:text-white">
                <Home size={28} />
              </div>

              <span className="mt-4 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                Rooms & Flats
              </span>

              <h2 className="mt-2 text-xl font-bold text-slate-900 transition duration-200 group-hover:text-teal-700">
                PG (Paying Guest)
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Ideal for individual rooms, shared rooms, 1/2 BHK apartments, or independent flats for students and professionals.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Monthly room / flat rent
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Single, Double, Shared room types
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Student & family preferences
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 py-3 text-xs font-bold text-teal-800 transition duration-200 group-hover:bg-teal-700 group-hover:text-white"
            >
              List as PG <ArrowRight size={14} />
            </button>
          </div>

          {/* Card 2: Hostel (Consistent with PG Card) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedType("Hostel")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedType("Hostel")}
            className="group relative flex cursor-pointer flex-col justify-between rounded-[24px] border-2 border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-700 hover:shadow-xl focus:border-teal-700 focus:outline-hidden"
          >
            <div>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition duration-200 group-hover:bg-teal-700 group-hover:text-white">
                <Building size={28} />
              </div>

              <span className="mt-4 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                Hostels & Dormitories
              </span>

              <h2 className="mt-2 text-xl font-bold text-slate-900 transition duration-200 group-hover:text-teal-700">
                Hostel
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Ideal for commercial or campus hostels with bed-based bookings, food/mess facilities, and multiple sharing tiers.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Monthly rent per bed
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Available vacant bed counts
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-teal-600" /> Food & mess facility options
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 py-3 text-xs font-bold text-teal-800 transition duration-200 group-hover:bg-teal-700 group-hover:text-white"
            >
              List as Hostel <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
