const CLE_PROFIL = "zenplus-profil";
const CLE_THEME = "zenplus-theme";

const THEMES = {
  foret: { nom: "Forêt", primary: "#16302B", accent: "#F4B740", action: "#EF5F4E", background: "#F5F7F1", soft: "#E4EFE3" },
  ocean: { nom: "Océan", primary: "#123B57", accent: "#56C7D9", action: "#FF7A59", background: "#F2F8FA", soft: "#DDEFF4" },
  lavande: { nom: "Lavande", primary: "#3D315B", accent: "#C7A8FF", action: "#F06F8E", background: "#F8F5FC", soft: "#ECE5F6" },
  soleil: { nom: "Soleil", primary: "#51320B", accent: "#FFC857", action: "#E05A33", background: "#FFF9EE", soft: "#F8EACB" },
  corail: { nom: "Corail", primary: "#4A2931", accent: "#FF9B85", action: "#D94D6A", background: "#FFF5F3", soft: "#F7DDD8" },
};

const DEPARTEMENTS = [
  ["01", "Ain"], ["02", "Aisne"], ["03", "Allier"], ["04", "Alpes-de-Haute-Provence"], ["05", "Hautes-Alpes"],
  ["06", "Alpes-Maritimes"], ["07", "Ardèche"], ["08", "Ardennes"], ["09", "Ariège"], ["10", "Aube"],
  ["11", "Aude"], ["12", "Aveyron"], ["13", "Bouches-du-Rhône"], ["14", "Calvados"], ["15", "Cantal"],
  ["16", "Charente"], ["17", "Charente-Maritime"], ["18", "Cher"], ["19", "Corrèze"], ["2A", "Corse-du-Sud"],
  ["2B", "Haute-Corse"], ["21", "Côte-d'Or"], ["22", "Côtes-d'Armor"], ["23", "Creuse"], ["24", "Dordogne"],
  ["25", "Doubs"], ["26", "Drôme"], ["27", "Eure"], ["28", "Eure-et-Loir"], ["29", "Finistère"],
  ["30", "Gard"], ["31", "Haute-Garonne"], ["32", "Gers"], ["33", "Gironde"], ["34", "Hérault"],
  ["35", "Ille-et-Vilaine"], ["36", "Indre"], ["37", "Indre-et-Loire"], ["38", "Isère"], ["39", "Jura"],
  ["40", "Landes"], ["41", "Loir-et-Cher"], ["42", "Loire"], ["43", "Haute-Loire"], ["44", "Loire-Atlantique"],
  ["45", "Loiret"], ["46", "Lot"], ["47", "Lot-et-Garonne"], ["48", "Lozère"], ["49", "Maine-et-Loire"],
  ["50", "Manche"], ["51", "Marne"], ["52", "Haute-Marne"], ["53", "Mayenne"], ["54", "Meurthe-et-Moselle"],
  ["55", "Meuse"], ["56", "Morbihan"], ["57", "Moselle"], ["58", "Nièvre"], ["59", "Nord"],
  ["60", "Oise"], ["61", "Orne"], ["62", "Pas-de-Calais"], ["63", "Puy-de-Dôme"], ["64", "Pyrénées-Atlantiques"],
  ["65", "Hautes-Pyrénées"], ["66", "Pyrénées-Orientales"], ["67", "Bas-Rhin"], ["68", "Haut-Rhin"], ["69", "Rhône"],
  ["70", "Haute-Saône"], ["71", "Saône-et-Loire"], ["72", "Sarthe"], ["73", "Savoie"], ["74", "Haute-Savoie"],
  ["75", "Paris"], ["76", "Seine-Maritime"], ["77", "Seine-et-Marne"], ["78", "Yvelines"], ["79", "Deux-Sèvres"],
  ["80", "Somme"], ["81", "Tarn"], ["82", "Tarn-et-Garonne"], ["83", "Var"], ["84", "Vaucluse"],
  ["85", "Vendée"], ["86", "Vienne"], ["87", "Haute-Vienne"], ["88", "Vosges"], ["89", "Yonne"],
  ["90", "Territoire de Belfort"], ["91", "Essonne"], ["92", "Hauts-de-Seine"], ["93", "Seine-Saint-Denis"],
  ["94", "Val-de-Marne"], ["95", "Val-d'Oise"], ["971", "Guadeloupe"], ["972", "Martinique"], ["973", "Guyane"],
  ["974", "La Réunion"], ["976", "Mayotte"],
];

function lire(cle, valeur) {
  try {
    return JSON.parse(localStorage.getItem(cle)) || valeur;
  } catch {
    return valeur;
  }
}

