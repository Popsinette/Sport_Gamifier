# Outils

## `build-atlas.js` — montage des planches de héros

Reconstruit les cinq atlas de `assets/hero/` à partir des illustrations
brutes de `raw/`.

```bash
npm install playwright        # ou : npx playwright
node tools/build-atlas.js
```

Ce que fait le script, pour chaque pose :

1. **Détourage** par diffusion depuis les bords de l'image. La tolérance
   n'est pas fixe : elle est calée sur la dispersion réelle des pixels du
   pourtour (`spread * 2,6 + 8`, borné à 10–26). Sans cela, un personnage
   clair sur fond clair — la Gardienne de Lumière — se ferait manger par
   un seuil trop large.
2. **Frange** : l'anticrénelage n'est adouci qu'à 3 px d'un pixel retiré,
   pour ne jamais entamer l'intérieur du sujet.
3. **Normalisation de hauteur** par pose (`FACTOR`) : une silhouette
   couchée ne doit pas être mise à l'échelle comme une silhouette debout.
4. **Alignement** sur le centre des pieds, de sorte que le point de contact
   au sol soit identique sur les neuf lignes — c'est ce qui évite le saut
   de position entre animations.

Le script écrit `body_<id>.png` et `body_<id>.json`. Après ajout d'un
personnage, penser à l'inscrire dans `assets/hero/manifest.json`
(`sets` **et** `available`) et dans `CATALOG.body` de `hero.js`.
