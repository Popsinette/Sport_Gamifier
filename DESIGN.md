# Odyssée — Direction Artistique

> Bible visuelle du projet. Toute nouvelle scène, icône ou composant doit
> pouvoir être justifié par ce document.

---

## 1. Intention

**« Un jeu vidéo contemplatif déguisé en app d'habitudes. »**

L'utilisateur ne coche pas une liste : il **avance dans un monde**. L'écran
d'accueil est une **fenêtre cinématique** sur ce monde — caméra latérale,
personnage suivi, décor qui défile. L'interface flotte *au-dessus* du monde,
elle ne l'encadre pas.

Sensation cible : ouvrir l'app doit produire le même petit frisson que lancer
*Alto's Odyssey* — calme, lumière, envie de rester.

### Les trois règles non négociables

1. **Aucun emoji, aucune icône générique, aucun clipart.** Tout pictogramme est
   un tracé SVG maison, ligne 1,6 px, terminaisons arrondies.
2. **Silhouette + dégradé + brouillard, jamais aplat + contour.** C'est LA
   différence entre « dessin enfantin » et « jeu premium ».
3. **Une seule source de lumière par scène**, cohérente sur toutes les couches
   (ciel, décor, personnage, UI).

---

## 2. Le principe visuel fondateur : la perspective atmosphérique

C'est le moteur de tout le rendu. Chaque couche de décor, du fond vers l'avant :

| Couche | Vitesse | Mélange au brouillard | Contraste | Saturation |
|---|---|---|---|---|
| Ciel | 0 | — | — | — |
| Nuages | 0,04 | 85 % | très bas | très basse |
| Montagnes lointaines | 0,10 | 70 % | bas | basse |
| Relief moyen | 0,22 | 45 % | moyen | moyenne |
| Végétation proche | 0,45 | 20 % | haut | haute |
| Sol / sentier | 1,00 | 0 % | référence | référence |
| Premier plan | 1,70 | 0 % (assombri) | très haut | basse (silhouette) |

Chaque couche est **mélangée vers la couleur de brouillard du biome** selon son
éloignement. C'est ce dégradé de contraste — et non le nombre de détails — qui
crée la profondeur cinématique.

**Étagement des valeurs** : le fond reste dans les tons clairs (valeur 70-90 %),
le premier plan dans les tons sombres (valeur 10-25 %). Le personnage se place
toujours sur la bande de valeur médiane pour rester lisible en toutes
circonstances.

---

## 3. Système colorimétrique

### 3.1 Le grade unique (cycle jour/nuit)

Plutôt que quatre palettes par biome, **une seule palette de jour** par biome,
traversée par un **grade lumineux global** appliqué en multiplication à
*toutes* les couleurs, personnage compris. C'est la technique du color grading
cinéma : elle garantit l'unité chromatique et évite l'effet « autocollants ».

| Heure | Phase | Multiplicateur ambiant (R,G,B) | Lumière | Étoiles |
|---|---|---|---|---|
| 0 h | Nuit profonde | 0,30 / 0,34 / 0,52 | `#9fb6e0` | 100 % |
| 5 h 30 | Aube | 0,55 / 0,48 / 0,55 | `#ffb98a` | 50 % |
| 8 h | Matin | 0,92 / 0,92 / 0,95 | `#fff0d0` | 0 % |
| 13 h | Zénith | 1,00 / 1,00 / 1,00 | `#fffaf0` | 0 % |
| 18 h | Crépuscule | 0,95 / 0,82 / 0,74 | `#ff9e5e` | 0 % |
| 20 h 30 | Soir | 0,55 / 0,50 / 0,62 | `#e07a5f` | 40 % |

Le multiplicateur bleuit les nuits (canal bleu conservé à 0,52 quand le rouge
tombe à 0,30) : c'est la convention « nuit américaine », elle lit comme la nuit
sans devenir noire et illisible.

