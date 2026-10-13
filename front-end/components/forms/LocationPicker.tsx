"use client";

import dynamic from "next/dynamic";
import { Crosshair, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

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

export async function reverseGeocodeNominatim(
  lat: number,
  lon: number
): Promise<{ location: string; state: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address || {};
    const loc =
      a.suburb ||
      a.neighbourhood ||
      a.residential ||
      a.road ||
      a.city ||
      a.town ||
      a.village ||
      data?.display_name ||
      "";
    const st = a.state || "";
    return { location: loc, state: st };
  } catch (err) {
    console.error("Failed to reverse geocode address:", err);
    return null;
  }
}

interface LocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  coordinates?: { lat: number; lon: number } | null;
  onChange?: (coords: { lat: number; lon: number }) => void;
  onAddressResolved?: (address: { location: string; state: string; lat: number; lon: number }) => void;
}

export function LocationPicker({
  initialLat,
  initialLon,
  coordinates: coordinatesProp,
  onChange,
  onAddressResolved,
}: LocationPickerProps) {
  const [internalCoords, setInternalCoords] = useState<{ lat: number; lon: number } | null>(
    initialLat && initialLon ? { lat: initialLat, lon: initialLon } : null
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const activeCoordinates = coordinatesProp !== undefined ? coordinatesProp : internalCoords;

  const handleCoordsChange = async (coords: { lat: number; lon: number }, reverseGeocode = true) => {
    setInternalCoords(coords);
    if (onChange) onChange(coords);

    if (reverseGeocode && onAddressResolved) {
      const resolved = await reverseGeocodeNominatim(coords.lat, coords.lon);
      if (resolved && (resolved.location || resolved.state)) {
        onAddressResolved({
          location: resolved.location,
          state: resolved.state,
          lat: coords.lat,
          lon: coords.lon,
        });
      }
    }
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const newCoords = {
          lat: Number(coords.latitude.toFixed(6)),
          lon: Number(coords.longitude.toFixed(6)),
        };
        await handleCoordsChange(newCoords, true);
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
      <input type="hidden" name="place[lat]" value={activeCoordinates?.lat ?? ""} />
      <input type="hidden" name="place[lon]" value={activeCoordinates?.lon ?? ""} />
      <input type="hidden" name="lat" value={activeCoordinates?.lat ?? ""} />
      <input type="hidden" name="lon" value={activeCoordinates?.lon ?? ""} />

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
          {activeCoordinates
            ? `Selected: ${activeCoordinates.lat.toFixed(4)}, ${activeCoordinates.lon.toFixed(4)}`
            : "Click on map or drag marker to set exact location"}
        </span>
      </div>

      {geoError && (
        <p className="mt-2 text-xs font-medium text-rose-600">{geoError}</p>
      )}

      <div className="mt-3">
        <MapPicker
          coordinates={activeCoordinates}
          onChange={(coords) => handleCoordsChange(coords, true)}
        />
      </div>
    </div>
  );
}
