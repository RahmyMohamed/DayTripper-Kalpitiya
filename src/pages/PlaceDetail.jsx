import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import MapWidget from "../components/MapWidget.jsx";
import { categoryColor } from "../data/places";

export default function PlaceDetail() {
  const { id } = useParams();
  const {
    places,
    addToPlan,
    itinerary,
    toggleFavorite,
    isFavorite,
  } = useApp();

  const place = places.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="page empty-state glass">
        <h2>Place not found</h2>
        <Link to="/catalogue" className="btn btn-primary">
          Back to catalogue
        </Link>
      </div>
    );
  }

  const inPlan = itinerary.some((it) => it.placeId === place.id);
  const fav = isFavorite(place.id);
  const color = categoryColor(place.category);
  const geoUrl = `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=15/${place.latitude}/${place.longitude}`;

  const facts = [
    ["Distance from home", `${place.distanceKm} km`],
    ["Typical visit", `~${place.visitDurationMin} min`],
    ["Opening hours", place.openingHours],
    ["Entrance fee", place.entranceFee || "Information not yet available"],
  ];

  return (
    <div className="page detail-page">
      <div className="detail-hero" style={{ "--cat": color }}>
        {place.image && (
          <img src={place.image} alt={place.name} className="detail-hero-img" />
        )}
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <span className="cat-chip" style={{ background: color }}>
            {place.category}
          </span>
          <h1>{place.name}</h1>
          <p className="detail-sub">
            {place.distanceKm} km from the Kalpitiya home hub · ~
            {place.visitDurationMin} min visit
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => addToPlan(place.id)}
              disabled={inPlan}
            >
              {inPlan ? "✓ Already in your plan" : "+ Add to my day plan"}
            </button>
            <button
              className={`btn ${fav ? "btn-fav" : "btn-glass"}`}
              onClick={() => toggleFavorite(place.id)}
            >
              {fav ? "♥ Favourited" : "♡ Favourite"}
            </button>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel glass">
            <h2>About this place</h2>
            <p className="body-copy">{place.description}</p>
          </section>

          <section className="panel glass">
            <h2>Travel tips</h2>
            <p className="body-copy">{place.tips || "Information not yet available"}</p>
            {place.accessNotes && (
              <div className="note-box">
                <span className="note-ico">⚠️</span>
                <span>{place.accessNotes}</span>
              </div>
            )}
          </section>

          {(place.photographyTips || place.dressCode || place.culturalGuidelines) && (
            <section className="panel glass">
              <h2>Capture &amp; etiquette</h2>
              {place.photographyTips && (
                <div className="guideline">
                  <span className="g-ico">📷</span>
                  <div>
                    <strong>Photography tips</strong>
                    <p>{place.photographyTips}</p>
                  </div>
                </div>
              )}
              {place.dressCode && (
                <div className="guideline">
                  <span className="g-ico">👗</span>
                  <div>
                    <strong>Dress code</strong>
                    <p>{place.dressCode}</p>
                  </div>
                </div>
              )}
              {place.culturalGuidelines && (
                <div className="guideline">
                  <span className="g-ico">🙏</span>
                  <div>
                    <strong>Cultural guidelines</strong>
                    <p>{place.culturalGuidelines}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="panel glass">
            <h2>On the map</h2>
            <MapWidget
              places={[place]}
              markers
              height={300}
              selectedId={place.id}
            />
            <p className="geo-note">
              <span>📍</span> {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
            </p>
            <a
              className="btn btn-outline btn-sm"
              href={geoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open in OpenStreetMap ↗
            </a>
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel glass">
            <h2>Quick facts</h2>
            <dl className="fact-list">
              {facts.map(([k, v]) => (
                <div className="fact" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel glass">
            <h2>Nearby places</h2>
            <div className="nearby-list">
              {places
                .filter((p) => p.id !== place.id)
                .sort((a, b) => Math.abs(a.distanceKm - place.distanceKm) - Math.abs(b.distanceKm - place.distanceKm))
                .slice(0, 3)
                .map((p) => (
                  <Link to={`/place/${p.id}`} key={p.id} className="nearby-item">
                    {p.image ? (
                      <img src={p.image} alt="" style={{width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px'}} />
                    ) : (
                      <span className="nearby-emoji">{p.emoji}</span>
                    )}
                    <span className="nearby-name">{p.name}</span>
                    <span className="nearby-dist">{p.distanceKm} km</span>
                  </Link>
                ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="disclaimer-note glass">
        <span>ℹ️</span>
        <p>
          Marine wildlife trips, kitesurfing, swimming, and camping are
          weather- and operator-dependent. DayTripper does not operate tours,
          sell tickets, or issue navy permits. Fees shown are informational only.
        </p>
      </div>
    </div>
  );
}
