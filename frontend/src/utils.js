export const DAY = 864e5;
export const iso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const parseISO = (s) => new Date(s + "T12:00:00");
export const addDays = (s, n) => iso(new Date(parseISO(s).getTime() + n * DAY));
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / DAY);
export const longDate = (s) => parseISO(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const shortDate = (s) => parseISO(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
export const num = (n) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
export const DA = (n) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " DA";
export const expectedLoss = (w) => (w <= 0 ? 0 : 1.25 + (w - 1) * 0.7);
export const nextSaturday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return iso(d);
};
export function programIndex(profile, dateStr = iso(new Date())) {
  return diffDays(dateStr, profile.start_date);
}