function ecrire(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // L'application continue de fonctionner si le stockage est bloqué.
  }
}

function rgb(hex) {
  const propre = hex.replace("#", "");
  const entier = Number.parseInt(propre, 16);
  return `${(entier >> 16) & 255}, ${(entier >> 8) & 255}, ${entier & 255}`;
}

function initiales(nom) {
  const propre = nom.trim();
  if (!propre) return "Z+";
  return propre.split(/\s+/).slice(0, 2).map((mot) => mot[0]?.toUpperCase()).join("");
}

function salutation() {
  const heure = new Date().getHours();
  if (heure < 5) return "Bonsoir";
  if (heure < 12) return "Bonjour";
  if (heure < 18) return "Bon après-midi";
  return "Bonsoir";
}

let profil = lire(CLE_PROFIL, { nom: "", villeExacte: "Paris", departementCode: "75" });
let themeCle = lire(CLE_THEME, "foret");

function installerStyles() {
  if (document.getElementById("zenplus-personnalisation-style")) return;
  const style = document.createElement("style");
  style.id = "zenplus-personnalisation-style";
  style.textContent = `
    :root { --zen-primary:#16302B; --zen-accent:#F4B740; --zen-action:#EF5F4E; --zen-bg:#F5F7F1; --zen-soft:#E4EFE3; }
    html, body, #root, #root > div { background: var(--zen-bg) !important; }
    header { background: var(--zen-primary) !important; }
    main h2, main h3 { color: var(--zen-primary) !important; }
    .ticket { border-color: color-mix(in srgb, var(--zen-primary) 35%, transparent) !important; }
    [data-zen-profile-button] { position:fixed; right:14px; bottom:18px; z-index:45; border:0; border-radius:18px; padding:8px 12px 8px 8px; display:flex; align-items:center; gap:9px; box-shadow:0 10px 30px rgba(0,0,0,.22); cursor:pointer; background:var(--zen-primary); color:white; font:600 13px/1.15 system-ui,sans-serif; }
    [data-zen-avatar] { width:38px; height:38px; border-radius:13px; display:grid; place-items:center; background:var(--zen-accent); color:var(--zen-primary); font-weight:800; }
    [data-zen-profile-button] small { display:block; opacity:.7; font-size:10px; margin-bottom:2px; }
    [data-zen-overlay] { position:fixed; inset:0; z-index:80; display:flex; align-items:flex-end; justify-content:center; padding:0; background:rgba(0,0,0,.48); }
    [data-zen-modal] { width:100%; max-height:92vh; overflow:auto; border-radius:28px 28px 0 0; background:var(--zen-bg); box-shadow:0 -18px 60px rgba(0,0,0,.3); }
    [data-zen-modal-head] { position:sticky; top:0; z-index:2; display:flex; justify-content:space-between; align-items:center; padding:18px 20px; background:var(--zen-primary); color:white; }
    [data-zen-modal-head] h2 { margin:0; font:700 23px/1.1 Georgia,serif; }
    [data-zen-modal-head] p { margin:4px 0 0; opacity:.7; font:12px system-ui,sans-serif; }
    [data-zen-close] { border:0; width:38px; height:38px; border-radius:12px; color:white; background:rgba(255,255,255,.12); font-size:24px; cursor:pointer; }
    [data-zen-modal-body] { padding:18px; display:grid; gap:16px; }
    .zen-card { background:white; border:1px solid color-mix(in srgb, var(--zen-primary) 12%, transparent); border-radius:18px; padding:16px; }
    .zen-card h3 { margin:0 0 14px; color:var(--zen-primary); font:700 16px system-ui,sans-serif; }
    .zen-field { display:block; margin-top:13px; color:var(--zen-primary); font:600 12px system-ui,sans-serif; }
    .zen-field input, .zen-field select { width:100%; box-sizing:border-box; margin-top:6px; border:1px solid color-mix(in srgb, var(--zen-primary) 20%, transparent); border-radius:12px; padding:12px; outline:none; background:var(--zen-bg); color:var(--zen-primary); font:14px system-ui,sans-serif; }
    [data-zen-themes] { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    [data-zen-theme] { position:relative; border:1px solid rgba(0,0,0,.12); border-radius:15px; padding:12px; text-align:left; cursor:pointer; background:white; }
    [data-zen-theme].actif { outline:3px solid var(--zen-action); outline-offset:1px; }
    .zen-dots { display:flex; gap:6px; margin-bottom:9px; }
    .zen-dot { width:23px; height:23px; border-radius:50%; }
    [data-zen-save] { border:0; border-radius:15px; padding:14px; background:var(--zen-action); color:white; font:700 15px system-ui,sans-serif; cursor:pointer; }
    [data-zen-splash] { position:fixed; inset:0; z-index:999; display:grid; place-items:center; background:var(--zen-primary); color:white; transition:opacity .35s ease, visibility .35s ease; }
    [data-zen-splash].cache { opacity:0; visibility:hidden; }
    [data-zen-splash] img { width:132px; height:132px; animation:zenPop .55s ease-out both; }
    [data-zen-splash] h1 { margin:20px 0 6px; font:700 34px/1.1 Georgia,serif; text-align:center; }
    [data-zen-splash] h1 span { color:var(--zen-accent); }
    [data-zen-splash] p { margin:0; opacity:.72; letter-spacing:.16em; text-transform:uppercase; font:11px system-ui,sans-serif; text-align:center; }
    .zen-loader { width:150px; height:4px; margin:28px auto 0; overflow:hidden; border-radius:99px; background:rgba(255,255,255,.14); }
    .zen-loader::after { content:""; display:block; height:100%; width:100%; background:var(--zen-accent); animation:zenLoad 1.2s ease both; }
    @keyframes zenPop { from { opacity:0; transform:scale(.82) rotate(-8deg); } to { opacity:1; transform:scale(1) rotate(0); } }
    @keyframes zenLoad { from { transform:translateX(-100%); } to { transform:translateX(0); } }
    @media (min-width:640px) { [data-zen-overlay] { align-items:center; padding:24px; } [data-zen-modal] { max-width:560px; border-radius:28px; } [data-zen-themes] { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media (max-width:480px) { [data-zen-profile-button] [data-zen-profile-text] { display:none; } [data-zen-profile-button] { padding:8px; border-radius:16px; } }
  `;
  document.head.appendChild(style);
}

