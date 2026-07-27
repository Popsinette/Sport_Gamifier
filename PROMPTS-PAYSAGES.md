# Prompts — paysages illustrés

Même principe que pour les personnages : tu génères, tu déposes les fichiers,
je les intègre. Ce document contient les prompts prêts à copier.

---

## Ce qu'on illustre, et ce qu'on garde en code

Tout ne doit **pas** devenir une image, pour une raison précise : le ciel
change avec l'heure réelle. Aube, plein jour, crépuscule, nuit étoilée — c'est
calculé en direct et ça traverse toutes les couches. Une image de ciel figerait
l'heure une fois pour toutes et tuerait la fonctionnalité.

| Élément | Illustré | Pourquoi |
|---|---|---|
| Ciel, soleil, rayons | ❌ code | doit suivre l'heure réelle |
| Montagnes, collines, falaises | ✅ **plaque large** | silhouettes lointaines, faciles à illustrer |
| Arbres, rochers, buissons, herbes | ✅ **objets isolés** | le moteur les sème lui-même |
| Sol, sentier | ❌ code | doit se raccorder au héros et aux obstacles |
| Personnages | ✅ déjà fait | — |

**Les objets isolés sont la partie qui rapporte le plus.** Un seul PNG d'arbre
feuillu remplace le dessin vectoriel dans **tous** les biomes verts d'un coup.
Et comme le moteur continue de les semer avec ses tirages aléatoires, on garde
la parallaxe, la variété infinie et le fondu atmosphérique.

## Deux règles qui conditionnent tout

1. **Fond transparent, vraiment.** Pas de ciel peint, pas de dégradé, pas de
   carré blanc. Sinon les couches ne se superposent pas.
2. **Éclairage neutre et diffus.** Pas d'ombre marquée d'un côté, pas d'heure
   dorée peinte dans l'image. C'est le moteur qui applique la lumière du
   moment — comme il le fait déjà sur les personnages. Une image avec un
   coucher de soleil peint dedans sera fausse à midi et fausse la nuit.

## Ce qu'il ne faut pas faire

- Pas de personnage, pas de silhouette humaine, pas de texte, pas de cadre.
- Pas de vue en plongée ni en contre-plongée : **strictement de profil**, à
  hauteur d'œil, comme un décor de jeu à défilement latéral.
- Pas de contour noir, pas de style vectoriel plat. On reste sur la peinture
  numérique douce des personnages.

---

# Étape 1 — la Vallée de l'Aube

C'est le premier paysage que tout le monde voit. On le fait en entier, on
vérifie que le rendu tient, **puis** on déroule les dix-sept autres. Sept
images. Ne lance pas les autres biomes avant qu'on ait validé celui-ci.

## 1 · Montagnes lointaines

```
Illustration de décor pour jeu vidéo 2D à défilement latéral, vue strictement
de profil à hauteur d'œil. Bande horizontale très large.

Sujet : une chaîne de montagnes lointaines aux sommets arrondis et doux,
plusieurs plans qui se chevauchent, brume d'altitude entre eux.

Style : peinture numérique douce, Studio Ghibli et Alto's Odyssey, aplats
nuancés avec de légères variations de matière, aucun contour noir, aucun
style vectoriel plat.

Palette : bleu-violet désaturé et très pâle, comme vu à travers dix
kilomètres d'air.

Cadrage : le relief occupe la moitié inférieure de l'image. Le bord gauche
et le bord droit se terminent à peu près à la même hauteur, sur une pente
douce.

IMPÉRATIF : fond entièrement transparent. Aucun ciel, aucun dégradé, aucun
nuage, aucun soleil, aucune étoile. Éclairage neutre et diffus, sans ombre
portée marquée ni heure dorée. Aucun personnage, aucun animal, aucun texte.

Format : 2048 × 640 pixels, PNG 32 bits avec canal alpha.
```

## 2 · Collines proches

