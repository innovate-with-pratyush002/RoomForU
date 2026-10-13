"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  coordinates: { lat: number; lon: number } | null;
  onChange: (coords: { lat: number; lon: number }) => void;
}

export default function MapPicker({ coordinates, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultLat = 28.6139; // Delhi
  const defaultLon = 77.209;

  const currentLat = coordinates?.lat ?? defaultLat;
  const currentLon = coordinates?.lon ?? defaultLon;

  const pinIcon = L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; transform: translate(-50%, -100%); cursor: grab; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: #ea580c; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(234,88,12,0.45); border: 2.5px solid white;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -38],
  });

  useEffect(() => {
    if (!containerRef.current) return;
    let isDisposed = false;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [currentLat, currentLon],
      zoom: coordinates ? 15 : 12,
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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([currentLat, currentLon], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup("Drag pin or click map to set location");

    marker.on("dragend", () => {
      if (isDisposed) return;
      const pos = marker.getLatLng();
      onChange({ lat: Number(pos.lat.toFixed(6)), lon: Number(pos.lng.toFixed(6)) });
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (isDisposed) return;
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ lat: Number(lat.toFixed(6)), lon: Number(lng.toFixed(6)) });
    });

    const timer = setTimeout(() => {
      if (!isDisposed && mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!coordinates || !mapInstanceRef.current || !markerRef.current) return;
    const currentMarkerPos = markerRef.current.getLatLng();
    if (
      Math.abs(currentMarkerPos.lat - coordinates.lat) > 0.0001 ||
      Math.abs(currentMarkerPos.lng - coordinates.lon) > 0.0001
    ) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lon]);
      mapInstanceRef.current.setView([coordinates.lat, coordinates.lon], 15);
    }
  }, [coordinates]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full rounded-3xl border border-slate-300/40 shadow-inner sm:h-[400px] relative z-0 cursor-grab active:cursor-grabbing overflow-hidden"
      style={{ minHeight: "360px", height: "360px", width: "100%" }}
    />
  );
}
