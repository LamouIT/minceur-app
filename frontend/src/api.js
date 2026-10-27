const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const KEY = "minceur-token";

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Serveur injoignable. S’il dormait, il se réveille : réessaie dans une minute.");
  }
  if (res.status === 401 && token) {
    setToken(null);
    window.location.href = "/";
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.detail) ? "Valeur invalide" : data.detail || "Erreur";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}
