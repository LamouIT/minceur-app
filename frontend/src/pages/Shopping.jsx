import { useEffect, useState } from "react";
import { api } from "../api.js";
import { DA, addDays, diffDays, iso, shortDate } from "../utils.js";

export default function Shopping({ profile }) {
  const cur = Math.min(3, Math.max(0, Math.floor(diffDays(iso(new Date()), profile.start_date) / 7)));
  const [week, setWeek] = useState(cur + 1);
  const [list, setList] = useState(null);
  const [spend, setSpend] = useState(null);
  const [onlyLeft, setOnlyLeft] = useState(false);
  const [error, setError] = useState("");

  const loadSpend = () => api("/spending").then(setSpend).catch(() => {});
  useEffect(() => {
    setList(null);
    api(`/shopping/${week}`).then(setList).catch((e) => setError(e.message));
    loadSpend();
  }, [week]);

  const patchItem = (key, patch) =>
    setList((l) => ({ ...l, categories: l.categories.map((c) => ({ ...c, items: c.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) })) }));

  async function toggle(key, checked) {
    patchItem(key, { checked });
    try { await api(`/shopping/${week}/${key}`, { method: "PUT", body: { checked } }); } catch (e) { setError(e.message); }
  }
  async function savePrice(key, raw) {
    const body = raw === "" ? { clear_price: true } : { price: Number(raw) };
    if (raw !== "" && !(Number(raw) >= 0)) return;
    patchItem(key, { price: raw === "" ? null : Number(raw) });
    try { await api(`/shopping/${week}/${key}`, { method: "PUT", body }); loadSpend(); } catch (e) { setError(e.message); }
  }
  async function reset() {
    await api(`/shopping/${week}/reset`, { method: "POST" });
    setList((l) => ({ ...l, categories: l.categories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, checked: false })) })) }));
  }

  const sat = (w) => addDays(profile.start_date, (w - 1) * 7);
  const all = list ? list.categories.flatMap((c) => c.items) : [];
  const done = all.filter((i) => i.checked).length;
  const weekTotal = all.reduce((a, i) => a + (i.price || 0), 0);

  return (
    <section>
      <div className="chips" role="tablist">
        {[1, 2, 3, 4].map((w) => (
          <button key={w} role="tab" aria-selected={w === week} onClick={() => setWeek(w)}>Samedi {shortDate(sat(w))}</button>
        ))}
      </div>
      <div className="stats noprint">
        <div className="stat"><b>{DA(weekTotal)}</b><span>Dépensé le samedi {shortDate(sat(week))}</span></div>
        <div className="stat"><b>{spend ? DA(spend.month) : "–"}</b><span>Dépensé sur le mois</span></div>
        <div className="stat"><b>{spend && spend.average ? DA(spend.average) : "–"}</b><span>Moyenne par semaine</span></div>
      </div>
      <div className="toolbar noprint">
        <button className="btn" aria-pressed={onlyLeft} onClick={() => setOnlyLeft(!onlyLeft)}>
          {onlyLeft ? "Afficher toute la liste" : "Afficher ce qui reste à acheter"}
        </button>
        <button className="btn ghost" onClick={() => window.print()}>Imprimer la liste</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <h2 className="printtitle">Courses du samedi {shortDate(sat(week))}{onlyLeft ? " (reste à acheter)" : ""}</h2>
        {!list ? <p className="note">Chargement…</p> : (
          <>
            <p className="note">{onlyLeft ? `Il reste ${all.length - done} article(s) à acheter sur ${all.length}.` : `${done} article(s) sur ${all.length} dans le panier.`}</p>
            <div className="shophead"><span /><span>Article</span><span>Quantité</span><span>Prix (DA)</span></div>
            {list.categories.map((c) => {
              const items = onlyLeft ? c.items.filter((i) => !i.checked) : c.items;
              if (!items.length) return null;
              return (
                <div className="shopcat" key={c.name}>
                  <h3>{c.name}</h3>
                  <ul>
                    {items.map((i) => (
                      <li key={i.key} className={i.checked ? "got" : ""}>
                        <label className="cb">
                          <input type="checkbox" checked={i.checked} onChange={(e) => toggle(i.key, e.target.checked)} aria-label={i.label} />
                          <span className="box" />
                        </label>
                        <span className="t" data-q={i.qty}>{i.label}</span>
                        <span className="q">{i.qty}</span>
                        <input className="price" type="number" min="0" step="1" inputMode="decimal" placeholder="—"
                          defaultValue={i.price ?? ""} onBlur={(e) => savePrice(i.key, e.target.value)} aria-label={`Prix de ${i.label} en dinars`} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <div className="shoptotal"><span>Total de la semaine</span><span>{DA(weekTotal)}</span></div>
            <button className="btn ghost noprint" style={{ marginTop: 12 }} onClick={reset}>Tout décocher pour cette semaine</button>
          </>
        )}
      </div>
    </section>
  );
}
