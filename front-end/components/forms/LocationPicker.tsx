"use client";

import dynamic from "next/dynamic";
import { Crosshair, MapPin } from "lucide-react";
import { useState } from "react";

const MapPicker = dynamic(() => import("@/components/maps/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full animate-pulse items-center justify-center rounded-3xl border border-slate-300/30 bg-slate-100 text-slate-500 sm:h-[400px]">
      <div className="text-center">
        <MapPin size={36} className="mx-auto animate-bounce text-teal-600" />
        <p className="mt-2 text-sm font-semibold">Loading interactive map...</p>
      </div>
    </div>
  ),
});

interface LocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  onChange?: (coords: { lat: number; lon: number }) => void;
}

export function LocationPicker({
  initialLat,
  initialLon,
  onChange,
}: LocationPickerProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(
    initialLat && initialLon ? { lat: initialLat, lon: initialLon } : null
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleCoordsChange = (coords: { lat: number; lon: number }) => {
    setCoordinates(coords);
    if (onChange) onChange(coords);
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const newCoords = {
          lat: Number(coords.latitude.toFixed(6)),
          lon: Number(coords.longitude.toFixed(6)),
        };
        setCoordinates(newCoords);
        if (onChange) onChange(newCoords);
        setLocating(false);
      },
      (err) => {
        setGeoError("Could not retrieve your location: " + err.message);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div>
      <input type="hidden" name="place[lat]" value={coordinates?.lat ?? ""} />
      <input type="hidden" name="place[lon]" value={coordinates?.lon ?? ""} />
      <input type="hidden" name="lat" value={coordinates?.lat ?? ""} />
      <input type="hidden" name="lon" value={coordinates?.lon ?? ""} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-teal-800 disabled:opacity-50"
        >
          <Crosshair size={17} className={locating ? "animate-spin" : ""} />
          {locating ? "Detecting location..." : "Use My Current Location"}
        </button>

        <span className="text-xs font-semibold text-slate-500">
          {coordinates
            ? `Selected: ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}`
            : "Click on map or drag marker to set exact location"}
        </span>
      </div>

      {geoError && (
        <p className="mt-2 text-xs font-medium text-rose-600">{geoError}</p>
      )}

      <div className="mt-3">
        <MapPicker
          coordinates={coordinates}
          onChange={handleCoordsChange}
        />
      </div>
    </div>
  );
}
