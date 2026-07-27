/* Nomme les découpes validées, les convertit en WebP et écrit le manifeste.

   La correspondance est établie à l'œil sur `contact.png` après le passage
   de build-scenery.js — un script ne peut pas deviner qu'une forme conique
   est un conifère. Elle est donc explicite ici, et à revoir à chaque
   nouvelle planche.

   Usage : node tools/pack-scenery.js
*/
const { chromium } = require('playwright');
const fs = require('fs');
const DIR = __dirname + '/../assets/scenery/';

/* pièce → nom final, relevé sur la planche de contrôle */
const MAP = {
  '00': 'band_vallee_montagnes',
  '01': 'band_vallee_collines',
  '02': 'prop_tree_a',
  '03': 'prop_conifer',
  '04': 'prop_tree_b',
  '05': 'prop_tree_c',
  '06': 'prop_grass',
  '07': 'prop_bush',
  '08': 'prop_rock',
};

const QUALITY = .88;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');

  let avant = 0, apres = 0;
  const meta = {};

  for (const [num, nom] of Object.entries(MAP)) {
    const src = DIR + 'piece_' + num + '.png';
    if (!fs.existsSync(src)) { console.log('manque :', src); continue; }
    const png = fs.readFileSync(src);
    avant += png.length;

    const r = await p.evaluate(async ({ b64, q }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      return { webp: c.toDataURL('image/webp', q), w: img.width, h: img.height };
    }, { b64: png.toString('base64'), q: QUALITY });

    const buf = Buffer.from(r.webp.split(',')[1], 'base64');
    fs.writeFileSync(DIR + nom + '.webp', buf);
    apres += buf.length;
    meta[nom] = { w: r.w, h: r.h };
    console.log(nom.padEnd(26), (r.w + '×' + r.h).padEnd(11),
      (png.length / 1024 | 0) + ' Ko → ' + (buf.length / 1024 | 0) + ' Ko');
  }

  const manifest = {
    version: 1,
    /* essences partagées par tous les biomes verts */
    props: ['tree_a', 'tree_b', 'tree_c', 'conifer', 'bush', 'rock', 'grass'],
    /* bandes de décor, par biome puis par plan, du plus lointain au plus proche */
    bands: { vallee: ['montagnes', 'collines'] },
    /* Biomes autorisés à utiliser les objets illustrés. Appliquer des
       feuillus verts à une cerisaie en fleurs serait pire que le
       procédural : la liste ne grandit qu'avec les planches livrées. */
    propBiomes: ['vallee'],
    /* correspondance essence du moteur → illustration */
    kinds: { round: ['tree_a', 'tree_b', 'tree_c'], conifer: ['conifer'] },
    sizes: meta,
  };
  fs.writeFileSync(DIR + 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');

  console.log('\ntotal ' + (avant / 1024 | 0) + ' Ko → ' + (apres / 1024 | 0) + ' Ko en WebP');
  await b.close();
})();
