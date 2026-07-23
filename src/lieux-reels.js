const ZL_PROFILE_KEY = "zenplus-profil";
const ZL_CITY_KEY = "zenplus-ville-transport";
const ZL_SPORTS_API = "https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records";

const zlRead = (key, fallback = {}) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

const zlEsc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const zlNorm = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const zlOds = (value = "") => String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');

function zlCurrentCity() {
  const selects = [...document.querySelectorAll("select")];
  const citySelect = selects.find((select) => {
    if (!select.value) return false;
    const values = [...select.options].map((option) => option.value);
    return values.some((value) => value && !/^(?:\d{2,3}|2A|2B)$/.test(value));
  });
  if (citySelect?.value) return citySelect.value;

  const activeCity = zlRead(ZL_CITY_KEY);
  if (activeCity.nom?.trim()) return activeCity.nom.trim();

  const profile = zlRead(ZL_PROFILE_KEY);
  return profile.villeExacte?.trim() || "Paris";
}

function zlMapUrl(query, city) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${query} ${city}`)}`;
}

function zlPointUrl(record, query, city) {
  const point = record.equip_coordonnees;
  let lat;
  let lon;
  if (Array.isArray(point)) [lat, lon] = point;
  else if (point && typeof point === "object") {
    lat = point.lat ?? point.latitude;
    lon = point.lon ?? point.lng ?? point.longitude;
  }
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=17/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;
  }
  return zlMapUrl(query, city);
}

function zlInstallStyles() {
  if (document.getElementById("zenplus-lieux-css")) return;
  const style = document.createElement("style");
  style.id = "zenplus-lieux-css";
  style.textContent = `
    [data-zl-panel]{display:none;margin-top:14px;border-radius:20px;padding:16px;background:#fff;border:1px solid color-mix(in srgb,var(--zen-primary,#16302B) 12%,transparent);box-shadow:0 3px 14px #0000000d;color:var(--zen-primary,#16302B)}
    [data-zl-head]{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}
    [data-zl-head] h3{margin:0;font:700 18px Fraunces,serif}[data-zl-head] p{margin:3px 0 0;font:500 11px/1.4 system-ui;opacity:.68}
    [data-zl-status]{font:600 12px/1.45 system-ui;padding:11px;border-radius:14px;background:var(--zen-soft,#E4EFE3)}
    [data-zl-list]{display:grid;gap:9px;margin-top:10px}
    .zl-place{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border-radius:15px;background:var(--zen-bg,#F5F7F1)}
    .zl-place strong{display:block;font:750 13px/1.25 system-ui}.zl-place span{display:block;margin-top:3px;font:500 11px/1.35 system-ui;opacity:.7}.zl-place small{display:block;margin-top:4px;font:600 10px/1.3 system-ui;color:var(--zen-action,#EF5F4E)}
    .zl-open,.zl-fallback{border:0;border-radius:12px;padding:10px 12px;background:var(--zen-primary,#16302B);color:#fff;font:700 11px system-ui;cursor:pointer;text-decoration:none;white-space:nowrap}
    .zl-fallback{display:inline-flex;margin-top:10px;background:var(--zen-action,#EF5F4E)}
    [data-zl-credit]{margin:11px 0 0;font:500 10px/1.45 system-ui;opacity:.58}
    @media(min-width:680px){[data-zl-list]{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

async function zlFetchSports(query, city) {
  const fields = [
    "inst_numero", "inst_nom", "inst_adresse", "inst_cp", "new_name", "com_nom",
    "equip_nom", "equip_type_name", "equip_coordonnees", "equip_url", "aps_name"
  ].join(",");

  const attempts = [
    `new_name=\"${zlOds(city)}\" and search(\"${zlOds(query)}\")`,
    `com_nom=\"${zlOds(city)}\" and search(\"${zlOds(query)}\")`,
    `search(\"${zlOds(`${query} ${city}`)}\")`,
  ];

  for (const where of attempts) {
    const params = new URLSearchParams({ where, select: fields, limit: "30" });
    try {
      const response = await fetch(`${ZL_SPORTS_API}?${params}`, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;
      const data = await response.json();
      const rows = Array.isArray(data.results) ? data.results : Array.isArray(data.records) ? data.records : [];
      const records = rows.map((row) => row.fields || row).filter(Boolean);
      if (!records.length) continue;

      const cityNorm = zlNorm(city);
      const filtered = records.filter((record) => {
        const recordCity = zlNorm(record.new_name || record.com_nom || "");
        return !recordCity || recordCity === cityNorm || recordCity.includes(cityNorm) || cityNorm.includes(recordCity);
      });
      if (filtered.length) return filtered;
    } catch {
      // Une tentative suivante ou la carte libre prendra le relais.
    }
  }
  return [];
}

