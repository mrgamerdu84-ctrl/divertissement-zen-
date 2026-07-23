const TP_PROFILE_KEY = "zenplus-profil";
const TP_SEARCH_KEY = "zenplus-transport-recherche";

const tpRead = (key, fallback = {}) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};
const tpSave = (value) => {
  try { localStorage.setItem(TP_SEARCH_KEY, JSON.stringify(value)); } catch { /* stockage facultatif */ }
};
const tpEsc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const tpNorm = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const tpSlug = (value = "") => tpNorm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const tpOpen = (url) => window.open(url, "_blank", "noopener,noreferrer");

function tpDefaultCity() {
  const profile = tpRead(TP_PROFILE_KEY);
  if (profile.villeExacte?.trim()) return profile.villeExacte.trim();
  const selects = [...document.querySelectorAll("select")];
  return selects.find((s) => s.value && !/^\d|2A|2B/.test(s.value))?.value || "Aix-en-Provence";
}

function tpInstallStyles() {
  if (document.getElementById("zenplus-transports-css")) return;
  const style = document.createElement("style");
  style.id = "zenplus-transports-css";
  style.textContent = `
  [data-tp-open]{position:fixed;left:14px;bottom:18px;z-index:44;border:0;border-radius:18px;padding:8px 13px 8px 8px;display:flex;align-items:center;gap:9px;background:var(--zen-primary,#16302B);color:#fff;box-shadow:0 10px 30px #0004;font:700 13px system-ui;cursor:pointer}
  [data-tp-open] b{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:var(--zen-accent,#F4B740);font-size:20px}[data-tp-open] small{display:block;font-size:10px;opacity:.72}
  [data-tp-overlay]{position:fixed;inset:0;z-index:90;background:#0008;display:flex;align-items:flex-end;justify-content:center}
  [data-tp-modal]{width:100%;max-height:94vh;overflow:auto;border-radius:28px 28px 0 0;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B)}
  [data-tp-head]{position:sticky;top:0;z-index:2;padding:18px 20px;background:var(--zen-primary,#16302B);color:#fff;display:flex;justify-content:space-between;align-items:center}
  [data-tp-head] h2{margin:0;font:700 23px Fraunces,serif}[data-tp-head] p{margin:3px 0 0;font:500 12px system-ui;opacity:.75}[data-tp-close]{border:0;border-radius:13px;width:40px;height:40px;background:#fff2;color:#fff;font-size:25px}
  [data-tp-body]{padding:18px;display:grid;gap:14px}.tp-card{background:#fff;border-radius:20px;padding:16px;box-shadow:0 2px 10px #0001}.tp-card h3{margin:0 0 11px;font:700 17px Fraunces,serif}
  .tp-grid{display:grid;gap:10px}.tp-datetime{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.tp-field{display:grid;gap:6px;font:700 12px system-ui}.tp-field input{box-sizing:border-box;width:100%;border:1px solid #16302B33;border-radius:13px;padding:12px;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B);font:500 14px system-ui;outline:0}
  .tp-actions{display:grid;gap:9px}.tp-action{border:0;border-radius:15px;padding:13px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--zen-primary,#16302B);color:#fff;font:700 13px system-ui;cursor:pointer}.tp-action.alt{background:var(--zen-action,#EF5F4E)}.tp-action.light{background:var(--zen-soft,#E4EFE3);color:var(--zen-primary,#16302B)}.tp-action i{font-style:normal;font-size:20px}.tp-note{margin:10px 0 0;font:500 11px/1.45 system-ui;opacity:.68}.tp-error{display:none;margin-top:9px;padding:9px;border-radius:12px;background:#fff1ef;color:#a9342b;font:700 12px system-ui}.tp-aix{display:none;border-left:4px solid var(--zen-accent,#F4B740)}
  @media(min-width:680px){[data-tp-overlay]{align-items:center;padding:20px}[data-tp-modal]{max-width:620px;border-radius:28px}.tp-grid,.tp-actions{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

function tpOpenModal() {
  if (document.querySelector("[data-tp-overlay]")) return;
  const profile = tpRead(TP_PROFILE_KEY);
  const saved = tpRead(TP_SEARCH_KEY);
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const start = saved.depart || profile.villeExacte || tpDefaultCity();
  const overlay = document.createElement("div");
  overlay.dataset.tpOverlay = "";
  overlay.innerHTML = `
  <section data-tp-modal role="dialog" aria-modal="true">
    <header data-tp-head><div><h2>Mes transports</h2><p>Bus, tram, métro et train partout en France</p></div><button data-tp-close>×</button></header>
    <div data-tp-body>
      <section class="tp-card"><h3>Préparer mon trajet</h3><div class="tp-grid">
        <label class="tp-field">Ville de départ<input data-tp-from value="${tpEsc(start)}" placeholder="Aix-en-Provence"></label>
        <label class="tp-field">Destination<input data-tp-to value="${tpEsc(saved.arrivee || "")}" placeholder="Marseille, Paris…"></label>
      </div><div class="tp-datetime">
        <label class="tp-field">Date<input data-tp-date type="date" value="${tpEsc(saved.date || localDate)}"></label>
        <label class="tp-field">Heure<input data-tp-time type="time" value="${tpEsc(saved.heure || now.toTimeString().slice(0,5))}"></label>
      </div><div class="tp-error" data-tp-error>Ajoutez une destination pour rechercher un trajet.</div></section>
      <section class="tp-card"><h3>Horaires et itinéraires</h3><div class="tp-actions">
        <button class="tp-action" data-tp-transit><i>🚌</i><span>Bus, tram et métro<br><small>Itinéraire en transports</small></span><span>›</span></button>
        <button class="tp-action alt" data-tp-train><i>🚆</i><span>Horaires de train<br><small>SNCF Connect</small></span><span>›</span></button>
        <button class="tp-action light" data-tp-near><i>📍</i><span>Gares et arrêts proches<br><small>Autour du départ</small></span><span>›</span></button>
        <button class="tp-action light" data-tp-local><i>🗺️</i><span>Réseaux officiels<br><small>Bus locaux et régionaux</small></span><span>›</span></button>
      </div><p class="tp-note">Les horaires, retards et perturbations sont fournis par les opérateurs. Les réseaux sans temps réel affichent leurs horaires théoriques.</p></section>
      <section class="tp-card tp-aix" data-tp-aix><h3>Aix-en-Provence</h3><div class="tp-actions">
        <button class="tp-action" data-tp-aixenbus><i>🚌</i><span>Horaires Aix en Bus<br><small>Lignes et arrêts</small></span><span>›</span></button>
        <button class="tp-action light" data-tp-metropole><i>ℹ️</i><span>Info trafic Métropole<br><small>Perturbations</small></span><span>›</span></button>
      </div></section>
    </div>
  </section>`;

  const from = overlay.querySelector("[data-tp-from]");
  const to = overlay.querySelector("[data-tp-to]");
  const date = overlay.querySelector("[data-tp-date]");
  const time = overlay.querySelector("[data-tp-time]");
  const error = overlay.querySelector("[data-tp-error]");
  const aix = overlay.querySelector("[data-tp-aix]");
  const values = () => {
    const value = { depart: from.value.trim(), arrivee: to.value.trim(), date: date.value, heure: time.value };
    tpSave(value); return value;
  };
  const withDestination = (action) => {
    const value = values();
    if (!value.arrivee) { error.style.display = "block"; to.focus(); return; }
    error.style.display = "none"; action(value);
  };
  const updateAix = () => { aix.style.display = tpNorm(from.value).includes("aix-en-provence") || tpNorm(from.value).includes("aix en provence") ? "block" : "none"; };
  const close = () => overlay.remove();
  overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
  overlay.querySelector("[data-tp-close]").onclick = close;
  overlay.querySelector("[data-tp-transit]").onclick = () => withDestination(({depart, arrivee}) => {
    const p = new URLSearchParams({api:"1",travelmode:"transit",destination:arrivee}); if (depart) p.set("origin",depart); tpOpen(`https://www.google.com/maps/dir/?${p}`);
  });
  overlay.querySelector("[data-tp-train]").onclick = () => withDestination(({depart, arrivee}) => tpOpen(`https://www.sncf-connect.com/train/horaires/${tpSlug(depart)}/${tpSlug(arrivee)}`));
  overlay.querySelector("[data-tp-near]").onclick = () => tpOpen(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`gare ou arrêt de bus ${values().depart || "près de moi"}`)}`);
  overlay.querySelector("[data-tp-local]").onclick = () => tpOpen(`https://transport.data.gouv.fr/datasets?q=${encodeURIComponent(values().depart)}&type=public-transit`);
  overlay.querySelector("[data-tp-aixenbus]").onclick = () => tpOpen("https://www.aixenbus.fr/fr/vkN-horaires.html");
  overlay.querySelector("[data-tp-metropole]").onclick = () => tpOpen("https://www.plan.lametropolemobilite.fr/fr/");
  from.addEventListener("input", updateAix);
  [from,to,date,time].forEach((field) => field.addEventListener("change", values));
  document.body.appendChild(overlay); updateAix();
}

function tpCreateButton() {
  if (document.querySelector("[data-tp-open]")) return;
  const button = document.createElement("button");
  button.dataset.tpOpen = "";
  button.setAttribute("aria-label", "Ouvrir les horaires de bus et de train");
  button.innerHTML = "<b>🚆</b><span><small>Horaires & trajets</small>Transports</span>";
  button.onclick = tpOpenModal;
  document.body.appendChild(button);
}

tpInstallStyles();
window.addEventListener("DOMContentLoaded", tpCreateButton);
if (document.readyState !== "loading") tpCreateButton();
