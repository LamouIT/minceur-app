import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { addDays, diffDays, iso, longDate } from "../utils.js";

function Check({ checked, onChange, label, children }) {
  return (
    <label className="cb">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="box" />
      {children && <span>{children}</span>}
    </label>
  );
}

export default function Today({ profile }) {
  const [params, setParams] = useSearchParams();
  const first = profile.start_date, last = addDays(first, 27);
  const clamp = (d) => (d < first ? first : d > last ? last : d);
  const date = clamp(params.get("date") || iso(new Date()));
  const [day, setDay] = useState(null);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDay(null); setError("");
    api(`/plan/day/${date}`).then((d) => { setDay(d); setWeight(d.weight ?? ""); }).catch((e) => setError(e.message));
  }, [date]);

  const go = (n) => setParams({ date: addDays(date, n) });

  async function toggleMeal(slot, done) {
    setDay((d) => ({ ...d, meals: d.meals.map((m) => (m.slot === slot ? { ...m, done } : m)) }));
    try { await api(`/plan/day/${date}/meal/${slot}`, { method: "PUT", body: { done } }); }
    catch (e) { setError(e.message); }
  }
  async function toggleHabit(id, done) {
    setDay((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, done } : h)) }));
    try { await api(`/plan/day/${date}/habit/${id}`, { method: "PUT", body: { done } }); }
    catch (e) { setError(e.message); }
  }
  async function saveWeight() {
    const kg = Number(weight);
    if (!(kg >= 30 && kg <= 250)) return;
    await api(`/weights/${date}`, { method: "PUT", body: { kg } });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  const idx = diffDays(date, first);
  const before = iso(new Date()) < first;
  const sum = (f) => (day ? day.meals.reduce((a, m) => a + (f(m) || 0), 0) : 0);
  const plan = sum((m) => m.kcal), eaten = sum((m) => m.done && m.kcal);
  const pPlan = sum((m) => m.protein), pEaten = sum((m) => m.done && m.protein);

  return (
    <section>
      <div className="daynav">
        <button className="iconbtn" onClick={() => go(-1)} disabled={date === first} aria-label="Jour précédent">‹</button>
        <h2>{longDate(date)}<small>Semaine {Math.floor(idx / 7) + 1}, jour {(idx % 7) + 1} sur 7</small></h2>
        <button className="iconbtn" onClick={() => go(1)} disabled={date === last} aria-label="Jour suivant">›</button>
      </div>
      {before && <p className="note">Ton programme commence le {longDate(first)}. Tu peux déjà préparer tes courses.</p>}
      {error && <p className="error">{error}</p>}
      {!day ? <p className="note">Chargement…</p> : (
        <>
          <div className="card">
            <div className="kbar"><span>Mangé : {eaten} kcal</span><span>Prévu : {plan} kcal</span></div>
            <div className="bar"><span style={{ width: `${(eaten / plan) * 100}%` }} /></div>
            <div className="kbar" style={{ marginTop: 12 }}><span>Protéines : {pEaten} g</span><span>Prévu : {pPlan} g</span></div>
            <div className="bar"><span className="pbar" style={{ width: `${(pEaten / pPlan) * 100}%` }} /></div>
          </div>
          <div className="card">
            {day.meals.map((m) => (
              <div key={m.slot} className={`meal ${m.done ? "done" : ""}`}>
                <time>{m.time.replace(":", "h")}</time>
                <div><div className="kind">{m.type}</div><div className="name">{m.name}</div></div>
                <div className="tick">
                  <span className="pill">{m.kcal} kcal</span>
                  <span className="pill prot">{m.protein} g protéines</span>
                  <Check checked={m.done} onChange={(v) => toggleMeal(m.slot, v)} label={`${m.name} mangé`} />
                </div>
                <details>
                  <summary>Voir la recette</summary>
                  <ul>{m.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
                  <p>{m.recipe}</p>
                </details>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="sec">Mes habitudes du jour</h3>
            <div className="habits">
              {day.habits.map((h) => <Check key={h.id} checked={h.done} onChange={(v) => toggleHabit(h.id, v)}>{h.label}</Check>)}
            </div>
          </div>
          <div className="card">
            <h3 className="sec">Pesée du jour</h3>
            <div className="row">
              <label className="fld">Poids (kg)<input type="number" step="0.1" min="30" max="250" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
              <button className="btn" onClick={saveWeight}>{saved ? "Enregistré ✓" : "Enregistrer"}</button>
            </div>
            <p className="note">Idéalement le samedi matin, à jeun.</p>
          </div>
        </>
      )}
    </section>
  );
}
