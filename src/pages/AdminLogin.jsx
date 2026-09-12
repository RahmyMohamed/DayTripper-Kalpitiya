import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function AdminLogin() {
  const { isAdmin, login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (res.ok) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError(res.message || "Invalid username or password");
    }
  };

  return (
    <div className="page admin-login-page">
      <div className="login-card glass-deep">
        <div className="login-lock">🔐</div>
        <h1>Administrator sign in</h1>
        <p className="login-sub">
          Manage the DayTripper Kalpitiya attraction catalogue.
        </p>

        <form onSubmit={submit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="admin"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
          />

          {error && <p className="form-error">⚠ {error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-foot">Server credentials · admin / kalpitiya123</p>
      </div>
    </div>
  );
}