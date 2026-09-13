import { useEffect, useRef } from "react";
import L from "leaflet";

export const KALPITIYA_CENTER = [8.23, 79.78];

const round = (n) => Math.round(n * 10000) / 10000;

const pickerIcon = L.divIcon({
  html: '<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#3b82f6"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>',
  className: "cat-marker",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export default function PlaceMapPicker({ value, onChange, height = 320 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const lat = Number.parseFloat(value?.latitude);
  const lng = Number.parseFloat(value?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: KALPITIYA_CENTER,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(KALPITIYA_CENTER, {
      draggable: true,
      icon: pickerIcon,
    }).addTo(map);

    marker.on("dragend", () => {
      const { lat: mlat, lng: mlng } = marker.getLatLng();
      onChange(round(mlat), round(mlng));
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      onChange(round(e.latlng.lat), round(e.latlng.lng));
    });

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasCoords && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng, hasCoords]);

  return (
    <div className="map-picker">
      <div ref={containerRef} className="map-widget" style={{ height }} />
      <div className="map-picker-coords">
        <label className="field">
          <span>Latitude</span>
          <input
            type="number"
            step="0.0001"
            value={value?.latitude ?? ""}
            onChange={(e) => onChange(e.target.value, value?.longitude)}
            placeholder="8.2300"
          />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input
            type="number"
            step="0.0001"
            value={value?.longitude ?? ""}
            onChange={(e) => onChange(value?.latitude, e.target.value)}
            placeholder="79.7800"
          />
        </label>
      </div>
      <p className="geo-hint">
        Click the map to drop a pin, or drag the pin to fine-tune. Centered on
        Kalpitiya, Puttalam.
      </p>
    </div>
  );
}