La **position du soleil** suit la même courbe : haut à midi, rasant à l'aube et
au crépuscule — ce qui allonge les ombres et colore les rayons.

### 3.2 Palette d'interface (neutre, jamais agressive)

L'UI ne concurrence jamais le décor. Elle est **achromatique + une teinte
d'accent**.

```
Encre           #0B0F14   (clair)   #F4F7FA  (sombre)
Encre secondaire opacité 62 %
Encre tertiaire  opacité 38 %
Verre            blanc 72 % / noir 46 %  + flou 24 px + saturation 180 %
Bordure de verre blanc 40 % (clair) / blanc 12 % (sombre)
Accent           dégradé 2 stops, 6 thèmes au choix
Succès           #3DBE7C   Alerte #E8A33D   Danger #E06A5F
```

Les couleurs de statut sont **désaturées** par rapport aux couleurs système
iOS : dans un décor pastel, un `#34C759` pur hurle. On perd 12 % de saturation
et 6 % de luminosité.

---

## 4. Les biomes

18 biomes, 25 pas chacun, puis boucle en « Tour 2 ». Chaque biome est défini
par une **structure de données** (palette + spécification de couches), pas par
un dessin : c'est ce qui rend le catalogue extensible à l'infini.

```
Vallée de l'Aube · Alpes Enneigées · Forêt Enchantée · Rizières Japonaises
Cerisiers en Fleurs · Dunes du Désert · Canyon Rouge · Jungle Tropicale
Falaises Océanes · Fjord Nordique · Forêt d'Automne · Terres Volcaniques
Toundra Glacée · Temple des Nuages · Village Médiéval · Îles Tropicales
Cité Flottante · Aurore Boréale
```

### Générateurs de silhouettes

Huit types procéduraux, combinés et recolorés par biome :

- `ridge` — crêtes montagneuses (bruit fractal, arêtes anguleuses, névés)
- `hills` — collines douces (courbes quadratiques lissées)
- `dunes` — dunes (sinusoïdes larges superposées)
- `mesa` — plateaux à sommet plat (canyon)
- `forest` — rangées d'arbres (conifère / rond / palmier / bambou)
- `sea` — plans d'eau avec reflet de lumière animé
- `struct` — architecture (pagode, village, ruines, arche)
- `float` — îlots flottants (fantastique)

Chaque tuile est **générée avec une graine déterministe** (`biome + couche +
index`) : le paysage est toujours identique pour un même point du voyage, mais
n'est jamais dessiné à la main.

### Ambiance par biome

Particules, météo et faune sont des propriétés du biome :
`poussière · neige · lucioles · pétales · braises · brume · embruns · feuilles ·
pluie · aurore`, plus vols d'oiseaux et bancs de nuages.

---

## 5. Le Héros — la mascotte

Le personnage n'est pas un pion : c'est **le héros du joueur**, créé puis
enrichi tout au long du voyage. C'est le levier d'attachement principal.

**Style** : proportions Nintendo — la tête fait environ un tiers de la
silhouette. Visage expressif dessiné (yeux avec reflet, sourcils, cils, nez,
bouche, joues rosées), vêtements en couches avec plis et ceinture, liseré de
lumière solaire sur tout le côté exposé.

**Création** — silhouette (fine / neutre / robuste), teint, coiffure, tenue,
cape, sac, compagnon, monture, plus quatre nuanciers (peau, cheveux, vêtement,
cape). Tout est modifiable à tout moment depuis l'onglet *Héros*.

**Progression de garde-robe** — la plupart des pièces se **débloquent en
avançant**, chacune liée à un jalon différent pour varier les objectifs :

| Type | Débloqué par |
|---|---|
| Coiffures | niveau, nombre de pas |
| Tenues | niveau, obstacles franchis, paysages découverts |
| Capes | niveau, série, obstacles, paysages |
| Sacs | niveau, pas, obstacles |
| Compagnons | série, niveau, journées parfaites |
| Montures | niveau, paysages découverts |

