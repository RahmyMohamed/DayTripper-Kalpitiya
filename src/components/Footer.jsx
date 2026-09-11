import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function Footer() {
  const { itinerary } = useApp();
  return (
    <footer className="site-footer glass">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">DayTripper Kalpitiya</p>
          <p className="footer-note">
            A student project for ITE2953 (Programming Group Project) — not an
            official government tourism portal. Attractions within a 25 km
            radius of Kalpitiya, Puttalam District, Sri Lanka.
          </p>
        </div>
        <div className="footer-links">
          <span>© OpenStreetMap contributors</span>
          <span className="divider">·</span>
          <Link to="/day-plan">My Day ({itinerary.length})</Link>
          <span className="divider">·</span>
          <span>SR | LKR (UTC+05:30)</span>
        </div>
      </div>
    </footer>
  );
}
