import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { iso, longDate } from "../utils.js";

const DAYS = ["Sam", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven"];

export default function Tracking() {
  const [o, setO] = useState(null);
  const [error, setError] = useState("");
  const nav = useNavigate();
  useEffect(() => { api("/plan/overview").then(setO).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!o) return <p className="note">Chargement…</p>;
  const today = iso(new Date());
  return (
    <section>
      <div className="card">
        <h3 className="sec">Mes 4 semaines</h3>
        <p className="note">Chaque case montre les repas et habitudes cochés ce jour-là (sur 9). Touche un jour pour l’ouvrir.</p>
        <div className="grid">
          <div />
          {DAYS.map((d) => <div key={d} className="hd">{d}</div>)}
          {[0, 1, 2, 3].map((w) => [
            <div key={`w${w}`} className="wk">Sem. {w + 1}</div>,
            ...o.days.slice(w * 7, w * 7 + 7).map((d) => (
              <button key={d.date} className={`cell s${d.score >= 9 ? "full" : d.score ? "part" : "0"} ${d.date === today ? "today" : ""}`}
                onClick={() => nav(`/?date=${d.date}`)} aria-label={`${longDate(d.date)} : ${d.score} sur 9`}>
                {d.score || ""}
              </button>
            )),
          ])}
        </div>
        <div className="legend">
          <span><i className="sw0" />Rien coché</span><span><i className="swpart" />En partie</span><span><i className="swfull" />Journée complète</span>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><b>{o.full_days}</b><span>Journées complètes</span></div>
        <div className="stat"><b>{o.meals_done} / 140</b><span>Repas cochés</span></div>
        <div className="stat"><b>{o.water_days}</b><span>Jours à 2 L d’eau</span></div>
        <div className="stat"><b>{o.walk_days}</b><span>Jours de marche</span></div>
      </div>
    </section>
  );
}