L'écran *Héros* affiche en permanence **le prochain déblocage et sa
progression** — le joueur sait toujours ce qu'il gagnera en continuant.

**Animation** — cape en chaîne de 7 segments parcourue par une onde de vent
(chaque segment est en retard sur le précédent), jambes à deux articulations,
bras en contre-balancement, cheveux et écharpe à inertie, respiration au repos,
expression de joie à chaque habitude validée, saut au franchissement
d'obstacle. Compagnon qui trottine à côté, monture avec démarche à quatre
temps.

## 6. Les obstacles — de vraies scènes

Un obstacle n'est pas un objet : c'est un **événement mis en scène**. Le monde
s'arrête, la caméra se cale, l'obstacle occupe le tiers droit du cadre avec sa
propre lumière.

`pont brisé · rivière en crue · avalanche · ours · porte antique · dragon
endormi · tempête · forêt sombre · éboulement · mur de glace · gouffre ·
traversée en mer`

Chacun est dessiné en silhouette éclairée, avec au moins un élément animé
(l'eau coule, le dragon respire, la neige tourbillonne, les yeux de l'ours
brillent dans le noir).

**Progression de difficulté** : petit défi physique réel au début → exigence de
niveau/série → combinaison des deux pour les passages majeurs qui ouvrent un
nouveau biome.

---

## 7. Interface

### Composants

**Carte de verre** — `backdrop-filter: blur(24px) saturate(180%)`, fond
translucide, bordure 1 px lumineuse, rayon 22-28 px, ombre douce très diffuse
(`0 12px 32px -12px`). Jamais de bordure dure ni d'ombre marquée.

**Typographie** — pile système (SF Pro / Inter). Titres en poids 760 avec
interlettrage serré (`-0.02em`) ; libellés en 620 avec interlettrage large
(`0.08em`) et petites capitales. Chiffres toujours tabulaires.

**Espacement** — grille de 4 px, respiration généreuse : 20 px de marge
intérieure de carte, 28 px entre sections. L'espace vide fait partie du design.

**Rythme de l'écran d'accueil**
```
[ Fenêtre du monde — 46 % de la hauteur, plein cadre, coins arrondis ]
[ Bandeau de progression en verre, chevauchant le bas de la scène ]
[ Carte d'obstacle (si bloqué) ]
[ Liste d'habitudes — lignes de verre, coche animée ]
```

### Micro-interactions

| Élément | Comportement |
|---|---|
| Coche d'habitude | anneau qui se remplit + rebond `(.22,1.6,.36,1)` + retour haptique + le Voyageur célèbre |
| Barre d'XP | remplissage 700 ms avec léger dépassement et reflet qui balaie |
| Carte pressée | `scale(.985)` en 120 ms |
| Changement de biome | fondu enchaîné 1,4 s entre les deux palettes |
| Passage d'obstacle | le personnage saute, la caméra suit, confettis de lumière |
| Apparition de liste | décalage en cascade de 40 ms par ligne |

---

## 8. Rendu et performance

- **Canvas 2D** pour le monde (équivalent Skia) : dégradés, particules, rayons
  volumétriques, mélange additif — impossible à obtenir proprement en DOM.
- Silhouettes converties en `Path2D` **mises en cache** par (biome, couche,
  tuile) : on ne recalcule jamais une géométrie déjà connue.
- Budget : ≤ 220 particules actives, ≤ 8 couches, une seule passe de rendu.
- Boucle `requestAnimationFrame` avec delta-time borné, **mise en pause quand
  l'onglet est masqué** ou l'écran non visible.
- `devicePixelRatio` plafonné à 2.
- Respect de `prefers-reduced-motion` : le monde se fige sur une image fixe
  composée, toutes les informations restent lisibles.
- Cible : **60 FPS** sur mobile milieu de gamme.
