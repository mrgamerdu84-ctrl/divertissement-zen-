import { SpeechRecognition } from "@capacitor-community/speech-recognition";

const AV_PROFILE_KEY = "zenplus-profil";
const AV_CITY_KEY = "zenplus-ville-transport";
const AV_IGN_SEARCH = "https://data.geopf.fr/geocodage/search";
const AV_SPORTS_API = "https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records";

const avRead = (key, fallback = {}) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

const avSave = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage facultatif */ }
};

const avEsc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const avNorm = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const avOpen = (url) => window.open(url, "_blank", "noopener,noreferrer");

function avCurrentCity() {
  const active = avRead(AV_CITY_KEY);
  if (active.nom?.trim()) return active.nom.trim();

  const profile = avRead(AV_PROFILE_KEY);
  if (profile.villeExacte?.trim()) return profile.villeExacte.trim();

  const selects = [...document.querySelectorAll("select")];
  const citySelect = selects.find((select) => [...select.options].some((option) => option.value && !/^(?:\d{2,3}|2A|2B)$/.test(option.value)));
  return citySelect?.value || "Paris";
}

function avParseRequest(rawText) {
  let text = String(rawText || "").trim().replace(/[?!.,;:]+$/g, "");
  let city = "";

  const cityMatch = text.match(/\s+(?:à|a|dans|sur)\s+([A-Za-zÀ-ÿ0-9'’ -]{2,})$/i);
  if (cityMatch) {
    city = cityMatch[1].trim();
    text = text.slice(0, cityMatch.index).trim();
  }

  text = text
    .replace(/^(?:bonjour\s+)?(?:peux-tu|pourrais-tu|est-ce que tu peux|je voudrais|je veux|je cherche|cherche(?:-moi)?|trouve(?:-moi)?|montre(?:-moi)?|donne(?:-moi)?|où est|ou est|où sont|ou sont)\s+/i, "")
    .replace(/^(?:un|une|le|la|les|des|du|de la|de l['’])\s+/i, "")
    .replace(/\s+(?:près de moi|proche de moi|autour de moi)$/i, "")
    .trim();

  return {
    query: text || String(rawText || "").trim(),
    city: city || avCurrentCity(),
  };
}

function avSpeak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.98;
  utterance.pitch = 1;
  const frenchVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang?.toLowerCase().startsWith("fr"));
  if (frenchVoice) utterance.voice = frenchVoice;
  window.speechSynthesis.speak(utterance);
}

function avMapUrl(result, query, city) {
  const coordinates = result.geometry?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lon, lat] = coordinates;
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=18/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${query} ${city}`)}`;
}

function avNormalizeIgnFeature(feature) {
  const properties = feature?.properties || {};
  const first = (value) => Array.isArray(value) ? value[0] : value;
  const name = first(properties.name) || properties.toponym || properties.label || "Lieu";
  const city = first(properties.city) || "";
  const postcode = first(properties.postcode) || "";
  const category = first(properties.category) || properties.type || "Lieu";
  const context = properties.context || "";
  const address = [postcode, city, context].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(" · ");
  return { name, city, category, address, geometry: feature.geometry };
}

async function avFetchIgn(query, city) {
  const params = new URLSearchParams({
    q: `${query} ${city}`,
    index: "poi",
    limit: "8",
  });
  const response = await fetch(`${AV_IGN_SEARCH}?${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Recherche IGN indisponible");
  const data = await response.json();
  const features = Array.isArray(data.features) ? data.features : [];
  const cityNorm = avNorm(city);
  const normalized = features.map(avNormalizeIgnFeature);
  const local = normalized.filter((result) => {
    const resultCity = avNorm(result.city || result.address);
    return !resultCity || resultCity.includes(cityNorm) || cityNorm.includes(resultCity);
  });
  return (local.length ? local : normalized).slice(0, 8);
}

function avOds(value = "") {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

async function avFetchSports(query, city) {
  const fields = [
    "inst_numero", "inst_nom", "inst_adresse", "inst_cp", "new_name", "com_nom",
    "equip_nom", "equip_type_name", "equip_coordonnees", "aps_name"
  ].join(",");
  const attempts = [
    `new_name=\"${avOds(city)}\" and search(\"${avOds(query)}\")`,
    `com_nom=\"${avOds(city)}\" and search(\"${avOds(query)}\")`,
    `search(\"${avOds(`${query} ${city}`)}\")`,
  ];

  for (const where of attempts) {
    const params = new URLSearchParams({ where, select: fields, limit: "20" });
    try {
      const response = await fetch(`${AV_SPORTS_API}?${params}`, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;
      const data = await response.json();
      const rows = Array.isArray(data.results) ? data.results : [];
      const seen = new Set();
      const results = rows.map((record) => {
        const point = record.equip_coordonnees;
        let lat;
        let lon;
        if (Array.isArray(point)) [lat, lon] = point;
        else if (point && typeof point === "object") {
          lat = point.lat ?? point.latitude;
          lon = point.lon ?? point.lng ?? point.longitude;
        }
        const key = record.inst_numero || `${record.inst_nom || record.equip_nom}-${record.inst_adresse || ""}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          name: record.inst_nom || record.equip_nom || record.equip_type_name || "Équipement sportif",
          city: record.new_name || record.com_nom || city,
          category: record.equip_type_name || record.aps_name || "Équipement sportif",
          address: [record.inst_adresse, record.inst_cp, record.new_name || record.com_nom || city].filter(Boolean).join(" · "),
          geometry: Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) ? { coordinates: [Number(lon), Number(lat)] } : null,
        };
      }).filter(Boolean);
      if (results.length) return results.slice(0, 8);
    } catch {
      // La Géoplateforme ou la carte libre prendront le relais.
    }
  }
  return [];
}

function avInstallStyles() {
  if (document.getElementById("zenplus-assistant-vocal-css")) return;
  const style = document.createElement("style");
  style.id = "zenplus-assistant-vocal-css";
  style.textContent = `
    [data-av-mic]{border:0;border-radius:12px;width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;background:var(--zen-action,#EF5F4E);color:#fff;font-size:18px;cursor:pointer;box-shadow:0 3px 10px #0002}
    [data-av-mic].ecoute{animation:avPulse 1s infinite}
    @keyframes avPulse{50%{transform:scale(1.08);box-shadow:0 0 0 8px color-mix(in srgb,var(--zen-action,#EF5F4E) 22%,transparent)}}
    [data-av-overlay]{position:fixed;inset:0;z-index:110;background:#0009;display:flex;align-items:flex-end;justify-content:center}
    [data-av-modal]{width:100%;max-height:94vh;overflow:auto;border-radius:28px 28px 0 0;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B)}
    [data-av-head]{position:sticky;top:0;z-index:3;padding:18px 20px;background:var(--zen-primary,#16302B);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}
    [data-av-head] h2{margin:0;font:700 23px Fraunces,serif}[data-av-head] p{margin:3px 0 0;font:500 12px/1.35 system-ui;opacity:.75}[data-av-close]{border:0;border-radius:13px;width:40px;height:40px;background:#fff2;color:#fff;font-size:25px;cursor:pointer}
    [data-av-body]{padding:18px;display:grid;gap:13px}.av-card{background:#fff;border-radius:20px;padding:16px;box-shadow:0 2px 12px #0001}.av-card h3{margin:0 0 10px;font:700 17px Fraunces,serif}
    .av-status{padding:12px;border-radius:15px;background:var(--zen-soft,#E4EFE3);font:600 12px/1.45 system-ui}.av-form{display:grid;gap:9px}.av-form input{box-sizing:border-box;width:100%;border:1px solid #16302B33;border-radius:14px;padding:12px;background:var(--zen-bg,#F5F7F1);color:var(--zen-primary,#16302B);font:500 14px system-ui;outline:0}.av-form button{border:0;border-radius:14px;padding:12px;background:var(--zen-action,#EF5F4E);color:#fff;font:750 13px system-ui;cursor:pointer}
    .av-results{display:grid;gap:9px}.av-result{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:12px;border-radius:15px;background:var(--zen-bg,#F5F7F1)}.av-result strong{display:block;font:750 13px/1.25 system-ui}.av-result span{display:block;margin-top:3px;font:500 11px/1.35 system-ui;opacity:.72}.av-result small{display:block;margin-top:4px;font:650 10px/1.3 system-ui;color:var(--zen-action,#EF5F4E)}.av-result button,.av-map{border:0;border-radius:12px;padding:10px 12px;background:var(--zen-primary,#16302B);color:#fff;font:700 11px system-ui;cursor:pointer;text-decoration:none;white-space:nowrap}.av-map{display:inline-flex;margin-top:10px;background:var(--zen-action,#EF5F4E)}.av-credit{margin:8px 0 0;font:500 9.5px/1.45 system-ui;opacity:.6}
    @media(min-width:680px){[data-av-overlay]{align-items:center;padding:20px}[data-av-modal]{max-width:650px;border-radius:28px}.av-results{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);
}

function avCloseModal() {
  document.querySelector("[data-av-overlay]")?.remove();
}

function avShowModal({ title = "Assistant vocal", subtitle = "Demandez un lieu", content = "" } = {}) {
  avCloseModal();
  const overlay = document.createElement("div");
  overlay.dataset.avOverlay = "";
  overlay.innerHTML = `
    <section data-av-modal role="dialog" aria-modal="true" aria-label="Assistant vocal de recherche de lieux">
      <header data-av-head><div><h2>${avEsc(title)}</h2><p>${avEsc(subtitle)}</p></div><button data-av-close aria-label="Fermer">×</button></header>
      <div data-av-body>${content}</div>
    </section>`;
  overlay.addEventListener("click", (event) => { if (event.target === overlay) avCloseModal(); });
  overlay.querySelector("[data-av-close]").onclick = avCloseModal;
  document.body.appendChild(overlay);
  return overlay;
}

function avShowTypingFallback(message = "La reconnaissance vocale n’est pas disponible. Écrivez votre demande.") {
  const overlay = avShowModal({
    title: "Assistant de lieux",
    subtitle: "Parlez ou écrivez votre demande",
    content: `<section class="av-card"><div class="av-status">${avEsc(message)}</div><form class="av-form" data-av-form style="margin-top:10px"><input data-av-text placeholder="Exemple : piscine à Lyon" autocomplete="off"><button type="submit">Chercher ce lieu</button></form><p class="av-credit">Le micro ne s’active qu’après votre appui. L’application ne conserve pas l’enregistrement vocal.</p></section>`,
  });
  const form = overlay.querySelector("[data-av-form]");
  const input = overlay.querySelector("[data-av-text]");
  form.onsubmit = (event) => {
    event.preventDefault();
    if (input.value.trim()) avHandleRequest(input.value.trim());
  };
  window.setTimeout(() => input.focus(), 50);
}

function avShowWorking(transcript, query, city) {
  avShowModal({
    title: "Assistant de lieux",
    subtitle: `« ${transcript} »`,
    content: `<section class="av-card"><div class="av-status">Recherche de <strong>${avEsc(query)}</strong> à <strong>${avEsc(city)}</strong> dans les sources publiques officielles…</div></section>`,
  });
}

function avShowResults(transcript, query, city, results) {
  const unique = [];
  const seen = new Set();
  for (const result of results) {
    const key = `${avNorm(result.name)}-${avNorm(result.address)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(result);
    if (unique.length >= 8) break;
  }

  if (!unique.length) {
    const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${query} ${city}`)}`;
    const overlay = avShowModal({
      title: "Assistant de lieux",
      subtitle: `« ${transcript} »`,
      content: `<section class="av-card"><div class="av-status">Je n’ai pas trouvé de résultat précis dans les bases publiques pour <strong>${avEsc(query)}</strong> à <strong>${avEsc(city)}</strong>.</div><a class="av-map" target="_blank" rel="noopener noreferrer" href="${avEsc(mapUrl)}">Voir la recherche sur la carte libre</a><p class="av-credit">Sources recherchées : IGN Géoplateforme — BD TOPO®/BAN et Ministère des Sports — Data ES, Licence Ouverte 2.0. Cartographie : © contributeurs OpenStreetMap, ODbL.</p></section>`,
    });
    overlay.querySelector(".av-map").onclick = () => avSpeak(`J’ouvre la carte pour ${query} à ${city}.`);
    avSpeak(`Je n’ai pas trouvé de résultat précis pour ${query} à ${city}. Je vous propose la carte libre.`);
    return;
  }

  const first = unique[0];
  const content = unique.map((result, index) => {
    const url = avMapUrl(result, query, city);
    return `<article class="av-result"><div><strong>${avEsc(result.name)}</strong><span>${avEsc(result.address || city)}</span><small>${avEsc(result.category || "Lieu")}${index === 0 ? " · premier résultat" : ""}</small></div><button data-av-map="${avEsc(url)}">Voir</button></article>`;
  }).join("");

  const overlay = avShowModal({
    title: "Assistant de lieux",
    subtitle: `${unique.length} résultat${unique.length > 1 ? "s" : ""} pour « ${query} » à ${city}`,
    content: `<section class="av-card"><div class="av-results">${content}</div><p class="av-credit">Sources : IGN Géoplateforme — points d’intérêt BD TOPO®/BAN et Ministère des Sports — Data ES, Licence Ouverte 2.0. Cartographie : © contributeurs OpenStreetMap, ODbL.</p></section>`,
  });
  overlay.querySelectorAll("[data-av-map]").forEach((button) => {
    button.onclick = () => avOpen(button.dataset.avMap);
  });

  avSpeak(`J’ai trouvé ${unique.length} lieu${unique.length > 1 ? "x" : ""} à ${city}. Le premier est ${first.name}. ${first.address || "L’adresse est affichée à l’écran."}`);
}

async function avHandleRequest(transcript) {
  const { query, city } = avParseRequest(transcript);
  if (!query || query.length < 2) {
    avShowTypingFallback("Je n’ai pas compris le lieu. Essayez par exemple : piscine à Lyon.");
    avSpeak("Je n’ai pas compris le lieu. Dites par exemple, piscine à Lyon.");
    return;
  }

  avSave(AV_CITY_KEY, { nom: city });
  avShowWorking(transcript, query, city);

  let ignResults = [];
  let sportsResults = [];
  try { ignResults = await avFetchIgn(query, city); } catch { /* Data ES prend le relais. */ }
  try { sportsResults = await avFetchSports(query, city); } catch { /* La carte libre reste disponible. */ }
  avShowResults(transcript, query, city, [...ignResults, ...sportsResults]);
}

function avWebListen() {
  return new Promise((resolve, reject) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      reject(new Error("Reconnaissance vocale indisponible"));
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onresult = (event) => resolve(event.results?.[0]?.[0]?.transcript || "");
    recognition.onerror = (event) => reject(new Error(event.error || "Erreur vocale"));
    recognition.onnomatch = () => reject(new Error("Phrase non reconnue"));
    recognition.start();
  });
}

async function avNativeListen() {
  const availability = await SpeechRecognition.available();
  if (!availability?.available) throw new Error("Service vocal natif indisponible");

  let permission = await SpeechRecognition.checkPermissions();
  if (permission?.speechRecognition !== "granted") permission = await SpeechRecognition.requestPermissions();
  if (permission?.speechRecognition !== "granted") throw new Error("Autorisation du micro refusée");

  const result = await SpeechRecognition.start({
    language: "fr-FR",
    maxResults: 3,
    prompt: "Demandez un lieu, par exemple : piscine à Lyon",
    partialResults: false,
    popup: true,
  });
  return result?.matches?.[0] || "";
}

async function avStartListening(button) {
  button?.classList.add("ecoute");
  button?.setAttribute("aria-label", "Écoute en cours");
  avShowModal({
    title: "Je vous écoute…",
    subtitle: "Dites un lieu et éventuellement une ville",
    content: `<section class="av-card"><div class="av-status">Exemples : « piscine à Lyon », « cinéma à Avignon », « parc près de moi ».</div><p class="av-credit">Le micro s’arrête après une demande. Aucun enregistrement audio n’est conservé par l’application.</p></section>`,
  });

  try {
    let transcript = "";
    try { transcript = await avNativeListen(); }
    catch { transcript = await avWebListen(); }
    if (!transcript.trim()) throw new Error("Aucune phrase reconnue");
    await avHandleRequest(transcript.trim());
  } catch (error) {
    avShowTypingFallback(error?.message || "La reconnaissance vocale n’est pas disponible sur ce téléphone.");
  } finally {
    button?.classList.remove("ecoute");
    button?.setAttribute("aria-label", "Demander un lieu avec la voix");
  }
}

function avInstallButton() {
  avInstallStyles();
  if (document.querySelector("[data-av-mic]")) return true;
  const input = [...document.querySelectorAll("input")].find((item) => item.placeholder?.toLowerCase().includes("activité ou un lieu"));
  if (!input) return false;
  const wrapper = input.parentElement;
  if (!wrapper) return false;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.avMic = "";
  button.setAttribute("aria-label", "Demander un lieu avec la voix");
  button.title = "Demander un lieu avec la voix";
  button.textContent = "🎤";
  button.onclick = () => avStartListening(button);
  wrapper.appendChild(button);
  return true;
}

const avObserver = new MutationObserver(() => {
  if (avInstallButton()) avObserver.disconnect();
});
avObserver.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", avInstallButton);
if (document.readyState !== "loading") avInstallButton();
