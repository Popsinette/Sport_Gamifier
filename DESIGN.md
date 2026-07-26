# Odyssée — Design System

> **Bible graphique du projet.** La planche de référence des cinq aventuriers
> fait autorité. Tout nouveau personnage, biome, objet ou animation doit être
> justifiable par ce document. En cas de doute, la référence tranche.

---

## 0. Note de production — lire en premier

La référence est de **l'illustration rendue** : peau à diffusion sous-cutanée,
plis de tissu peints, grain du cuir, mèches avec spéculaire, occlusion
ambiante. **Ce rendu ne s'obtient pas en dessinant par code** (tracés vectoriels
Canvas/SVG). Il s'obtient par des **sprites : images produites en amont**, puis
affichées et animées par le moteur.

Le projet est donc structuré en deux couches :

| Couche | Rôle | État |
|---|---|---|
| **Pipeline sprites** (`sprites.js`) | charge un atlas PNG + JSON, joue les animations, applique la lumière du biome | **prêt, en attente d'assets** |
| **Rendu vectoriel** (`hero.js`) | secours automatique quand aucun atlas n'est présent | actif |

Dès qu'un atlas conforme au §7 est déposé dans `assets/hero/`, le moteur bascule
dessus sans autre modification. Le rendu vectoriel reste comme filet de sécurité
(chargement, hors-ligne, `prefers-reduced-motion`).

---

## 1. Identité

**« Un jeu contemplatif déguisé en application d'habitudes. »**

Registre : chaleureux, doux, artisanal. Références : Nintendo, Ghibli, *Journey*,
*Sky: Children of the Light*, *Spiritfarer*.

### Règles non négociables

1. **Personnages chibi semi-réalistes.** Grande tête, petit corps, visage
   expressif. Jamais de silhouette abstraite, jamais de pictogramme.
2. **Matières lisibles.** On doit reconnaître le cuir, la laine, le métal, le
   bois. Une tenue n'est jamais un aplat de couleur.
3. **Ombrage doux.** Pas de contour noir dur, pas d'ombre à bord net. Les
   volumes se lisent par dégradés et occlusion.
4. **Une seule source de lumière par scène**, cohérente entre décor et
   personnage.
5. **Palette naturelle.** Terres, bois, végétal, ciel. Aucune couleur criarde.

---

## 2. Les cinq archétypes

Palettes **échantillonnées directement dans la planche de référence**.

### 1 · L'Explorateur — *curieux et courageux*
`#532f14` `#b75a29` `#4b786a` `#e7d3b2` `#3a230f`
Cuir brun, cape orangée, tunique sarcelle, lin écru. Sac de voyage bombé,
sangles croisées. Cheveux bruns en bataille.

### 2 · Le Voyageur des Brumes — *mystérieux et poétique*
`#10152c` `#201c47` `#52558a` `#a57aa7` `#e7b86c` `#0e1229`
Grande cape à capuche indigo, broderies dorées, lanterne à la main. Cheveux
blancs. Le visage reste en partie dans l'ombre de la capuche.

### 3 · La Gardienne de Lumière — *douce et bienveillante*
`#e7d6bd` `#f1c26f` `#e49f82` `#82aca2` `#d4d3ba` `#e5c390` `#7a522f`
Robe crème, étole dorée, motifs étoilés. Cheveux blancs longs. Lumière chaude
émanant du vêtement.

### 4 · L'Aventurière des Saisons — *libre et déterminée*
`#523f2c` `#7d8b50` `#808160` `#c16737` `#cba772` `#e8d7bd` `#4f3b29`
Cape verte à capuche, tunique de cuir, sacoche de cuisse. Cheveux bruns en
queue haute nouée d'un ruban vert.

### 5 · Le Petit Rêveur — *rêveur et optimiste*
`#788695` `#9cafba` `#efd7ac` `#e0d0b8` `#9e9e9a` `#a1927d`
Cape bleu nuit constellée d'étoiles, tenue laine claire. Cheveux gris-bleu
bouclés.

