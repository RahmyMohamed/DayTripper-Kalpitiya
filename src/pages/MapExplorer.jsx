import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import MapWidget from "../components/MapWidget.jsx";
import { categoryColor } from "../data/places";

export default function MapExplorer() {
  const { places, itinerary, recommendedOrder } = useApp();
  const [filter, setFilter] = useState("All");
  const [showPlan, setShowPlan] = useState(true);

  const categories = useMemo(() => {
    const set = new Set(places.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [places]);

  const visible = useMemo(
    () => (filter === "All" ? places : places.filter((p) => p.category === filter)),
    [places, filter]
  );

  const byId = (id) => places.find((p) => p.id === id);

  const planPlaces = useMemo(
    () =>
      itinerary
        .map((it) => byId(it.placeId))
        .filter(Boolean)
        .filter((p) => p.latitude != null && p.longitude != null),
    [itinerary, places]
  );

  const orderedPlan = useMemo(
    () => recommendedOrder(planPlaces.map((p) => p.id)).map((id) => byId(id)),
    [planPlaces, recommendedOrder, places]
  );

  return (
    <div className="page map-page">
      <div className="page-title">
        <h1>Map explorer</h1>
        <p>See every attraction pinned on the Kalpitiya peninsula.</p>
      </div>

      <div className="map-layout glass">
        <aside className="map-sidebar">
          <h3>Filter pins</h3>
          <div className="cat-filters vertical">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${filter === c ? "active" : ""}`}
                style={c !== "All" && filter === c ? { background: categoryColor(c) } : {}}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <h3>My day plan</h3>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={showPlan}
              onChange={(e) => setShowPlan(e.target.checked)}
            />
            <span>Show plan route ({itinerary.length} stops)</span>
          </label>

          <div className="legend">
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <div className="legend-row" key={c}>
                  <span
                    className="legend-dot"
                    style={{ background: categoryColor(c) }}
                  />
                  <span>{c}</span>
                </div>
              ))}
          </div>
        </aside>

        <div className="map-main">
          <MapWidget
            places={showPlan && itinerary.length >= 2 ? orderedPlan : visible}
            markers
            polyline={showPlan && itinerary.length >= 2}
            height={520}
          />
          <p className="osm-credit">
            Map imagery © OpenStreetMap contributors
          </p>
        </div>
      </div>
    </div>
  );
}
