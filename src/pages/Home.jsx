import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import PlaceCard from "../components/PlaceCard.jsx";

export default function Home() {
  const { places } = useApp();
  const featured = [...places].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content glass-deep">
          <p className="eyebrow">Local Tourist Day-Visit Planner</p>
          <h1>
            Explore <span className="accent">Kalpitiya</span> in one day
          </h1>
          <p className="hero-sub">
            A curated guide to heritage, nature, water sports, and coastal gems
            — within 25 km of the Kalpitiya peninsula. Browse, plan, and pack a
            perfect single-day trip.
          </p>
          <div className="hero-actions">
            <Link to="/catalogue" className="btn btn-primary btn-lg">
              Browse the catalogue
            </Link>
            <Link to="/map" className="btn btn-glass btn-lg">
              Explore the map
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Featured places</h2>
          <Link to="/catalogue" className="link">
            View all →
          </Link>
        </div>
        <div className="card-grid">
          {featured.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      </section>

      <section className="home-steps">
        <div className="section-head">
          <h2>Plan your day in three steps</h2>
        </div>
        <div className="steps-grid">
          <div className="step-card glass">
            <span className="step-num">1</span>
            <h3>Browse &amp; filter</h3>
            <p>Search heritage forts, nature pools, or kite lagoons by category and interest.</p>
          </div>
          <div className="step-card glass">
            <span className="step-num">2</span>
            <h3>Build your plan</h3>
            <p>Add places, reorder stops, and set a start time. Travel estimates are filled in for you.</p>
          </div>
          <div className="step-card glass">
            <span className="step-num">3</span>
            <h3>Follow the map</h3>
            <p>See your stops on an interactive map and navigate with your favourite maps app.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
