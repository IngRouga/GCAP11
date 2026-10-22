/* =========================================================
   GCAP11 — CONFIGURATION
   Tout ce qui est susceptible de changer se modifie ICI.
   Aucune autre modification de code n'est nécessaire.
   ========================================================= */
window.GCAP_CONFIG = {

  /* Numéro WhatsApp qui reçoit les réservations
     Format international SANS "+", SANS espaces. */
  whatsappNumber: "22677076868",

  /* Contacts affichés (affiche officielle) */
  phones: ["+226 77 07 68 68", "+226 54 10 49 87"],

  /* DATE CIBLE UNIQUE des comptes à rebours : 19 novembre 2026 à 08:00:00,
     heure de Ouagadougou (UTC+0, d'où le "Z"). Les 3 compteurs du site
     calculent le temps restant à partir de cette seule valeur.
     eventEnd : fin de la soirée de clôture (22 novembre, 23H00). */
  eventStart: "2026-11-19T08:00:00Z",
  eventEnd:   "2026-11-22T23:00:00Z",

  /* Vidéo du Hero : boucle muette en arrière-plan (extrait du film officiel).
     Laissez "" pour n'afficher que l'image fixe + le portrait du Coach. */
  heroVideo: "assets/video/gcap11-hero.mp4",

  /* Film officiel complet, avec le son : bouton « Regarder le film officiel ».
     Chargé uniquement quand le visiteur clique. Laissez "" pour masquer le bouton. */
  filmVideo: "assets/video/gcap11-film.mp4",

  /* Les Pass — avantages OFFICIELS (ne rien ajouter sans validation).
     Les avantages du VVIP absents du VIP sont mis en avant automatiquement. */
  passes: {
    VIP: {
      label: "Pass VIP",
      price: 500000,
      benefits: [
        "Formation intégrale de 4 jours",
        "Restauration",
        "Rencontre B2B",
        "Réseautage",
        "Dîner Gala"
      ]
    },
    VVIP: {
      label: "Pass VVIP",
      price: 1000000,
      benefits: [
        "Formation intégrale de 4 jours",
        "Restauration",
        "Rencontre B2B",
        "Réseautage",
        "Dîner Gala",
        "Transport personnalisé",
        "Hébergement"
      ]
    }
  },

  /* Lignes du tableau comparatif VIP / VVIP (même orthographe que ci-dessus) */
  compare: [
    "Formation intégrale de 4 jours",
    "Restauration",
    "Rencontre B2B",
    "Réseautage",
    "Dîner Gala",
    "Transport personnalisé",
    "Hébergement"
  ]

  /* Le programme officiel des 4 jours est écrit directement dans index.html
     (section id="jours") pour être lu par Google et visible sans JavaScript. */
};
