import React, { useState, useMemo } from "react";
import {
  MapPin,
  Clock,
  Ticket,
  Heart,
  Sparkles,
  Trees,
  Palette,
  Music,
  Drama,
  Puzzle,
  Sun,
  Search,
  Compass,
  Gift,
  Wallet,
} from "lucide-react";
import { DEPARTEMENTS } from "./departements.js";
import { EVENEMENTS } from "./evenements.js";



// Liste à plat de toutes les villes, avec leur département, pour la recherche.
const TOUTES_VILLES = DEPARTEMENTS.flatMap((d) =>
  d.villes.map((v) => ({ ville: v, departement: d.nom, code: d.code }))
);

const CATEGORIES = [
  { id: "nature", label: "Plein air", icon: Trees },
  { id: "creatif", label: "Créatif", icon: Palette },
  { id: "spectacle", label: "Spectacle", icon: Drama },
  { id: "musique", label: "Musique", icon: Music },
  { id: "jeux", label: "Jeux & énigmes", icon: Puzzle },
];



const CAT_META = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export default function MonDivertissementZenPlus() {
  const [departementCode, setDepartementCode] = useState("75");
  const [ville, setVille] = useState("Paris");
  const [catActive, setCatActive] = useState("tous");
  const [prixActive, setPrixActive] = useState("tous"); // tous | gratuit | payant
  const [favoris, setFavoris] = useState(() => new Set());
  const [requete, setRequete] = useState("");
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [rechercheActivite, setRechercheActivite] = useState("");

  const departementActif = DEPARTEMENTS.find((d) => d.code === departementCode);

  const choisirDepartement = (code) => {
    const dep = DEPARTEMENTS.find((d) => d.code === code);
    setDepartementCode(code);
    setVille(dep.villes[0]);
  };

  const choisirVille = (villeChoisie) => {
    const dep = TOUTES_VILLES.find((v) => v.ville === villeChoisie);
    if (dep) setDepartementCode(dep.code);
    setVille(villeChoisie);
    setRechercheOuverte(false);
    setRequete("");
  };

  const suggestionsVilles = useMemo(() => {
    if (!requete.trim()) return [];
    const q = requete.toLowerCase();
    return TOUTES_VILLES.filter((v) => v.ville.toLowerCase().includes(q)).slice(0, 6);
  }, [requete]);

  const evenements = EVENEMENTS[ville] || [];

  const filtres = useMemo(() => {
    return evenements.filter((e) => {
      const okCat = catActive === "tous" || e.cat === catActive;
      const okPrix =
        prixActive === "tous" ||
        (prixActive === "gratuit" && e.gratuit) ||
        (prixActive === "payant" && !e.gratuit);
      const okRecherche =
        rechercheActivite.trim() === "" ||
        e.titre.toLowerCase().includes(rechercheActivite.toLowerCase()) ||
        e.lieu.toLowerCase().includes(rechercheActivite.toLowerCase());
      return okCat && okPrix && okRecherche;
    });
  }, [evenements, catActive, prixActive, rechercheActivite]);

  const toggleFavori = (id) => {
    setFavoris((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#F5F7F1", fontFamily: "'Public Sans', ui-sans-serif, system-ui" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .display { font-family: 'Fraunces', serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .ticket { border: 1.5px dashed #16302B55; position: relative; }
        .ticket::before, .ticket::after {
          content: ""; position: absolute; width: 16px; height: 16px;
          background: #F5F7F1; border-radius: 50%; top: 50%; transform: translateY(-50%);
        }
        .ticket::before { left: -9px; }
        .ticket::after { right: -9px; }
      `}</style>

      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: "#16302B" }}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle, #F5F7F1 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-10">
          <div className="flex items-center gap-2 mb-5" style={{ color: "#F4B740" }}>
            <Compass size={20} strokeWidth={2.2} />
            <span className="mono text-xs tracking-widest uppercase">Carnet d'activités du jour</span>
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-tight" style={{ color: "#F5F7F1" }}>
            Mon Divertissement <span style={{ color: "#F4B740" }}>Zen+</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: "#F5F7F1CC" }}>
            Les 101 départements français, préfectures et communes alentours.
            Choisissez une ville pour voir ce qui occupe les enfants
            aujourd'hui, et filtrez par prix.
          </p>

          {/* Recherche libre d'une ville, tous départements confondus */}
          <div className="mt-7 relative max-w-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#F5F7F111", border: "1px solid #F5F7F133" }}>
              <Search size={15} color="#F5F7F1AA" />
              <input
                value={requete}
                onChange={(e) => { setRequete(e.target.value); setRechercheOuverte(true); }}
                onFocus={() => setRechercheOuverte(true)}
                placeholder="Chercher une ville…"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: "#F5F7F1" }}
              />
            </div>
            {rechercheOuverte && suggestionsVilles.length > 0 && (
              <div className="absolute mt-1 w-full rounded-xl overflow-hidden z-20" style={{ background: "#F5F7F1" }}>
                {suggestionsVilles.map((s) => (
                  <button
                    key={s.ville}
                    onClick={() => choisirVille(s.ville)}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-black/5"
                    style={{ color: "#16302B" }}
                  >
                    <span>{s.ville}</span>
                    <span className="mono text-[11px]" style={{ color: "#16302B77" }}>{s.departement} ({s.code})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteurs département / ville en cascade */}
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={departementCode}
              onChange={(e) => choisirDepartement(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium outline-none"
              style={{ background: "#F4B740", color: "#16302B", border: "none" }}
            >
              {DEPARTEMENTS.map((d) => (
                <option key={d.code} value={d.code}>{d.nom} ({d.code})</option>
              ))}
            </select>

            <select
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium outline-none"
              style={{ background: "#F5F7F122", color: "#F5F7F1", border: "1px solid #F5F7F133" }}
            >
              {departementActif.villes.map((v) => (
                <option key={v} value={v} style={{ color: "#16302B" }}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3" style={{ border: "1px solid #16302B14" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: "#F5F7F1" }}>
              <Search size={16} color="#16302B99" />
              <input
                value={rechercheActivite}
                onChange={(e) => setRechercheActivite(e.target.value)}
                placeholder="Chercher une activité ou un lieu…"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: "#16302B" }}
              />
            </div>

            {/* Filtre gratuit / payant */}
            <div className="flex gap-1.5 shrink-0">
              {[
                { id: "tous", label: "Tout", icon: Sun },
                { id: "gratuit", label: "Gratuit", icon: Gift },
                { id: "payant", label: "Payant", icon: Wallet },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPrixActive(id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={
                    prixActive === id
                      ? { background: "#EF5F4E", color: "#fff" }
                      : { background: "#F5F7F1", color: "#16302B" }
                  }
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCatActive("tous")}
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              style={catActive === "tous" ? { background: "#16302B", color: "#F5F7F1" } : { background: "#F5F7F1", color: "#16302B" }}
            >
              <Compass size={14} /> Toutes catégories
            </button>
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCatActive(id)}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                style={catActive === id ? { background: "#16302B", color: "#F5F7F1" } : { background: "#F5F7F1", color: "#16302B" }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="display text-xl" style={{ color: "#16302B" }}>
            À {ville} aujourd'hui
            <span className="mono text-xs align-middle ml-2" style={{ color: "#16302B66" }}>
              {departementActif.nom} ({departementActif.code})
            </span>
          </h2>
          <span className="mono text-xs" style={{ color: "#16302B88" }}>
            {filtres.length} activité{filtres.length > 1 ? "s" : ""}
          </span>
        </div>

        {evenements.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#E4EFE3" }}>
            <Compass className="mx-auto mb-3" color="#16302B99" />
            <p className="text-sm" style={{ color: "#16302B99" }}>
              Pas encore d'activités enregistrées pour {ville}. Essayez une
              grande ville comme Paris, Lyon, Marseille, Bordeaux, Lille,
              Toulouse ou Avignon, où des exemples sont déjà en place.
            </p>
          </div>
        ) : filtres.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#E4EFE3" }}>
            <Sparkles className="mx-auto mb-3" color="#16302B99" />
            <p className="text-sm" style={{ color: "#16302B99" }}>
              Rien ne correspond pour l'instant. Essayez une autre catégorie,
              un autre filtre de prix, ou changez de recherche.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {filtres.map((e) => {
              const Icon = CAT_META[e.cat].icon;
              const isFav = favoris.has(e.id);
              return (
                <article key={e.id} className="ticket bg-white rounded-xl p-5 flex flex-col gap-3" style={{ boxShadow: "0 1px 2px #16302B0D" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#F4B74022", color: "#8A5B0B" }}>
                      <Icon size={13} /> {CAT_META[e.cat].label}
                    </div>
                    <button
                      onClick={() => toggleFavori(e.id)}
                      aria-label="Ajouter aux favoris"
                      className="p-1.5 rounded-full"
                      style={{ background: isFav ? "#EF5F4E" : "#16302B0D" }}
                    >
                      <Heart size={15} color={isFav ? "#fff" : "#16302B99"} fill={isFav ? "#fff" : "none"} />
                    </button>
                  </div>

                  <h3 className="display text-lg leading-snug" style={{ color: "#16302B" }}>{e.titre}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: "#16302B99" }}>{e.desc}</p>

                  <div className="mt-1 pt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]" style={{ borderTop: "1px dashed #16302B22", color: "#16302B" }}>
                    <span className="flex items-center gap-1"><MapPin size={13} />{e.lieu}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{e.heure}</span>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded"
                      style={e.gratuit ? { background: "#4CAF5022", color: "#2E6B33" } : { background: "#EF5F4E22", color: "#B23A2E" }}
                    >
                      {e.gratuit ? <Gift size={13} /> : <Ticket size={13} />} {e.prix}
                    </span>
                    <span className="mono px-2 py-0.5 rounded" style={{ background: "#4FA8D822", color: "#1E5C7A" }}>{e.age}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-[12px] text-center" style={{ color: "#16302B66" }}>
          Exemples de démonstration — à remplacer par une source d'événements
          en direct pour afficher les activités réelles de chaque ville.
        </p>
      </main>
    </div>
  );
}
