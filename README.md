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

## Premier lancement

Quatre écrans, une fois pour toutes :

1. **Bienvenue** — le monde tourne déjà en fond, avec le moteur du voyage.
2. **Objectifs** — huit intentions au choix, multiples : bouger chaque jour,
   moins d'écrans, boire plus d'eau, mieux dormir, manger mieux, apaiser le
   mental, nourrir l'esprit, un intérieur clair. Chacune amorce une à deux
   habitudes. Un lien permet de partir d'une page blanche.
3. **Personnage** — les cinq héros côte à côte.
4. **Récapitulatif** — les habitudes créées, avant de valider.

Les objectifs restent modifiables depuis l'onglet **Habitudes** ; les
habitudes déjà présentes ne sont jamais dupliquées. Un compte existant ne
repasse pas par cet écran.

## Les personnages

Cinq héros illustrés à la main, conformes à la planche de référence :
**L'Explorateur**, **le Voyageur des Brumes**, **la Gardienne de Lumière**,
**l'Aventurière des Saisons** et **le Petit Rêveur**.

Chacun est livré en **planche de sprites** (512 × 4608 px, neuf poses :
repos, marche, course, saut, joie, regard, assis, sommeil, interaction).
Le moteur choisit la pose selon la situation — le héros marche quand tu
coches, s'assoit devant un obstacle, saute quand tu le franchis, exulte
quand tu boucles ta journée. Le grade lumineux du biome est appliqué au
personnage comme au décor : il appartient vraiment au paysage.

Le rendu vectoriel de `hero.js` reste en secours si une planche manque.

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

## Profil, préférences et données

Un onglet **Profil** rassemble le compte et les réglages :

- **Carte de compte** : nom de voyageur modifiable sur place, portrait du
  héros choisi, date du premier jour coché, niveau · or · pas.
- **Couleur de l'application** : six accents, corail par défaut.
- **Thème** : automatique (celui du téléphone), clair ou sombre forcé.
- **Préférences** : vibrations, sons, réduction des animations. Le réglage
  d'animation s'ajoute à celui du système et ne l'annule jamais.
- **Mes données** : export d'une sauvegarde JSON datée, import avec
  confirmation. Un fichier qui n'est pas une sauvegarde est refusé sans
  toucher aux données existantes.

Tout reste en `localStorage` : l'export est le seul moyen de retrouver ses
données en changeant d'appareil.

## Habitudes

Nom, icône (24 pictogrammes maison), couleur, difficulté, jours de la semaine.
10 suggestions prêtes à l'emploi. Aucun emoji, aucune icône tierce.

## Technique

| Fichier | Rôle |
|---|---|
| `world.js` | Moteur de rendu : biomes, silhouettes procédurales, grade jour/nuit, particules, Voyageur, obstacles |
| `sprites.js` | Pipeline de sprites : chargement des atlas, ordre z, machine d'états d'animation, intégration lumineuse |
| `scenery.js` | Décors illustrés : bandes de paysage répétées en miroir, objets semés, teinte de distance |
| `hero.js` | Catalogue des personnages et de la garde-robe · rendu vectoriel de secours |
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

## Test en local

⚠️ **Ne pas ouvrir `index.html` par double-clic.** En `file://`, le navigateur
bloque `fetch()` et le service worker : le monde ne s'affiche pas. Il faut
servir le dossier en HTTP.

```bash
cd Sport_Gamifier
npx http-server . -p 8080 -c-1
```

Puis ouvrir <http://localhost:8080>.

Autres options équivalentes :

```bash
python3 -m http.server 8080      # Python
php -S localhost:8080            # PHP
```

**Tester depuis le téléphone sur le même Wi-Fi** : relever l'adresse locale de
l'ordinateur (`ipconfig` sous Windows, `ifconfig | grep inet` sous macOS) et
ouvrir `http://<adresse>:8080` sur le mobile.

> Les planches de héros sont dans `assets/hero/` (~8,8 Mo). Le moteur ne
> charge que celle du personnage sélectionné.

## Installation sur le téléphone

PWA : ouvrir le site publié, puis **« Ajouter à l'écran d'accueil »**
(Android/Chrome) ou **Partager → « Sur l'écran d'accueil »** (iPhone/Safari).