```
Illustration de décor pour jeu vidéo 2D à défilement latéral, vue strictement
de profil à hauteur d'œil. Bande horizontale très large.

Sujet : des collines herbeuses basses et rondes, deux ou trois ondulations
qui se recouvrent, texture d'herbe suggérée sans détail net.

Style : peinture numérique douce, Studio Ghibli et Alto's Odyssey, aplats
nuancés, aucun contour noir, aucun style vectoriel plat.

Palette : vert tendre légèrement grisé, plus saturé que des montagnes
lointaines mais encore doux.

Cadrage : les collines occupent le tiers inférieur de l'image. Le bord gauche
et le bord droit se terminent à peu près à la même hauteur.

IMPÉRATIF : fond entièrement transparent. Aucun ciel, aucun arbre, aucun
rocher, aucun bâtiment. Éclairage neutre et diffus, sans ombre portée marquée.
Aucun personnage, aucun texte.

Format : 2048 × 640 pixels, PNG 32 bits avec canal alpha.
```

## 3 · Arbre feuillu — trois variantes

À lancer **trois fois** pour obtenir trois arbres différents (`arbre_1`,
`arbre_2`, `arbre_3`). Le moteur les alterne, ce qui évite l'effet « rangée
de clones ».

```
Illustration d'un arbre isolé pour jeu vidéo 2D à défilement latéral, vue
strictement de profil à hauteur d'œil, sans perspective.

Sujet : un arbre feuillu adulte, tronc visible, houppier ample et arrondi,
silhouette naturelle et légèrement asymétrique.

Style : peinture numérique douce, Studio Ghibli, feuillage traité en masses
souples avec quelques variations de valeur, aucun contour noir, aucune
feuille dessinée individuellement, aucun style vectoriel plat.

Palette : vert forêt profond, avec des verts plus clairs sur le dessus du
houppier.

Cadrage : l'arbre est centré horizontalement et occupe toute la hauteur.
La base du tronc touche exactement le bord inférieur de l'image.

IMPÉRATIF : fond entièrement transparent. Aucun sol, aucune herbe, aucune
ombre portée au sol, aucun autre arbre en arrière-plan. Éclairage neutre et
diffus, sans lumière directionnelle marquée. Aucun personnage, aucun texte.

Format : 1024 × 1024 pixels, PNG 32 bits avec canal alpha.
```

## 4 · Conifère

```
Illustration d'un conifère isolé pour jeu vidéo 2D à défilement latéral, vue
strictement de profil à hauteur d'œil, sans perspective.

Sujet : un sapin adulte élancé, silhouette conique irrégulière, étages de
branches légèrement retombants, court tronc nu à la base.

Style : peinture numérique douce, Studio Ghibli, aiguilles traitées en
masses souples, aucun contour noir, aucun style vectoriel plat.

Palette : vert sombre bleuté.

Cadrage : l'arbre est centré horizontalement et occupe toute la hauteur.
La base du tronc touche exactement le bord inférieur de l'image.

IMPÉRATIF : fond entièrement transparent. Aucun sol, aucune neige, aucune
ombre portée, aucun autre arbre. Éclairage neutre et diffus. Aucun
personnage, aucun texte.

Format : 1024 × 1024 pixels, PNG 32 bits avec canal alpha.
```

## 5 · Buisson

```
Illustration d'un buisson isolé pour jeu vidéo 2D à défilement latéral, vue
strictement de profil à hauteur d'œil, sans perspective.

Sujet : un buisson bas et dense, silhouette arrondie irrégulière, quelques
brins qui dépassent.

Style : peinture numérique douce, Studio Ghibli, masses souples, aucun
contour noir, aucun style vectoriel plat.

Palette : vert moyen légèrement grisé.

Cadrage : centré horizontalement, la base touche exactement le bord
inférieur de l'image. Le buisson occupe environ la moitié inférieure du
cadre.

IMPÉRATIF : fond entièrement transparent. Aucun sol, aucune ombre portée,
aucune fleur, aucun autre élément. Éclairage neutre et diffus. Aucun
personnage, aucun texte.

Format : 1024 × 1024 pixels, PNG 32 bits avec canal alpha.
```

