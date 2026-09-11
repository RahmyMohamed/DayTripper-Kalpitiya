import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const THEME_KEY = "daytripper-theme";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Header() {
  const { itinerary, favorites, isAdmin, logout } = useApp();
  const location = useLocation();
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark"
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* ignore storage errors */
    }
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 350);
    setTheme(next);
  };

  const navLink = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="DayTripper Logo" className="brand-logo" style={{ width: '38px', height: '38px' }} />
          <span className="brand-text">
            <strong>DayTripper</strong>
            <span className="brand-sub">Kalpitiya</span>
          </span>
        </Link>

        <nav className="nav-primary" aria-label="Primary">
          <NavLink to="/" className={navLink} end>
            Home
          </NavLink>
          <NavLink to="/catalogue" className={navLink}>
            Catalogue
          </NavLink>
          <NavLink to="/map" className={navLink}>
            Map
          </NavLink>
          <NavLink to="/day-plan" className={navLink}>
            My Day Plan
            {itinerary.length > 0 && (
              <span className="badge">{itinerary.length}</span>
            )}
          </NavLink>
          <NavLink to="/favorites" className={navLink}>
            Favorites
            {favorites.length > 0 && (
              <span className="badge badge-fav">{favorites.length}</span>
            )}
          </NavLink>
        </nav>

        <div className="nav-admin">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {isAdmin ? (
            <>
              <NavLink to="/admin/dashboard" className={navLink}>
                Dashboard
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/admin"
              className={navLink + " admin-link"}
              state={{ from: location.pathname }}
            >
              Admin
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
