import { useState } from "react";
import { api } from "../api.js";
import { nextSaturday } from "../utils.js";

export default function Setup({ profile, onDone }) {
  const [start, setStart] = useState(nextSaturday());
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState(profile.goal_kg || 10);
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    try {
      const body = { start_date: start, goal_kg: Number(goal) };
      if (weight) body.start_weight = Number(weight);
      onDone(await api("/me", { method: "PUT", body }));
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="auth">
      <h1>Bienvenue{profile.name ? ` ${profile.name}` : ""}</h1>
      <p className="note">Ton programme dure 4 semaines et commence un samedi, le jour des courses.</p>
      <form className="card" onSubmit={save}>
        <label className="fld">Samedi de départ<input type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="fld">Poids de départ (kg)<input type="number" step="0.1" min="30" max="250" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
        <label className="fld">Objectif à perdre (kg)<input type="number" step="0.5" min="1" max="60" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Commencer</button>
      </form>
    </div>
  );
}