function appliquerTheme(cle) {
  themeCle = THEMES[cle] ? cle : "foret";
  const theme = THEMES[themeCle];
  const racine = document.documentElement;
  racine.style.setProperty("--zen-primary", theme.primary);
  racine.style.setProperty("--zen-accent", theme.accent);
  racine.style.setProperty("--zen-action", theme.action);
  racine.style.setProperty("--zen-bg", theme.background);
  racine.style.setProperty("--zen-soft", theme.soft);
  ecrire(CLE_THEME, themeCle);

  const correspondances = [
    ["22, 48, 43", theme.primary], ["244, 183, 64", theme.accent],
    ["239, 95, 78", theme.action], ["245, 247, 241", theme.background], ["228, 239, 227", theme.soft],
  ];
  let dynamique = document.getElementById("zenplus-theme-dynamique");
  if (!dynamique) {
    dynamique = document.createElement("style");
    dynamique.id = "zenplus-theme-dynamique";
    document.head.appendChild(dynamique);
  }
  dynamique.textContent = correspondances.map(([ancien, nouveau]) => `
    [style*="background: rgb(${ancien})"] { background: ${nouveau} !important; }
    [style*="color: rgb(${ancien})"] { color: ${nouveau} !important; }
    [style*="border-color: rgb(${ancien})"] { border-color: ${nouveau} !important; }
  `).join("");

  document.querySelectorAll("[data-zen-theme]").forEach((bouton) => bouton.classList.toggle("actif", bouton.dataset.zenTheme === themeCle));
}

function creerSplash() {
  if (document.querySelector("[data-zen-splash]")) return;
  const splash = document.createElement("div");
  splash.dataset.zenSplash = "";
  splash.innerHTML = `
    <div>
      <img src="/brand-logo.svg" alt="Logo Mon Divertissement Zen+">
      <h1>Mon Divertissement <span>Zen+</span></h1>
      <p>Respirer · Sortir · Profiter</p>
      <div class="zen-loader"></div>
    </div>`;
  document.body.appendChild(splash);
  window.setTimeout(() => splash.classList.add("cache"), 1350);
  window.setTimeout(() => splash.remove(), 1800);
}

