import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api.js";
import { addDays, diffDays, expectedLoss, iso, num, shortDate } from "../utils.js";

export default function WeightPage({ profile, onProfile }) {
  const [list, setList] = useState([]);
  const [startW, setStartW] = useState(profile.start_weight ?? "");
  const [goal, setGoal] = useState(profile.goal_kg);
  const [date, setDate] = useState(iso(new Date()));
  const [kg, setKg] = useState("");
  const [error, setError] = useState("");

  const load = () => api("/weights").then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function saveProfile() {
    const body = { goal_kg: Number(goal) };
    if (startW !== "") body.start_weight = Number(startW);
    try { onProfile(await api("/me", { method: "PUT", body })); } catch (e) { setError(e.message); }
  }
  async function add() {
    const v = Number(kg);
    if (!date || !(v >= 30 && v <= 250)) return;
    await api(`/weights/${date}`, { method: "PUT", body: { kg: v } });
    setKg(""); load();
    if (profile.start_weight == null) onProfile(await api("/me"));
  }
  async function remove(d) { await api(`/weights/${d}`, { method: "DELETE" }); load(); }

  const sw = profile.start_weight ?? list[0]?.kg;
  const last = list.length ? list[list.length - 1].kg : null;
  const lost = sw != null && last != null ? sw - last : null;
  const week = Math.min(4, Math.max(0, Math.ceil(diffDays(iso(new Date()), profile.start_date) / 7)));

  const data = useMemo(() => {
    if (sw == null) return [];
    const pts = {};
    for (let w = 0; w <= 4; w++) pts[addDays(profile.start_date, w * 7)] = { expected: +(sw - expectedLoss(w)).toFixed(1) };
    for (const e of list) pts[e.date] = { ...(pts[e.date] || {}), kg: e.kg };
    return Object.entries(pts).sort().map(([d, v]) => ({ date: d, label: shortDate(d), ...v }));
  }, [list, sw, profile.start_date]);

  return (
    <section>
      {error && <p className="error">{error}</p>}
      <div className="stats">
        <div className="stat"><b>{sw != null ? `${num(sw)} kg` : "–"}</b><span>Poids de départ</span></div>
        <div className="stat"><b>{last != null ? `${num(last)} kg` : "–"}</b><span>Dernière pesée</span></div>
        <div className="stat"><b>{lost != null ? `${lost >= 0 ? "−" : "+"}${num(Math.abs(lost))} kg` : "–"}</b><span>Perdu depuis le départ</span></div>
        <div className="stat"><b>{num(Math.max(profile.goal_kg - (lost || 0), 0))} kg</b><span>Reste pour l’objectif</span></div>
        {week > 0 && <div className="stat"><b>{num(expectedLoss(week))} kg</b><span>Repère fin de semaine {week}</span></div>}
      </div>
      <div className="card">
        <h3 className="sec">Ma courbe</h3>
        {data.length ? (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip formatter={(v, n) => [`${num(v)} kg`, n === "kg" ? "Mon poids" : "Repère"]} />
                <Line type="monotone" dataKey="expected" stroke="var(--saffron)" strokeDasharray="6 5" dot={false} connectNulls strokeWidth={2} />
                <Line type="monotone" dataKey="kg" stroke="var(--olive)" strokeWidth={3} connectNulls dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="note">Indique ton poids de départ pour voir ta courbe.</p>}
        <div className="legend"><span><i style={{ background: "var(--olive)" }} />Mon poids</span><span><i style={{ background: "var(--saffron)" }} />Repère attendu</span></div>
      </div>
      <div className="card">
        <h3 className="sec">Ajouter une pesée</h3>
        <div className="row">
          <label className="fld">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="fld">Poids (kg)<input type="number" step="0.1" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} /></label>
          <button className="btn" onClick={add}>Ajouter</button>
        </div>
        <table className="log">
          <tbody>
            {list.slice().reverse().map((e, i, arr) => {
              const prev = arr[i + 1]; const d = prev ? e.kg - prev.kg : null;
              return (
                <tr key={e.date}>
                  <td>{shortDate(e.date)}</td><td>{num(e.kg)} kg</td>
                  <td>{d == null ? "" : `${d <= 0 ? "−" : "+"}${num(Math.abs(d))} kg`}</td>
                  <td><button className="del" onClick={() => remove(e.date)}>Supprimer</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3 className="sec">Mon point de départ</h3>
        <div className="row">
          <label className="fld">Poids de départ (kg)<input type="number" step="0.1" value={startW} onChange={(e) => setStartW(e.target.value)} /></label>
          <label className="fld">Objectif à perdre (kg)<input type="number" step="0.5" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
          <button className="btn" onClick={saveProfile}>Enregistrer</button>
        </div>
      </div>
    </section>
  );
}
