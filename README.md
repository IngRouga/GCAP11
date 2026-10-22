# GCAP11 — Landing page

Site statique (HTML / CSS / JS, sans framework ni build). À pousser tel quel sur GitHub → Cloudflare Pages
(Framework preset : None · Build command : vide · Output directory : `/`).

## Tout se règle dans `assets/js/config.js`
- `whatsappNumber` : numéro qui reçoit les réservations (format 22677076868)
- `heroVideo` : boucle muette du Hero (`assets/video/gcap11-hero.mp4`, extrait 0:04–1:11 du film officiel)
- `filmVideo` : film officiel complet avec le son, chargé seulement au clic sur « Regarder le film officiel »
- `passes.VIP.benefits` / `passes.VVIP.benefits` : avantages officiels (les extras VVIP sont mis en avant automatiquement)
- `compare` : lignes du tableau comparatif VIP / VVIP

Vidéo explicative des deux Pass : `assets/video/explication.mp4` (conversion web intégrale de `explication.MOV`, sans coupe), affichée entre les cartes et le comparatif.
- `eventStart` : DATE CIBLE UNIQUE des 3 comptes à rebours (2026-11-19T08:00:00Z, Ouagadougou = UTC+0)
- `eventEnd` : fin de la soirée de clôture (2026-11-22T23:00:00Z)
- `phones`

Programme officiel des 4 jours : écrit directement dans `index.html`, section `id="jours"`.
Comptes à rebours : Hero, bloc « Le rendez-vous approche » avant les Pass, CTA final.

## Structure
- `index.html` — page
- `assets/css/style.css` — design
- `assets/js/main.js` — compte à rebours, animations, programme, formulaire → WhatsApp
- `assets/img/` — photos officielles optimisées (WebP) + détourages du Coach et de Marcus Garvey extraits de l'affiche

Domaine : canonical, Open Graph et Twitter pointent vers https://www.gcap11.com/

Cloudflare Pages refuse les fichiers de plus de 25 Mo : ne laissez dans `assets/video/` que
`gcap11-hero.mp4` et `gcap11-film.mp4` (pas les rushes .MOV ni l'export original).