---

## 3. Proportions du personnage

**Mesurées sur le turnaround de l'Explorateur** (référence, vue de face) :

| Grandeur | Valeur | En fraction de la hauteur |
|---|---|---|
| Hauteur totale | 169 px | 1,000 |
| Hauteur de tête (sommet des cheveux → menton) | 63 px | **0,373** |
| **Rapport** | **2,68 têtes** | — |
| Largeur maximale (sac + cape inclus) | 90 px | 0,533 |
| Largeur d'épaules (sans accessoires) | ~48 px | 0,284 |

### Points d'articulation (fraction de hauteur, origine aux pieds)

```
sol            0,000
cheville       0,075
genou          0,175
hanche         0,315
taille         0,375
épaule         0,565
menton         0,627
centre de tête 0,800
sommet crâne   1,000
```

### Règles de visage

- Les yeux occupent **la moitié inférieure de la tête**, centre à ~0,46 de la
  hauteur de tête depuis le menton.
- Diamètre d'œil ≈ **0,17 de la largeur de tête**. Iris large, deux reflets
  (un grand en haut, un petit en bas opposé).
- Écart inter-oculaire ≈ un œil et demi.
- Joues rosées systématiques, opacité 25-40 %.
- Bouche petite, jamais de dents en pose neutre.
- Nez suggéré par une ombre, jamais tracé.

---

## 4. Garde-robe & progression

Tout accessoire doit exister en **cinq vues** (face, 3/4, profil, 3/4 dos, dos)
et suivre la palette de son archétype.

| Emplacement | Pièces | Débloqué par |
|---|---|---|
| Coiffure | courts, ondulés, longs, queue haute, chignon, bouclés, tresses | niveau, pas parcourus |
| Tenue | tunique, manteau long, robe de voyage, tenue d'hiver, tenue du désert | niveau, obstacles, biomes |
| Cape | lin, grande cape, plumes, étoilée, aurore | niveau, série, obstacles, biomes |
| Sac | besace, sac à dos, sac & couchage, sac & lanterne | niveau, pas, obstacles |
| Bottes | marche, cuir renforcé, fourrées, hautes de voyage | pas, biomes |
| Foulard | lin, laine, soie brodée | série, journées parfaites |
| Compagnon | renard des brumes, hibou messager, chat des étoiles, faon des forêts, esprit lumineux | série, niveau, journées parfaites |
| Monture | cheval, grand cerf, dragonnet | niveau, biomes |

**Cohérence saisonnière** : chaque tenue possède une déclinaison été / hiver.
Le moteur peut proposer automatiquement la déclinaison correspondant au biome
courant (neige → fourrure, désert → lin clair) sans changer la pièce choisie.

---

## 5. Règles d'animation

Cadence de référence : **12 images/seconde**, boucles paires.

| État | Images | Durée | Notes |
|---|---|---|---|
| `idle` | 8 | 3,4 s | respiration, épaules qui montent puis retombent |
| `look` | 10 | 2,0 s | tourne la tête, revient — déclenché toutes les 6-9 s |
| `walk` | 12 | 0,9 s | contact, passage, écart ; rebond vertical 2 fois par cycle |
| `run` | 10 | 0,6 s | buste penché en avant, foulée allongée |
| `jump` | 9 | 1,0 s | anticipation (3), envol (3), réception amortie (3) |
| `cheer` | 12 | 1,2 s | saut, bras levés, yeux fermés en arcs |
| `sit` | 6 | 2,4 s | assis, jambes repliées, léger balancement |
| `sleep` | 6 | 4,0 s | couché, respiration lente, bulle de sommeil |
| `interact` | 10 | 1,4 s | pousse / tire / lève selon l'obstacle |

### Principes appliqués

- **Anticipation** avant chaque action ample.
- **Suivi et chevauchement** : cape, cheveux et sac sont toujours en retard de
  1 à 2 images sur le corps. Jamais synchrones.