## 6 · Rocher

```
Illustration d'un rocher isolé pour jeu vidéo 2D à défilement latéral, vue
strictement de profil à hauteur d'œil, sans perspective.

Sujet : un bloc de pierre naturel, arêtes émoussées, quelques fissures et
un peu de mousse à la base.

Style : peinture numérique douce, Studio Ghibli, matière minérale suggérée
par des variations de valeur, aucun contour noir, aucun style vectoriel plat.

Palette : gris chaud légèrement beige.

Cadrage : centré horizontalement, la base touche exactement le bord
inférieur de l'image. Le rocher occupe environ le tiers inférieur du cadre.

IMPÉRATIF : fond entièrement transparent. Aucun sol, aucune ombre portée,
aucune herbe autour. Éclairage neutre et diffus. Aucun personnage, aucun
texte.

Format : 1024 × 1024 pixels, PNG 32 bits avec canal alpha.
```

## 7 · Touffe d'herbes hautes

Celle-ci passe **devant** le héros, au tout premier plan. C'est elle qui
l'ancre dans la scène.

```
Illustration d'une touffe d'herbes hautes isolée pour jeu vidéo 2D à
défilement latéral, vue strictement de profil à hauteur d'œil, sans
perspective.

Sujet : une touffe de graminées hautes et fines, une quinzaine de brins
courbés dans des directions légèrement différentes, quelques épis.

Style : peinture numérique douce, Studio Ghibli, brins souples et nets,
aucun contour noir, aucun style vectoriel plat.

Palette : vert profond tirant vers le sombre — cet élément est au premier
plan, il doit être plus foncé que le reste du décor.

Cadrage : centré horizontalement, la base des brins touche exactement le
bord inférieur de l'image.

IMPÉRATIF : fond entièrement transparent. Aucun sol, aucune terre, aucune
ombre portée, aucune fleur. Éclairage neutre et diffus. Aucun personnage,
aucun texte.

Format : 1024 × 1024 pixels, PNG 32 bits avec canal alpha.
```

---

## Comment me les envoyer

Nomme les fichiers ainsi et pousse-les sur git, comme pour les personnages :

```
raw-paysages/
  vallee_montagnes.png
  vallee_collines.png
  arbre_feuillu_1.png
  arbre_feuillu_2.png
  arbre_feuillu_3.png
  conifere.png
  buisson.png
  rocher.png
  herbes_hautes.png
```

Je m'occupe du reste : détourage de sécurité, recadrage au pixel près,
raccord des plaques en miroir pour un défilement sans couture, semis par le
moteur, et application de la lumière du moment.

## Si le résultat dérive

| Ce que tu vois | À ajouter au prompt |
|---|---|
| Un fond blanc ou un ciel peint | « fond 100 % transparent, alpha, aucun arrière-plan, PNG détouré » |
| Une vue en plongée | « vue de côté strictement orthographique, ligne d'horizon à hauteur du sujet » |
| Des contours noirs, un style plat | « peinture numérique, aucun trait de contour, aucun style vectoriel ni cel-shading » |
| Une ombre portée au sol | « aucune ombre portée, aucun sol, le sujet flotte sur le vide » |
| Une lumière dorée marquée | « éclairage d'atelier neutre, diffus, sans direction dominante » |
| Un objet coupé en bas | « la base du sujet touche exactement le bord inférieur, rien n'est coupé » |
| Plusieurs arbres au lieu d'un | « un seul sujet, isolé, rien d'autre dans l'image » |

## Poids des fichiers

C'est la vraie contrainte. Dix-huit biomes × deux plaques + les objets, en
PNG, dépasseraient largement ce qu'une application installée sur téléphone
peut se permettre. Je convertirai les plaques en WebP et ne chargerai que le
biome courant. Ça tient, mais c'est pour cette raison qu'on valide sur un
seul paysage avant de lancer la production des dix-sept autres.
