import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import PlaceCard from "../components/PlaceCard.jsx";
import { INTERESTS, INTEREST_MAP, categoryColor } from "../data/places";

export default function Catalogue() {
  const { places, loading, loadingError, refreshPlaces } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [interest, setInterest] = useState(null);
  const [sort, setSort] = useState("distance");

  const categories = useMemo(() => {
    const set = new Set(places.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [places]);

  const filtered = useMemo(() => {
    let list = places;

    if (category !== "All") list = list.filter((p) => p.category === category);

    if (interest) {
      const cats = new Set(INTEREST_MAP[interest] || []);
      if (cats.size) list = list.filter((p) => cats.has(p.category));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.accessNotes || "").toLowerCase().includes(q)
      );
    }

    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => a.distanceKm - b.distanceKm);

    return list;
  }, [places, category, interest, query, sort]);

  return (
    <div className="page catalogue-page">
      <div className="page-title">
        <h1>Attraction catalogue</h1>
        <p>
          {filtered.length} of {places.length} places
        </p>
      </div>

      <div className="toolbar glass">
        <div className="search-box">
          <span className="search-ico">🔍</span>
          <input
            type="search"
            placeholder="Search by name or keyword… e.g. kite"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search places"
          />
        </div>

        <div className="toolbar-controls">
          <select
            value={interest || ""}
            onChange={(e) => setInterest(e.target.value || null)}
            aria-label="Filter by interest"
          >
            <option value="">All interests</option>
            {INTERESTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort places"
          >
            <option value="distance">Sort: nearest first</option>
            <option value="name">Sort: name A–Z</option>
          </select>
        </div>
      </div>

      <div className="cat-filters" role="group" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "active" : ""}`}
            style={c !== "All" && category === c ? { background: categoryColor(c) } : {}}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state glass">
          <div className="empty-emoji">⏳</div>
          <h3>Loading the catalogue…</h3>
        </div>
      ) : loadingError ? (
        <div className="empty-state glass">
          <div className="empty-emoji">📡</div>
          <h3>Couldn't reach the API</h3>
          <p>{loadingError}</p>
          <button className="btn btn-primary" onClick={() => refreshPlaces()}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-emoji">🏝️</div>
          <h3>No places match this category</h3>
          <p>
            Try clearing filters or searching for something else.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setCategory("All");
              setInterest(null);
              setQuery("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </div>
  );
}
