# Assets du héros — planches de sprites

Ce dossier contient les **cinq personnages** de la direction artistique
officielle (voir **[../../DESIGN.md](../../DESIGN.md) §7**). Dès qu'un
`manifest.json` valide est présent ici, le moteur bascule sur les sprites ;
sinon il retombe silencieusement sur le rendu vectoriel (`hero.js`).
L'application ne casse jamais.

## Ce qui est livré

| Personnage | Fichier | Poids |
|---|---|---|
| L'Explorateur | `body_explorateur.png` + `.json` | ~1,6 Mo |
| Voyageur des Brumes | `body_brumes.png` + `.json` | ~1,8 Mo |
| Gardienne de Lumière | `body_gardienne.png` + `.json` | ~2,1 Mo |
| Aventurière des Saisons | `body_saisons.png` + `.json` | ~1,8 Mo |
| Le Petit Rêveur | `body_reveur.png` + `.json` | ~1,8 Mo |

Chaque planche fait **512 × 4608 px** : une colonne, neuf lignes.

## Format des planches

Chaque **ligne est une animation**, chaque **colonne une image**. Les
poses actuelles sont des illustrations fixes (1 image par ligne) ; le
format accepte sans changement de code des lignes multi-images.

| Ligne | Animation | Boucle |
|---|---|---|
| 0 | `idle` | oui |
| 1 | `walk` | oui |
| 2 | `run` | oui |
| 3 | `jump` | non |
| 4 | `cheer` | non |
| 5 | `look` | non |
| 6 | `sit` | oui |
| 7 | `sleep` | oui |
| 8 | `interact` | non |

Le moteur retombe sur `idle` pour toute animation manquante, et fournit
lui-même l'élévation des poses en l'air (`jump`, `cheer`) : les
illustrations montrent la pose, le moteur donne la hauteur.

## Règles impératives

- Toutes les couches d'un même personnage partagent `frameW`, `frameH`,
  `anchorX`, `anchorY` et `heightRatio` — sinon elles ne se superposent pas.
- Le sujet touche le sol **au même point** sur toutes les lignes : aucun
  recadrage entre animations. C'est ce que garantit le montage des planches
  (alignement sur le centre des pieds, normalisation par pose).
- PNG 32 bits avec canal alpha, fond entièrement détouré.

## manifest.json

```json
{
  "version": 2,
  "sets": ["explorateur", "brumes", "gardienne", "saisons", "reveur"],
  "frameW": 512, "frameH": 512,
  "anchorX": 0.5, "anchorY": 0.94, "heightRatio": 0.86,
  "available": ["body_explorateur", "…"],
  "aliases": { "body_n": "body_explorateur", "…": "…" }
}
```

- `available` liste les atlas réellement présents. Le moteur n'essaie que
  ceux-là, et la garde-robe masque les emplacements sans illustration :
  aucune requête perdue, aucune option vide à l'écran.
- `aliases` assure la reprise des anciennes silhouettes (`n`, `f`, `m`)
  vers les personnages nommés.

## Ajouter des pièces

Pour les couches d'équipement (capes, coiffures, sacs, montures), suivre
la nomenclature attendue par `sprites.js` :

```
hair_<id>_back.png    hair_<id>_front.png
outfit_<id>.png       boots_<id>.png     scarf_<id>.png
cape_<id>_back.png    cape_<id>_front.png
pack_<id>.png         pet_<id>.png       mount_<id>.png
```

Déposer les fichiers, les ajouter à `available`, recharger : le moteur les
compose automatiquement dans l'ordre z défini par `SLOT_Z`.

## Sources

Les illustrations d'origine sont conservées dans **`../../raw/`**
(45 planches, 5 personnages × 9 poses). Le montage des atlas se refait à
partir de là — détourage par diffusion depuis les bords à tolérance
adaptative, normalisation de hauteur par pose, alignement sur le point de
contact au sol.