function synchroniserVille() {
  const selects = [...document.querySelectorAll("select")];
  const selectDepartement = selects.find((select) => [...select.options].some((option) => option.value === profil.departementCode));
  if (!selectDepartement) return;
  selectDepartement.value = profil.departementCode;
  selectDepartement.dispatchEvent(new Event("change", { bubbles: true }));
  window.setTimeout(() => {
    const liste = [...document.querySelectorAll("select")];
    const selectVille = liste.find((select) => [...select.options].some((option) => option.textContent.trim().toLowerCase() === profil.villeExacte.toLowerCase()));
    if (selectVille) {
      const option = [...selectVille.options].find((item) => item.textContent.trim().toLowerCase() === profil.villeExacte.toLowerCase());
      selectVille.value = option.value;
      selectVille.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, 80);
}

function mettreAJourBouton() {
  const bouton = document.querySelector("[data-zen-profile-button]");
  if (!bouton) return;
  bouton.querySelector("[data-zen-avatar]").textContent = initiales(profil.nom);
  bouton.querySelector("[data-zen-greeting]").textContent = salutation();
  bouton.querySelector("[data-zen-name]").textContent = profil.nom || "Mon profil";
}

function ouvrirProfil() {
  if (document.querySelector("[data-zen-overlay]")) return;
  const overlay = document.createElement("div");
  overlay.dataset.zenOverlay = "";
  overlay.innerHTML = `
    <section data-zen-modal role="dialog" aria-modal="true" aria-label="Profil et personnalisation">
      <header data-zen-modal-head>
        <div><h2>Mon profil</h2><p>Informations et couleurs de l'application</p></div>
        <button data-zen-close aria-label="Fermer">×</button>
      </header>
      <div data-zen-modal-body>
        <div class="zen-card">
          <h3>Mes informations</h3>
          <label class="zen-field">Nom ou pseudo
            <input data-zen-nom maxlength="40" placeholder="Exemple : Aurélien" value="${profil.nom.replaceAll('"', '&quot;')}">
          </label>
          <label class="zen-field">Ma ville exacte
            <input data-zen-ville maxlength="80" placeholder="Exemple : Avignon" value="${profil.villeExacte.replaceAll('"', '&quot;')}">
          </label>
          <label class="zen-field">Mon département
            <select data-zen-departement>${DEPARTEMENTS.map(([code, nom]) => `<option value="${code}" ${code === profil.departementCode ? "selected" : ""}>${nom} (${code})</option>`).join("")}</select>
          </label>
        </div>
        <div class="zen-card">
          <h3>Couleurs de l'application</h3>
          <div data-zen-themes>${Object.entries(THEMES).map(([cle, theme]) => `
            <button data-zen-theme="${cle}" class="${cle === themeCle ? "actif" : ""}">
              <span class="zen-dots"><i class="zen-dot" style="background:${theme.primary}"></i><i class="zen-dot" style="background:${theme.accent}"></i><i class="zen-dot" style="background:${theme.action}"></i></span>
              <strong>${theme.nom}</strong>
            </button>`).join("")}</div>
        </div>
        <button data-zen-save>Enregistrer mon profil</button>
      </div>
    </section>`;

  const fermer = () => overlay.remove();
  overlay.addEventListener("click", (event) => { if (event.target === overlay) fermer(); });
  overlay.querySelector("[data-zen-close]").addEventListener("click", fermer);
  overlay.querySelectorAll("[data-zen-theme]").forEach((bouton) => bouton.addEventListener("click", () => appliquerTheme(bouton.dataset.zenTheme)));
  overlay.querySelector("[data-zen-save]").addEventListener("click", () => {
    profil = {
      nom: overlay.querySelector("[data-zen-nom]").value.trim(),
      villeExacte: overlay.querySelector("[data-zen-ville]").value.trim() || "Paris",
      departementCode: overlay.querySelector("[data-zen-departement]").value,
    };
    ecrire(CLE_PROFIL, profil);
    mettreAJourBouton();
    synchroniserVille();
    fermer();
  });
  document.body.appendChild(overlay);
}

function creerBoutonProfil() {
  if (document.querySelector("[data-zen-profile-button]")) return;
  const bouton = document.createElement("button");
  bouton.dataset.zenProfileButton = "";
  bouton.setAttribute("aria-label", "Ouvrir mon profil et personnaliser l'application");
  bouton.innerHTML = `
    <span data-zen-avatar>${initiales(profil.nom)}</span>
    <span data-zen-profile-text><small data-zen-greeting>${salutation()}</small><span data-zen-name>${profil.nom || "Mon profil"}</span></span>`;
  bouton.addEventListener("click", ouvrirProfil);
  document.body.appendChild(bouton);
}

installerStyles();
appliquerTheme(themeCle);
creerSplash();

window.addEventListener("DOMContentLoaded", () => {
  creerBoutonProfil();
  window.setTimeout(synchroniserVille, 250);
});

if (document.readyState !== "loading") {
  creerBoutonProfil();
  window.setTimeout(synchroniserVille, 250);
}
