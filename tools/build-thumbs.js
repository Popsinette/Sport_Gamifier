/* Vignettes de choix de personnage, extraites de la ligne « idle » des atlas.
   Objectif : pouvoir montrer les cinq héros côte à côte sans charger 9 Mo
   de planches. Chaque vignette pèse quelques dizaines de kilo-octets. */
const { chromium } = require('playwright');
const fs = require('fs');
const DIR = __dirname + '/../assets/hero/';
const IDS = ['explorateur', 'brumes', 'gardienne', 'saisons', 'reveur'];

const TILE = 512;   /* taille d'une case dans l'atlas */
const OUTW = 240, OUTH = 300, MARGIN = .04;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');

  for (const id of IDS) {
    const b64 = fs.readFileSync(DIR + 'body_' + id + '.png').toString('base64');
    const png = await p.evaluate(async ({ b64, TILE, OUTW, OUTH, MARGIN }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();

      /* ligne 0 = idle */
      const src = document.createElement('canvas');
      src.width = TILE; src.height = TILE;
      const sx = src.getContext('2d');
      sx.drawImage(img, 0, 0, TILE, TILE, 0, 0, TILE, TILE);

      /* recadrage serré sur les pixels opaques */
      const D = sx.getImageData(0, 0, TILE, TILE).data;
      let x0 = TILE, y0 = TILE, x1 = 0, y1 = 0;
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++)
        if (D[(y * TILE + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      const sw = x1 - x0, sh = y1 - y0;

      const out = document.createElement('canvas');
      out.width = OUTW; out.height = OUTH;
      const ox = out.getContext('2d');
      ox.imageSmoothingQuality = 'high';
      /* on cadre en hauteur, pieds posés en bas, sujet centré */
      const s = (OUTH * (1 - MARGIN * 2)) / sh;
      ox.drawImage(src, x0, y0, sw, sh,
        (OUTW - sw * s) / 2, OUTH * (1 - MARGIN) - sh * s, sw * s, sh * s);
      return out.toDataURL('image/png');
    }, { b64, TILE, OUTW, OUTH, MARGIN });

    const buf = Buffer.from(png.split(',')[1], 'base64');
    fs.writeFileSync(DIR + 'thumb_' + id + '.png', buf);
    console.log('thumb_' + id.padEnd(13), (buf.length / 1024 | 0) + ' Ko');
  }
  await b.close();
})();
