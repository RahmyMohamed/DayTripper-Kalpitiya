import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import PlaceCard from "../components/PlaceCard.jsx";

export default function Favorites() {
  const { favorites, addAllFavorites, places } = useApp();

  const favPlaces = useMemo(
    () => places.filter((p) => favorites.includes(p.id)),
    [places, favorites]
  );

  return (
    <div className="page fav-page">
      <div className="page-title">
        <h1>Favorites</h1>
        <p>Places you've marked for your next pull-plan.</p>
      </div>

      {favPlaces.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-emoji">💙</div>
          <h3>No favorites yet</h3>
          <p>Tap the ♥ on any place card to save it here.</p>
          <Link to="/catalogue" className="btn btn-primary">
            Explore places
          </Link>
        </div>
      ) : (
        <>
          <div className="fav-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                const n = addAllFavorites();
                alert(
                  n > 0
                    ? `Added ${n} favorite place(s) to your day plan.`
                    : "Your favorites are already in the day plan."
                );
              }}
            >
              ➕ Add all favorites to day plan
            </button>
          </div>
          <div className="card-grid">
            {favPlaces.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}