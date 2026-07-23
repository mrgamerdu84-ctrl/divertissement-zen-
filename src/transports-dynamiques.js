const ZP_PROFILE = "zenplus-profil";
const ZP_TRANSPORT = "zenplus-transport";
const ZP_CITY = "zenplus-ville-transport";
const GEO_API = "https://geo.api.gouv.fr/communes";
const PAN_SEARCH = "https://transport.data.gouv.fr/datasets";

const read = (key, fallback = {}) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage facultatif */ }
};
const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const norm = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const slug = (value = "") => norm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const open = (url) => window.open(url, "_blank", "noopener,noreferrer");

function defaultCity() {
  const profile = read(ZP_PROFILE);
  if (profile.villeExacte?.trim()) return profile.villeExacte.trim();
  const active = read(ZP_CITY);
  if (active.nom?.trim()) return active.nom.trim();
  return "Paris";
}

function installStyles() {
  if (document.getElementById("zp-transport-css")) return;
  const style = document.createElement("style");
  style.id = "zp-transport-css";
  style.textContent = `
  [data-zpt-open]{position:fixed;left:14px;bottom:18px;z-index:44;border:0;border-radius:18px;padding:8px 13px 8px 8px;display:flex;align-items:center;gap:9px;background:var(--zen-primary,#16302B);color:#fff;box-shadow:0 10px 30px #0004;font:700 13px system-ui;cursor:pointer}
  [data-zpt-open] b{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:var(--zen-accent,#F4B740);font-size:20px}[data-zpt-open] small{display:block;font-size:10px;opacity:.72}
  [data-zpt-overlay]{position:fixed;inset:0;z-index:90;background:#0008;display:flex;align-items:flex-end;justify-content:center}
  [data-zpt-modal]{width:100%;max-height:94vh;overflow:auto;border-radius:28px 28px 0 0;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B)}
  [data-zpt-head]{position:sticky;top:0;z-index:4;padding:18px 20px;background:var(--zen-primary,#16302B);color:#fff;display:flex;justify-content:space-between;align-items:center}
  [data-zpt-head] h2{margin:0;font:700 23px Fraunces,serif}[data-zpt-head] p{margin:3px 0 0;font:500 12px system-ui;opacity:.75}[data-zpt-close]{border:0;border-radius:13px;width:40px;height:40px;background:#fff2;color:#fff;font-size:25px;cursor:pointer}
  [data-zpt-body]{padding:18px;display:grid;gap:14px}.zpt-card{background:#fff;border-radius:20px;padding:16px;box-shadow:0 2px 10px #0001}.zpt-card h3{margin:0 0 11px;font:700 17px Fraunces,serif}
  .zpt-field{position:relative;display:grid;gap:6px;font:700 12px system-ui}.zpt-field input{box-sizing:border-box;width:100%;border:1px solid #16302B33;border-radius:13px;padding:12px;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B);font:500 14px system-ui;outline:0}
  .zpt-suggestions{position:absolute;left:0;right:0;top:69px;z-index:8;display:none;overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 12px 30px #0003}.zpt-suggestions button{width:100%;border:0;border-bottom:1px solid #16302B12;padding:11px 12px;text-align:left;background:#fff;color:var(--zen-primary,#16302B);font:600 13px system-ui}.zpt-suggestions small{display:block;margin-top:2px;opacity:.62;font-size:10px}
  .zpt-status{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:center;margin-top:12px;padding:12px;border-radius:16px;background:var(--zen-soft,#E4EFE3)}.zpt-status i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--zen-accent,#F4B740);font-style:normal;font-size:21px}.zpt-status strong{display:block;font:800 14px system-ui}.zpt-status span{display:block;margin-top:3px;font:500 11px/1.35 system-ui;opacity:.7}
  .zpt-actions{display:grid;gap:9px}.zpt-action{border:0;border-radius:15px;padding:13px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--zen-primary,#16302B);color:#fff;font:700 13px system-ui;cursor:pointer}.zpt-action.alt{background:var(--zen-action,#EF5F4E)}.zpt-action.light{background:var(--zen-soft,#E4EFE3);color:var(--zen-primary,#16302B)}.zpt-action em{font-style:normal;font-size:20px}.zpt-action small{font-weight:500;opacity:.72}.zpt-grid{display:grid;gap:10px}.zpt-datetime{display:grid;grid-template-columns:1fr 1fr;gap:10px}.zpt-error{display:none;margin-top:9px;padding:9px;border-radius:12px;background:#fff1ef;color:#a9342b;font:700 12px system-ui}.zpt-note{margin:10px 0 0;font:500 11px/1.45 system-ui;opacity:.68}
  @media(min-width:680px){[data-zpt-overlay]{align-items:center;padding:20px}[data-zpt-modal]{max-width:650px;border-radius:28px}.zpt-actions,.zpt-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

async function searchCities(query) {
  const params = new URLSearchParams({
    nom: query.trim(),
    fields: "nom,code,codesPostaux,departement,region,epci,population",
    boost: "population",
    limit: "6",
  });
  const response = await fetch(`${GEO_API}?${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Recherche impossible");
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function panUrl(query) {
  const params = new URLSearchParams({ q: query, type: "public-transit" });
  return `${PAN_SEARCH}?${params}`;
}

function openModal() {
  if (document.querySelector("[data-zpt-overlay]")) return;
  const stored = read(ZP_TRANSPORT);
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const start = defaultCity();
  let activeCity = read(ZP_CITY, null);
  let timer;

  const overlay = document.createElement("div");
  overlay.dataset.zptOverlay = "";
  overlay.innerHTML = `
  <section data-zpt-modal role="dialog" aria-modal="true">
    <header data-zpt-head><div><h2>Mes transports</h2><p>La ville saisie active automatiquement son réseau</p></div><button data-zpt-close aria-label="Fermer">×</button></header>
    <div data-zpt-body>
      <section class="zpt-card"><h3>Ma ville actuelle</h3>
        <label class="zpt-field">Écrivez la ville où vous êtes
          <input data-zpt-city value="${esc(start)}" placeholder="Lyon, Lille, Bordeaux…" autocomplete="off">
          <div class="zpt-suggestions" data-zpt-suggestions></div>
        </label>
        <div class="zpt-status" data-zpt-status><i>📍</i><div><strong>Recherche de ${esc(start)}…</strong><span>Commune, métropole, département et région.</span></div></div>
      </section>

      <section class="zpt-card"><h3 data-zpt-title>Transports locaux</h3><div class="zpt-actions">
        <button class="zpt-action" data-zpt-bus><em>🚌</em><span>Horaires bus et tram<br><small data-zpt-bus-label>Ville active</small></span><span>›</span></button>
        <button class="zpt-action light" data-zpt-network><em>ℹ️</em><span>Réseau officiel local<br><small data-zpt-network-label>Intercommunalité</small></span><span>›</span></button>
        <button class="zpt-action light" data-zpt-region><em>🗺️</em><span>Transports régionaux<br><small data-zpt-region-label>Région active</small></span><span>›</span></button>
        <button class="zpt-action light" data-zpt-near><em>📍</em><span>Arrêts et gares proches<br><small data-zpt-near-label>Autour de la ville</small></span><span>›</span></button>
      </div><p class="zpt-note">Les horaires et perturbations viennent des opérateurs. Quand le temps réel n’existe pas, le réseau publie ses horaires théoriques.</p></section>

      <section class="zpt-card"><h3>Préparer un trajet</h3><div class="zpt-grid">
        <label class="zpt-field">Départ<input data-zpt-from value="${esc(start)}"></label>
        <label class="zpt-field">Destination<input data-zpt-to value="${esc(stored.arrivee || "")}" placeholder="Marseille, Paris…"></label>
      </div><div class="zpt-datetime" style="margin-top:10px">
        <label class="zpt-field">Date<input data-zpt-date type="date" value="${esc(stored.date || today)}"></label>
        <label class="zpt-field">Heure<input data-zpt-time type="time" value="${esc(stored.heure || now.toTimeString().slice(0, 5))}"></label>
      </div><div class="zpt-error" data-zpt-error>Ajoutez une destination.</div><div class="zpt-actions" style="margin-top:10px">
        <button class="zpt-action" data-zpt-route><em>🚌</em><span>Itinéraire en transports<br><small>Bus, tram et métro</small></span><span>›</span></button>
        <button class="zpt-action alt" data-zpt-train><em>🚆</em><span>Horaires de train<br><small>SNCF Connect</small></span><span>›</span></button>
      </div></section>
    </div>
  </section>`;

  const cityInput = overlay.querySelector("[data-zpt-city]");
  const from = overlay.querySelector("[data-zpt-from]");
  const to = overlay.querySelector("[data-zpt-to]");
  const date = overlay.querySelector("[data-zpt-date]");
  const time = overlay.querySelector("[data-zpt-time]");
  const status = overlay.querySelector("[data-zpt-status]");
  const suggestions = overlay.querySelector("[data-zpt-suggestions]");
  const error = overlay.querySelector("[data-zpt-error]");

  const persist = () => save(ZP_TRANSPORT, { depart: from.value.trim(), arrivee: to.value.trim(), date: date.value, heure: time.value });
  const activate = (city) => {
    activeCity = city;
    save(ZP_CITY, city);
    cityInput.value = city.nom;
    from.value = city.nom;
    suggestions.style.display = "none";
    persist();
    const area = [city.epci?.nom, city.departement?.nom, city.region?.nom].filter(Boolean).join(" · ");
    status.innerHTML = `<i>🚌</i><div><strong>Réseau activé pour ${esc(city.nom)}</strong><span>${esc(area || "Commune reconnue")}</span></div>`;
    overlay.querySelector("[data-zpt-title]").textContent = `Transports à ${city.nom}`;
    overlay.querySelector("[data-zpt-bus-label]").textContent = city.nom;
    overlay.querySelector("[data-zpt-network-label]").textContent = city.epci?.nom || city.nom;
    overlay.querySelector("[data-zpt-region-label]").textContent = city.region?.nom || city.departement?.nom || city.nom;
    overlay.querySelector("[data-zpt-near-label]").textContent = `Autour de ${city.nom}`;
    overlay.querySelector("[data-zpt-bus]").onclick = () => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`horaires bus tram ${city.nom}`)}`);
    overlay.querySelector("[data-zpt-network]").onclick = () => open(panUrl(city.epci?.nom || city.nom));
    overlay.querySelector("[data-zpt-region]").onclick = () => open(panUrl(city.region?.nom || city.departement?.nom || city.nom));
    overlay.querySelector("[data-zpt-near]").onclick = () => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`arrêt de bus gare ${city.nom}`)}`);
  };

  const showSuggestions = (cities) => {
    suggestions.innerHTML = cities.map((city, index) => `<button data-zpt-choice="${index}">${esc(city.nom)}<small>${esc([city.departement?.nom, city.region?.nom].filter(Boolean).join(" · "))}</small></button>`).join("");
    suggestions.style.display = cities.length ? "block" : "none";
    suggestions.querySelectorAll("[data-zpt-choice]").forEach((button) => {
      button.onclick = () => activate(cities[Number(button.dataset.zptChoice)]);
    });
  };

  const resolve = async (query) => {
    const value = query.trim();
    if (value.length < 2) return;
    status.innerHTML = `<i>📍</i><div><strong>Recherche de ${esc(value)}…</strong><span>Détection automatique du réseau local.</span></div>`;
    try {
      const cities = await searchCities(value);
      if (!cities.length) throw new Error("Ville introuvable");
      showSuggestions(cities);
      activate(cities.find((city) => norm(city.nom) === norm(value)) || cities[0]);
    } catch {
      activeCity = null;
      status.innerHTML = "<i>⚠️</i><div><strong>Ville non reconnue</strong><span>Vérifiez l’orthographe puis réessayez.</span></div>";
      suggestions.style.display = "none";
    }
  };

  const trip = (callback) => {
    persist();
    if (!to.value.trim()) { error.style.display = "block"; to.focus(); return; }
    error.style.display = "none";
    callback(from.value.trim(), to.value.trim());
  };

  overlay.querySelector("[data-zpt-close]").onclick = () => overlay.remove();
  overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });
  overlay.querySelector("[data-zpt-route]").onclick = () => trip((depart, destination) => {
    const params = new URLSearchParams({ api: "1", travelmode: "transit", origin: depart, destination });
    open(`https://www.google.com/maps/dir/?${params}`);
  });
  overlay.querySelector("[data-zpt-train]").onclick = () => trip((depart, destination) => open(`https://www.sncf-connect.com/train/horaires/${slug(depart)}/${slug(destination)}`));
  cityInput.addEventListener("input", () => {
    from.value = cityInput.value;
    clearTimeout(timer);
    timer = window.setTimeout(() => resolve(cityInput.value), 500);
  });
  [from, to, date, time].forEach((field) => field.addEventListener("change", persist));

  document.body.appendChild(overlay);
  if (activeCity?.nom && norm(activeCity.nom) === norm(start)) activate(activeCity);
  else resolve(start);
}

function createButton() {
  document.querySelector("[data-tp-open]")?.remove();
  if (document.querySelector("[data-zpt-open]")) return;
  const button = document.createElement("button");
  button.dataset.zptOpen = "";
  button.setAttribute("aria-label", "Ouvrir les transports de ma ville");
  button.innerHTML = "<b>🚆</b><span><small>Ville et réseau local</small>Transports</span>";
  button.onclick = openModal;
  document.body.appendChild(button);
}

installStyles();
window.addEventListener("DOMContentLoaded", createButton);
if (document.readyState !== "loading") createButton();