- **Arcs** : aucune trajectoire rectiligne.
- **Accompagnement** : `cubic-bezier(.22, 1, .36, 1)` pour toute transition
  d'interface liée au personnage.
- **Vent** : la cape est une chaîne de 7 segments parcourue par une onde ; le
  segment *n* est en retard de `n × 0,12 s` sur le segment 0.

---

## 6. Environnement

### Perspective atmosphérique

Chaque plan est mélangé vers la couleur de brouillard du biome selon son
éloignement. C'est ce dégradé de contraste — non le nombre de détails — qui
crée la profondeur.

| Plan | Vitesse | Brouillard | Valeur |
|---|---|---|---|
| Ciel | 0 | — | 80-95 % |
| Nuages | 0,04 | 85 % | 75-90 % |
| Montagnes lointaines | 0,10 | 70 % | 60-75 % |
| Relief moyen | 0,22 | 45 % | 45-60 % |
| Végétation proche | 0,45 | 20 % | 30-45 % |
| Sol / sentier | 1,00 | 0 % | référence |
| Premier plan | 1,55 | assombri | 10-25 % |

Le personnage se place toujours dans la **bande de valeur médiane** pour rester
lisible sur les 18 biomes.

### Style des éléments naturels

- **Arbres** — silhouette en amas, jamais en triangle géométrique. Couronne
  éclairée sur le dessus côté soleil, base fondue dans l'ombre.
- **Rochers** — plans facettés, arête supérieure captant la lumière, base
  ancrée par une ombre de contact.
- **Montagnes** — arête irrégulière, névés dans les creux et non sur les
  sommets, base noyée dans le brouillard.
- **Maisons** — toit dominant, matériaux visibles (bois, tuile, chaume),
  fenêtres chaudes la nuit.
- **Eau** — reflet du soleil en traits horizontaux animés, bord clair.

### Cycle jour/nuit

Une seule palette de jour par biome, traversée par un **grade lumineux
multiplicatif** appliqué à toutes les couleurs, personnage compris.

| Heure | Phase | Ambiant (R,G,B) | Lumière | Étoiles |
|---|---|---|---|---|
| 0 h | Nuit | 0,30 / 0,34 / 0,52 | `#9fb6e0` | 100 % |
| 5 h 30 | Aube | 0,55 / 0,48 / 0,55 | `#ffb98a` | 50 % |
| 8 h | Matin | 0,92 / 0,92 / 0,95 | `#fff0d0` | 0 % |
| 13 h | Zénith | 1,00 / 1,00 / 1,00 | `#fffaf0` | 0 % |
| 18 h | Crépuscule | 0,95 / 0,82 / 0,74 | `#ff9e5e` | 0 % |
| 20 h 30 | Soir | 0,55 / 0,50 / 0,62 | `#e07a5f` | 40 % |

Le canal bleu est préservé la nuit (0,52 quand le rouge tombe à 0,30) :
convention « nuit américaine », lisible sans devenir noire.

**Le personnage subit le même grade que le décor** — c'est la condition pour
qu'il paraisse *dans* la scène et non collé dessus. Un liseré de lumière teinté
de la couleur solaire court sur son côté exposé.

### Particules

Budget : **220 actives maximum**. Une ambiance dominante par biome.

`poussière · neige · lucioles · pétales · braises · brume · embruns · feuilles ·
pluie · aurore` + vols d'oiseaux et bancs de nuages.

Règle : les particules de premier plan sont plus grandes, plus rapides et plus
floues que celles du fond.

---

## 7. Structure des assets

### Arborescence

```
assets/
  hero/
    manifest.json           — index des jeux disponibles
    body_<archetype>.png    — atlas de la couche corps
    body_<archetype>.json
    outfit_<id>.png|json
    cape_<id>.png|json
    hair_<id>.png|json
    pack_<id>.png|json
    pet_<id>.png|json
    mount_<id>.png|json
  props/
  biomes/
```

### Format d'atlas

Grille régulière : une **ligne par animation**, une **colonne par image**.

