# Odyssée — Habitudes & voyage

Une application d'habitudes quotidiennes qui se joue comme un jeu contemplatif.
Chaque habitude cochée fait avancer **le Voyageur** à travers un monde vivant —
18 paysages, cycle jour/nuit réel, météo, obstacles à franchir.

> La direction artistique complète est documentée dans **[DESIGN.md](DESIGN.md)**.

## Le voyage

- Scène **rendue en Canvas 2D temps réel, 60 FPS** : parallaxe à 7 couches,
  perspective atmosphérique, rayons volumétriques, particules, vignettage.
- **Cycle jour/nuit** piloté par l'heure réelle. Un unique grade lumineux
  multiplicatif traverse toutes les couches — aube, plein jour, crépuscule,
  nuit étoilée avec lanterne allumée.
- **18 biomes** : Vallée de l'Aube, Alpes Enneigées, Forêt Enchantée, Rizières
  Japonaises, Cerisiers en Fleurs, Dunes du Désert, Canyon Rouge, Jungle
  Tropicale, Falaises Océanes, Fjord Nordique, Forêt d'Automne, Terres
  Volcaniques, Toundra Glacée, Temple des Nuages, Village Médiéval, Îles
  Tropicales, Cité Flottante, Aurore Boréale.
- Chaque biome a sa **météo** : neige, pétales, feuilles, braises, lucioles,
  brume, embruns, poussière, aurores.
- **Silhouettes procédurales** : 8 générateurs (crêtes, collines, dunes,
  plateaux, forêts, mers, architecture, îles flottantes) × palettes = un
  catalogue extensible à l'infini, jamais dessiné à la main.

## Les obstacles

Le monde s'arrête devant un **événement mis en scène** : éboulement, rivière en
crue, pont brisé, forêt sombre, ours, tempête, mur de glace, faille, avalanche,
porte antique, dragon endormi, grande traversée.

Pour passer, il faut selon les cas :
1. un **petit défi physique réel** (10 squats, 30 s de gainage, 10 respirations…) ;
2. un **niveau**, une **série** ou un **total de coches** ;
3. les deux combinés pour les passages majeurs, qui ouvrent un nouveau paysage.

## La progression

- XP par difficulté (5 / 10 / 15), bonus de journée parfaite (+25)
- Niveaux et titres, de « Premiers pas » à « Légende du chemin »
- **Gels de série** ❄️ : chaque journée parfaite en offre un (max 3). Un jour
  manqué consomme un gel au lieu de casser la série. Sans gel, aucun malus —
  juste un message bienveillant.
- Paliers de série (3/7/14/30/50/100 jours), défi hebdomadaire tournant,
  20 trophées, calendrier de chaleur mensuel

## Habitudes

Nom, icône (24 pictogrammes maison), couleur, difficulté, jours de la semaine.
10 suggestions prêtes à l'emploi. Aucun emoji, aucune icône tierce.

## Technique

| Fichier | Rôle |
|---|---|
| `world.js` | Moteur de rendu : biomes, silhouettes procédurales, grade jour/nuit, particules, Voyageur, obstacles |
| `icons.js` | Jeu d'icônes SVG maison (grille 24, trait 1,6) |
| `styles.css` | Système d'interface : verre, typographie, espacements, animations |
| `app.js` | État, logique de progression, rendu de l'interface |
| `index.html` | Structure |
| `sw.js` | Fonctionnement hors-ligne |

- `Path2D` mis en cache par (biome, couche, tuile) — aucune géométrie recalculée
- Boucle `requestAnimationFrame` mise en pause quand l'onglet est masqué
- `devicePixelRatio` plafonné à 2, ≤ 220 particules
- Respect de `prefers-reduced-motion`
- Mode sombre automatique
- Données 100 % locales (`localStorage`), rien n'est envoyé en ligne

## Installation

PWA : ouvrir le site sur le téléphone, puis **« Ajouter à l'écran d'accueil »**
(Android/Chrome) ou **Partager → « Sur l'écran d'accueil »** (iPhone/Safari).

```bash
npx http-server .   # test local
```
