import { useEffect, useRef } from "react";
import L from "leaflet";
import { categoryColor } from "../data/places";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function createMarkerIcon(color) {
  const svg = `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>`;
  return L.divIcon({
    html: svg,
    className: "cat-marker",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
}

export default function MapWidget({
  places,
  center,
  zoom = 11,
  markers = true,
  polyline = false,
  height = 320,
  selectedId,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: center || [8.2, 79.78],
        zoom,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.remove();
    }
    layerRef.current = L.layerGroup();

    if (markers) {
      places.forEach((p) => {
        if (p.latitude == null || p.longitude == null) return;
        const icon = createMarkerIcon(
          selectedId === p.id ? "#ef4444" : categoryColor(p.category)
        );
        const marker = L.marker([p.latitude, p.longitude], { icon })
          .addTo(layerRef.current)
          .bindPopup(
            `<strong>${p.name}</strong><br/>${p.category} · ${p.distanceKm} km`
          );
        marker._placeId = p.id;
      });
    }

    if (polyline && places.length > 1) {
      const latlngs = places
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => [p.latitude, p.longitude]);
      if (latlngs.length > 1) {
        L.polyline(latlngs, { color: "#3b82f6", weight: 4, dashArray: "6 6" }).addTo(
          layerRef.current
        );
      }
    }

    layerRef.current.addTo(map);

    if (markers) {
      const valid = places.filter(
        (p) => p.latitude != null && p.longitude != null
      );
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      } else {
        map.setView(center || [8.2, 79.78], zoom);
      }
    } else if (center) {
      map.setView(center, zoom || 14);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, markers, polyline, center, zoom, selectedId]);

  return (
    <div
      ref={containerRef}
      className="map-widget"
      style={{ height }}
    />
  );
}
