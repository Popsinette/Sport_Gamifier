# Assets du héros — dépôt des sprites

Ce dossier est **vide par conception**. Tant qu'il ne contient pas de
`manifest.json`, l'application affiche le héros en rendu vectoriel
(`hero.js`). Dès qu'un manifeste valide apparaît ici, le moteur bascule
automatiquement sur les sprites, sans aucune modification de code.

La spécification complète est dans **[../../DESIGN.md](../../DESIGN.md) §7**.

---

## Ce qu'il faut produire

Pour chaque pièce (tenue, cape, coiffure, sac…), une **planche PNG** où
chaque **ligne est une animation** et chaque **colonne une image**.

Animations attendues, dans cet ordre de ligne :

| Ligne | Animation | Images | FPS | Boucle |
|---|---|---|---|---|
| 0 | `idle` | 8 | 12 | oui |
| 1 | `walk` | 12 | 12 | oui |
| 2 | `run` | 10 | 16 | oui |
| 3 | `jump` | 9 | 12 | non |
| 4 | `cheer` | 12 | 12 | non |
| 5 | `look` | 10 | 10 | non |
| 6 | `sit` | 6 | 8 | oui |
| 7 | `sleep` | 6 | 5 | oui |
| 8 | `interact` | 10 | 12 | non |

Une planche complète fait donc **12 colonnes × 9 lignes**, soit
`3072 × 2304 px` en 256 px par image.

> Une pièce peut ne fournir que `idle` et `walk` : le moteur retombe sur
> `idle` pour toute animation manquante.

## Règles impératives

- **Toutes les couches d'un même personnage doivent partager** `frameW`,
  `frameH`, `anchorX`, `anchorY` et `heightRatio`. Sinon elles ne se
  superposent pas.
- Le sujet doit occuper **exactement la même position** dans la case sur
  toutes les lignes : aucun recadrage entre animations.
- 8 px de marge transparente autour du sujet.
- PNG 32 bits avec canal alpha.
- Fournir `@1x` et `@2x` (`outfit_tunic.png` et `outfit_tunic@2x.png`).

## Fichiers attendus

```
manifest.json
body_f.png        body_f.json          (silhouette fine)
body_n.png        body_n.json          (neutre)
body_m.png        body_m.json          (robuste)
head_f|n|m.png    …
hair_<id>_back.png    hair_<id>_front.png
outfit_<id>.png
cape_<id>_back.png    cape_<id>_front.png
pack_<id>.png
boots_<id>.png    scarf_<id>.png
pet_<id>.png      mount_<id>.png
```

Les `<id>` doivent correspondre au catalogue de `hero.js`
(`hair`: short, wavy, long, pony, bun, curly, braids · `outfit`: tunic, coat,
robe, winter, desert · `cape`: simple, long, feather, star, aurora ·
`pack`: satchel, pack, bedroll, lantern · `pet`: cat, fox, bird, spirit ·
`mount`: horse, stag, dragon).

## manifest.json

```json
{
  "version": 1,
  "sets": ["explorateur", "brumes", "gardienne", "saisons", "reveur"],
  "frameW": 256,
  "frameH": 256,
  "anchorX": 0.5,
  "anchorY": 0.94,
  "heightRatio": 0.86
}
```

Le moteur ne charge que les couches correspondant au look courant : ajouter
des pièces n'alourdit pas le démarrage.

## Vérifier une livraison

1. Déposer les fichiers ici.
2. Recharger l'application.
3. Le héros doit s'afficher en sprites — sans saut de position ni
   clignotement entre animations.

En cas de fichier manquant ou de JSON invalide, le moteur revient
silencieusement au rendu vectoriel : l'application ne casse jamais.
