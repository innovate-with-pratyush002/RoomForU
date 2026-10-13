"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full animate-pulse items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
      <p className="text-sm font-semibold">Loading location map...</p>
    </div>
  ),
});

interface ListingMapWrapperProps {
  lat: number;
  lon: number;
  title: string;
  location: string;
}

export function ListingMapWrapper(props: ListingMapWrapperProps) {
  return <ListingMap {...props} />;
}
