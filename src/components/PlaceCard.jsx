import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { categoryColor } from "../data/places";

export default function PlaceCard({ place }) {
  const { addToPlan, itinerary, favorites, toggleFavorite, isFavorite } =
    useApp();
  const inPlan = itinerary.some((it) => it.placeId === place.id);
  const fav = isFavorite(place.id);
  const color = categoryColor(place.category);

  return (
    <div className="place-card glass" style={{ "--cat": color }}>
      <Link to={`/place/${place.id}`} className="card-media">
        {place.image ? (
          <img src={place.image} alt={place.name} loading="lazy" />
        ) : (
          <div className="card-media-emoji">
            <span>{place.emoji}</span>
          </div>
        )}
        <button
          className={`fav-btn ${fav ? "on" : ""}`}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(place.id);
          }}
        >
          {fav ? "♥" : "♡"}
        </button>
        <span className="cat-chip" style={{ background: color }}>
          {place.category}
        </span>
      </Link>

      <div className="card-body">
        <h3 className="card-title">
          <Link to={`/place/${place.id}`}>{place.name}</Link>
        </h3>
        <div className="card-meta">
          <span className="dist">
            <span className="meta-ico">📍</span>
            {place.distanceKm} km
          </span>
          <span className="dur">
            <span className="meta-ico">⏱</span>
            ~{place.visitDurationMin} min
          </span>
        </div>
        <p className="card-desc">{place.description}</p>
        <div className="card-actions">
          <Link to={`/place/${place.id}`} className="btn btn-primary btn-sm">
            Details
          </Link>
          <button
            className={`btn ${inPlan ? "btn-added" : "btn-outline"} btn-sm`}
            onClick={() => addToPlan(place.id)}
            disabled={inPlan}
          >
            {inPlan ? "✓ In plan" : "+ Add to plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
