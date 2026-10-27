import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { api, getToken, setToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Setup from "./pages/Setup.jsx";
import Today from "./pages/Today.jsx";
import WeightPage from "./pages/Weight.jsx";
import Tracking from "./pages/Tracking.jsx";
import Shopping from "./pages/Shopping.jsx";

const TABS = [
  ["/", "Aujourd’hui", "🍽"],
  ["/poids", "Poids", "⚖"],
  ["/suivi", "Suivi", "▦"],
  ["/courses", "Courses", "🛒"],
];

export default function App() {
  const [token, setTok] = useState(getToken());
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api("/me").then(setProfile).catch((e) => setError(e.message));
  }, [token]);

  const onLogin = (t) => { setToken(t); setTok(t); };
  const logout = () => { setToken(null); setTok(null); setProfile(null); };

  if (!token) return <Login onLogin={onLogin} />;
  if (!profile) return <div className="center">{error || "Chargement…"}</div>;
  if (!profile.start_date) return <Setup profile={profile} onDone={setProfile} />;

  return (
    <div className="shell">
      <header className="top">
        <h1>Mon suivi minceur</h1>
        <nav className="toptabs">
          {TABS.map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}
        </nav>
        <button className="link" onClick={logout}>Déconnexion</button>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Today profile={profile} />} />
          <Route path="/poids" element={<WeightPage profile={profile} onProfile={setProfile} />} />
          <Route path="/suivi" element={<Tracking profile={profile} />} />
          <Route path="/courses" element={<Shopping profile={profile} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <nav className="bottomtabs">
        {TABS.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end><span aria-hidden="true">{icon}</span>{label}</NavLink>
        ))}
      </nav>
    </div>
  );
}
