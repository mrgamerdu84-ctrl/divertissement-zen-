// ---------------------------------------------------------------------------
// Événements de démonstration, par nom de commune.
// Dans une vraie mise en service, ce tableau serait remplacé par les
// résultats d'une source d'événements en direct (OpenAgenda, data.gouv.fr,
// offices de tourisme...) filtrée sur la commune choisie.
// `gratuit: true/false` alimente le filtre Gratuit / Payant.
// ---------------------------------------------------------------------------
export const EVENEMENTS = {
  Paris: [
    { id: 1, titre: "Chasse au trésor au Jardin des Plantes", cat: "jeux", age: "5-10 ans", lieu: "Jardin des Plantes, 5e", heure: "10h - 12h", prix: "Gratuit", gratuit: true, desc: "Un parcours à énigmes dans les allées botaniques, carnet d'indices fourni sur place." },
    { id: 2, titre: "Atelier marionnettes en papier mâché", cat: "creatif", age: "4-8 ans", lieu: "Médiathèque du Marais", heure: "14h - 16h", prix: "5 €", gratuit: false, desc: "Chaque enfant repart avec sa marionnette et fabrique un petit spectacle en fin de séance." },
    { id: 3, titre: "Petit concert de contes musicaux", cat: "musique", age: "3-7 ans", lieu: "Parc de la Villette", heure: "16h30", prix: "Gratuit", gratuit: true, desc: "Un duo violoncelle-voix raconte trois histoires courtes, assis sur des coussins." },
    { id: 4, titre: "Guignol du jardin", cat: "spectacle", age: "3-9 ans", lieu: "Jardin du Luxembourg", heure: "15h et 16h30", prix: "3,50 €", gratuit: false, desc: "Séances traditionnelles de guignol, deux représentations l'après-midi." },
  ],
  Lyon: [
    { id: 5, titre: "Balade nature au Parc de la Tête d'Or", cat: "nature", age: "Tous âges", lieu: "Parc de la Tête d'Or", heure: "10h - 11h30", prix: "Gratuit", gratuit: true, desc: "Découverte des oiseaux du parc avec jumelles prêtées, animée par un guide nature." },
    { id: 6, titre: "Atelier fresque collective", cat: "creatif", age: "6-12 ans", lieu: "MJC Presqu'île", heure: "14h - 17h", prix: "4 €", gratuit: false, desc: "Chaque enfant peint une portion d'une fresque commune sur le thème de la ville imaginaire." },
    { id: 7, titre: "Escape game junior", cat: "jeux", age: "8-12 ans", lieu: "Vieux Lyon", heure: "11h, 14h, 16h", prix: "8 €", gratuit: false, desc: "Version courte et guidée d'un escape game dans les traboules, sans énigme effrayante." },
  ],
  Marseille: [
    { id: 8, titre: "Initiation paddle en famille", cat: "nature", age: "7 ans et +", lieu: "Plage du Prado", heure: "9h - 11h", prix: "12 €", gratuit: false, desc: "Séance encadrée, matériel et gilets fournis, groupes de 6 enfants maximum." },
    { id: 9, titre: "Spectacle d'ombres chinoises", cat: "spectacle", age: "3-8 ans", lieu: "Théâtre de la Mer", heure: "17h", prix: "Gratuit", gratuit: true, desc: "Une compagnie locale présente un conte provençal en ombres et musique live." },
    { id: 10, titre: "Atelier céramique", cat: "creatif", age: "6-11 ans", lieu: "Friche la Belle de Mai", heure: "10h - 12h", prix: "6 €", gratuit: false, desc: "Modelage d'un petit bol, cuisson et récupération la semaine suivante." },
  ],
  Bordeaux: [
    { id: 11, titre: "Rallye vélo dans les Chartrons", cat: "nature", age: "6-12 ans", lieu: "Quartier des Chartrons", heure: "10h - 12h", prix: "Gratuit", gratuit: true, desc: "Parcours balisé à vélo avec questions sur le patrimoine du quartier." },
    { id: 12, titre: "Atelier illusions d'optique", cat: "creatif", age: "7-11 ans", lieu: "Cap Sciences", heure: "14h - 15h30", prix: "5 €", gratuit: false, desc: "Construction d'un petit jouet optique à emporter, animé par un médiateur scientifique." },
    { id: 13, titre: "Mini-concert participatif", cat: "musique", age: "2-6 ans", lieu: "Jardin Public", heure: "10h30", prix: "Gratuit", gratuit: true, desc: "Comptines et instruments à toucher, séance pensée pour les tout-petits." },
  ],
  Lille: [
    { id: 14, titre: "Chasse aux mots à la Braderie", cat: "jeux", age: "5-10 ans", lieu: "Vieux-Lille", heure: "11h - 13h", prix: "Gratuit", gratuit: true, desc: "Parcours-devinette dans les ruelles pour reconstituer une phrase mystère." },
    { id: 15, titre: "Théâtre d'improvisation jeune public", cat: "spectacle", age: "6-12 ans", lieu: "Maison Folie Wazemmes", heure: "15h", prix: "4 €", gratuit: false, desc: "Les enfants proposent des idées, la troupe improvise l'histoire en direct." },
    { id: 16, titre: "Atelier cirque découverte", cat: "creatif", age: "4-9 ans", lieu: "Parc Jean-Baptiste Lebas", heure: "10h - 11h30", prix: "6 €", gratuit: false, desc: "Jonglage, équilibre et petit numéro de fin de séance devant les familles." },
  ],
  Toulouse: [
    { id: 17, titre: "Observation des étoiles", cat: "nature", age: "8 ans et +", lieu: "Cité de l'espace", heure: "20h30", prix: "10 €", gratuit: false, desc: "Séance de planétarium suivie d'observation au télescope si le ciel est dégagé." },
    { id: 18, titre: "Atelier BD en famille", cat: "creatif", age: "7-12 ans", lieu: "Médiathèque José Cabanis", heure: "14h - 16h", prix: "Gratuit", gratuit: true, desc: "Création d'une planche de 4 cases avec un auteur local, matériel fourni." },
    { id: 19, titre: "Fanfare surprise dans les jardins", cat: "musique", age: "Tous âges", lieu: "Jardin des Plantes", heure: "16h", prix: "Gratuit", gratuit: true, desc: "Déambulation musicale de 30 minutes, arrêts pour faire danser les plus jeunes." },
  ],
  Avignon: [
    { id: 20, titre: "Visite-jeu des remparts", cat: "jeux", age: "6-11 ans", lieu: "Remparts d'Avignon", heure: "10h - 11h30", prix: "Gratuit", gratuit: true, desc: "Un livret-jeu pour repérer les détails cachés des remparts, en famille." },
    { id: 21, titre: "Atelier masques de théâtre", cat: "creatif", age: "5-10 ans", lieu: "Maison Jean Vilar", heure: "14h - 16h", prix: "5 €", gratuit: false, desc: "Fabrication d'un masque en papier mâché, en écho à l'histoire du Festival d'Avignon." },
  ],
};