function zlUnique(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.inst_numero || `${record.inst_nom || record.equip_nom}-${record.inst_adresse || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function zlRender(panel, query, city, records) {
  const list = panel.querySelector("[data-zl-list]");
  const status = panel.querySelector("[data-zl-status]");
  const unique = zlUnique(records);

  if (!unique.length) {
    status.innerHTML = `Aucun équipement sportif officiel trouvé pour <strong>${zlEsc(query)}</strong> à <strong>${zlEsc(city)}</strong>. La carte libre peut quand même retrouver un commerce, un parc, une piscine ou un autre lieu.`;
    list.innerHTML = `<a class="zl-fallback" target="_blank" rel="noopener noreferrer" href="${zlEsc(zlMapUrl(query, city))}">Chercher sur la carte libre</a>`;
    return;
  }

  status.innerHTML = `<strong>${unique.length} lieu${unique.length > 1 ? "x" : ""} réel${unique.length > 1 ? "s" : ""}</strong> trouvé${unique.length > 1 ? "s" : ""} à ${zlEsc(city)} dans la base officielle du ministère des Sports.`;
  list.innerHTML = unique.map((record) => {
    const name = record.inst_nom || record.equip_nom || record.equip_type_name || "Équipement sportif";
    const type = record.equip_type_name || record.aps_name || "Équipement sportif";
    const address = [record.inst_adresse, record.inst_cp, record.new_name || record.com_nom || city].filter(Boolean).join(" · ");
    const link = record.equip_url || zlPointUrl(record, query, city);
    return `<article class="zl-place"><div><strong>${zlEsc(name)}</strong><span>${zlEsc(address || city)}</span><small>${zlEsc(type)}</small></div><a class="zl-open" target="_blank" rel="noopener noreferrer" href="${zlEsc(link)}">Voir</a></article>`;
  }).join("");
}

function zlInstallSearch() {
  zlInstallStyles();
  const input = [...document.querySelectorAll("input")].find((item) => item.placeholder?.toLowerCase().includes("activité ou un lieu"));
  if (!input || input.dataset.zlReady) return false;
  input.dataset.zlReady = "1";
  input.placeholder = "Chercher une activité ou un lieu réel…";

  const host = input.closest(".bg-white") || input.parentElement?.parentElement?.parentElement;
  if (!host) return false;

  const panel = document.createElement("section");
  panel.dataset.zlPanel = "";
  panel.innerHTML = `
    <div data-zl-head><div><h3>Lieux réels près de moi</h3><p>Piscines et équipements sportifs officiels, avec une recherche cartographique libre pour les autres lieux.</p></div><span>📍</span></div>
    <div data-zl-status>Écrivez le nom d’un lieu, par exemple « piscine ».</div>
    <div data-zl-list></div>
    <p data-zl-credit>Sources : Ministère des Sports — Data ES, Licence Ouverte 2.0. Cartographie : © contributeurs OpenStreetMap, ODbL.</p>`;
  host.appendChild(panel);

  let timer;
  let requestId = 0;
  const run = () => {
    clearTimeout(timer);
    const query = input.value.trim();
    if (query.length < 2) {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "block";
    const city = zlCurrentCity();
    const currentRequest = ++requestId;
    panel.querySelector("[data-zl-status]").innerHTML = `Recherche de <strong>${zlEsc(query)}</strong> à <strong>${zlEsc(city)}</strong>…`;
    panel.querySelector("[data-zl-list]").innerHTML = "";

    timer = window.setTimeout(async () => {
      const records = await zlFetchSports(query, city);
      if (currentRequest !== requestId) return;
      zlRender(panel, query, city, records);
    }, 650);
  };

  input.addEventListener("input", run);
  document.addEventListener("change", (event) => {
    if (event.target instanceof HTMLSelectElement && input.value.trim().length >= 2) run();
  });
  return true;
}

const zlObserver = new MutationObserver(() => {
  if (zlInstallSearch()) zlObserver.disconnect();
});
zlObserver.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", zlInstallSearch);
if (document.readyState !== "loading") zlInstallSearch();
