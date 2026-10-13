"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ListingMapProps {
  lat: number;
  lon: number;
  title: string;
  location: string;
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const earthRadius = 6371;
  const latDiff = ((lat2 - lat1) * Math.PI) / 180;
  const lonDiff = ((lon2 - lon1) * Math.PI) / 180;

  const part1 = Math.sin(latDiff / 2) * Math.sin(latDiff / 2);
  const part2 =
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(lonDiff / 2) *
    Math.sin(lonDiff / 2);

  const angle = 2 * Math.atan2(Math.sqrt(part1 + part2), Math.sqrt(1 - (part1 + part2)));
  return (earthRadius * angle).toFixed(2);
}

export default function ListingMap({ lat, lon, title, location }: ListingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDisposed = false;

    // Validate coordinates, fallback to default (Delhi center) if missing/invalid
    const validLat = typeof lat === "number" && !isNaN(lat) && lat !== 0 ? lat : 28.6139;
    const validLon = typeof lon === "number" && !isNaN(lon) && lon !== 0 ? lon : 77.209;

    // Clean up any existing map instance on container
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore cleanup error
      }
      mapInstanceRef.current = null;
    }

    // Initialize map with full zoom and drag interactions enabled
    const map = L.map(containerRef.current, {
      center: [validLat, validLon],
      zoom: 13,
      minZoom: 3,
      maxZoom: 19,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const createPin = (color = "#2563eb") =>
      L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; transform: translate(-50%, -100%); filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));">
            <svg width="30" height="38" viewBox="0 0 24 32" fill="${color}" stroke="#ffffff" stroke-width="1.2">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"/>
              <circle cx="12" cy="11" r="4.2" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -34],
      });

    // Add listing marker
    const listingMarker = L.marker([validLat, validLon], { icon: createPin("#2563eb") }).addTo(map);
    listingMarker.bindPopup(`
      <div style="font-family: inherit; padding: 2px 1px;">
        <h4 style="margin: 0 0 3px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${title}</h4>
        <p style="margin: 0; font-size: 12px; color: #64748b;">${location}</p>
      </div>
    `);

    // Invalidate size once DOM finishes painting so drag/pan tiles work immediately
    const invalidateTimer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    // Geolocation to draw distance route from user location
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isDisposed || !mapInstanceRef.current) return;

          try {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const userMarker = L.marker([userLat, userLon], {
              icon: createPin("#0284c7"),
            }).addTo(map);
            userMarker.bindPopup("Your Location");

            const line = L.polyline(
              [
                [userLat, userLon],
                [validLat, validLon],
              ],
              {
                color: "#2563eb",
                weight: 3,
                opacity: 0.85,
              }
            ).addTo(map);

            map.fitBounds(line.getBounds(), { padding: [50, 50] });

            const distance = getDistanceInKm(userLat, userLon, validLat, validLon);
            const midLat = (userLat + validLat) / 2;
            const midLon = (userLon + validLon) / 2;

            L.popup()
              .setLatLng([midLat, midLon])
              .setContent(
                `<div style="font-family: inherit; font-size: 12px; font-weight: 700; color: #0f172a; padding: 2px 4px;">Distance: ${distance} km</div>`
              )
              .openOn(map);
          } catch (geoErr) {
            console.warn("Could not display route on map:", geoErr);
          }
        },
        () => {
          // Geolocation was denied or unavailable - show listing location popup
          if (!isDisposed && mapInstanceRef.current) {
            try {
              listingMarker.openPopup();
            } catch {
              // ignore
            }
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      listingMarker.openPopup();
    }

    return () => {
      isDisposed = true;
      clearTimeout(invalidateTimer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lon, title, location]);

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full rounded-[22px] overflow-hidden relative z-0 cursor-grab active:cursor-grabbing"
      style={{ minHeight: "320px", height: "320px", width: "100%" }}
    />
  );
}
