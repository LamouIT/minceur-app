import { useState } from "react";
import { api } from "../api.js";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const { token } = await api(path, { method: "POST", body });
      onLogin(token);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <div className="auth">
      <h1>Mon suivi minceur</h1>
      <p className="note">Menus, courses, poids et habitudes, au même endroit.</p>
      <form className="card" onSubmit={submit}>
        {mode === "register" && (
          <label className="fld">Prénom<input value={form.name} onChange={set("name")} autoComplete="given-name" /></label>
        )}
        <label className="fld">E-mail<input type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></label>
        <label className="fld">Mot de passe<input type="password" required minLength={6} value={form.password} onChange={set("password")}
          autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Patiente…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
      </button>
    </div>
  );
}