```json
{
  "image": "outfit_tunic.png",
  "frameW": 256,
  "frameH": 256,
  "anchorX": 0.5,
  "anchorY": 0.94,
  "heightRatio": 0.86,
  "z": 30,
  "animations": {
    "idle":  { "row": 0, "frames": 8,  "fps": 12, "loop": true },
    "walk":  { "row": 1, "frames": 12, "fps": 12, "loop": true },
    "run":   { "row": 2, "frames": 10, "fps": 16, "loop": true },
    "jump":  { "row": 3, "frames": 9,  "fps": 12, "loop": false },
    "cheer": { "row": 4, "frames": 12, "fps": 12, "loop": false },
    "look":  { "row": 5, "frames": 10, "fps": 10, "loop": false },
    "sit":   { "row": 6, "frames": 6,  "fps": 8,  "loop": true },
    "sleep": { "row": 7, "frames": 6,  "fps": 5,  "loop": true },
    "interact": { "row": 8, "frames": 10, "fps": 12, "loop": false }
  }
}
```

- `anchorX/Y` — point d'ancrage dans l'image, en fraction. `anchorY: 0.94`
  place les pieds à 94 % de la hauteur d'image.
- `heightRatio` — hauteur du personnage dans l'image, en fraction. Sert à
  caler toutes les couches à la même échelle.
- `z` — ordre de composition.

### Ordre de composition (z)

```
 0  monture
10  cape — pan arrière
20  sac
30  corps + tenue
40  bottes
50  cheveux — masse arrière
60  tête + visage
70  cheveux — frange
80  foulard
90  cape — pan avant
95  lanterne (+ halo lumineux additif)
```

### Contraintes de production

- PNG 32 bits, **transparence prémultipliée non requise**.
- Toutes les couches d'un même personnage partagent `frameW`, `frameH`,
  `anchorX/Y` et `heightRatio` — sinon elles ne se superposent pas.
- Résolution cible : **256 × 256 par image** (512 pour les montures).
- Le personnage doit occuper la même position dans la grille sur toutes les
  animations : aucun décalage de cadrage entre lignes.
- Marge de sécurité de 8 px autour du sujet pour éviter le bavement de
  filtrage.
- Fournir chaque atlas en **@1x et @2x**.

### Portabilité React Native

Le format ci-dessus est indépendant du moteur. Le même PNG + JSON se lit :

- sur le web via `drawImage` (implémentation actuelle) ;
- en React Native via `expo-image` + `Animated`, ou
  `@shopify/react-native-skia` (`useImage` + `<Image>` avec `srcRect`).

Aucune reprise d'assets n'est nécessaire pour passer de l'un à l'autre.

---

## 8. Interface

L'interface flotte **au-dessus** du monde, elle ne l'encadre pas.

```
Encre            #0B0F14 (clair) · #F4F7FA (sombre)
Encre secondaire opacité 62 %
Encre tertiaire  opacité 38 %
Verre            blanc 72 % / noir 46 % + flou 24 px + saturation 180 %
Accent           dégradé 2 stops, 6 thèmes
Succès  #3DBE7C   Alerte #E8A33D   Danger #E06A5F
```

Les couleurs de statut sont volontairement désaturées de ~12 % par rapport aux
couleurs système iOS : dans un décor pastel, un vert pur hurle.

Typographie : pile système. Titres poids 760, interlettrage `-0.028em`.
Libellés poids 620, interlettrage `0.09em`, petites capitales. Chiffres
tabulaires partout.

Rayons : 26 px (cartes), 18 px (blocs), 13 px (contrôles). Grille de 4 px.

---

## 9. Performance

- 60 FPS cible sur mobile milieu de gamme.
- `devicePixelRatio` plafonné à 2.
- Atlas décodés une seule fois puis conservés en mémoire.
- Boucle de rendu suspendue quand l'onglet est masqué.
- `prefers-reduced-motion` : le monde se fige sur une image composée, toutes
  les informations restent lisibles.
