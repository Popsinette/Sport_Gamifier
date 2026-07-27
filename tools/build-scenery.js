/* Découpe une planche de décor livrée en un seul fichier.

   Le générateur d'images rend volontiers tous les éléments sur une même
   planche. Plutôt que d'exiger neuf fichiers séparés, on segmente
   automatiquement : détourage du fond, recherche des groupes de pixels
   opaques connexes, recadrage serré sur chacun.

   Aucune hypothèse sur la disposition : ni grille, ni ordre, ni nombre.

   Usage : node tools/build-scenery.js raw-paysages/planche.png
   Sortie : assets/scenery/piece_XX.png + contact.png (planche de contrôle)
*/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const OUT = __dirname + '/../assets/scenery/';

if (!SRC || !fs.existsSync(SRC)) {
  console.error('Fichier introuvable. Usage : node tools/build-scenery.js <planche.png>');
  process.exit(1);
}

/* Un élément plus large que cette fraction de la planche est une bande de
   décor (montagnes, collines) et non un objet isolé. */
const BAND_W = .45;
/* Sous cette surface, c'est une poussière de détourage. */
const MIN_AREA = 900;
const MARGIN = 6;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');

  const b64 = fs.readFileSync(SRC).toString('base64');
  const res = await p.evaluate(async ({ b64, BAND_W, MIN_AREA, MARGIN }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const W = img.width, H = img.height;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const ID = x.getImageData(0, 0, W, H), D = ID.data;

    /* --- 1. le fond est-il déjà transparent ? --- */
    let clear = 0;
    for (let i = 3; i < D.length; i += 4 * 17) if (D[i] < 16) clear++;
    const alreadyCut = clear / (D.length / (4 * 17)) > .12;

    let notes = '';
    if (!alreadyCut) {
      /* --- 2. sinon, détourage par diffusion depuis les bords, avec la
         même tolérance adaptative que pour les personnages --- */
      const samples = [];
      for (let a = 0; a < W; a += 7) { samples.push(a * 4); samples.push(((H - 1) * W + a) * 4); }
      for (let yy = 0; yy < H; yy += 7) { samples.push(yy * W * 4); samples.push((yy * W + W - 1) * 4); }
      let mr = 0, mg = 0, mb = 0;
      samples.forEach(i => { mr += D[i]; mg += D[i + 1]; mb += D[i + 2]; });
      mr /= samples.length; mg /= samples.length; mb /= samples.length;
      let spread = 0;
      samples.forEach(i => { spread += Math.abs(D[i] - mr) + Math.abs(D[i + 1] - mg) + Math.abs(D[i + 2] - mb); });
      spread /= samples.length;
      const T = Math.max(10, Math.min(28, spread * 2.6 + 8));
      const dist = i => Math.abs(D[i] - mr) + Math.abs(D[i + 1] - mg) + Math.abs(D[i + 2] - mb);

      const gone = new Uint8Array(W * H);
      const st = [];
      for (let a = 0; a < W; a++) st.push(a, (H - 1) * W + a);
      for (let yy = 0; yy < H; yy++) st.push(yy * W, yy * W + W - 1);
      while (st.length) {
        const q = st.pop();
        if (gone[q] || dist(q * 4) >= T) continue;
        gone[q] = 1; D[q * 4 + 3] = 0;
        const qx = q % W, qy = (q / W) | 0;
        if (qx > 0) st.push(q - 1);
        if (qx < W - 1) st.push(q + 1);
        if (qy > 0) st.push(q - W);
        if (qy < H - 1) st.push(q + W);
      }
      x.putImageData(ID, 0, 0);
      notes = 'fond retiré, tolérance ' + Math.round(T) + ' (dispersion ' + Math.round(spread) + ')';
    } else {
      notes = 'fond déjà transparent, conservé tel quel';
    }

    /* --- 3. groupes de pixels opaques connexes --- */
    const seen = new Uint8Array(W * H);
    const opaque = q => D[q * 4 + 3] > 28;
    const boxes = [];
    const stack = new Int32Array(W * H);
    for (let q0 = 0; q0 < W * H; q0++) {
      if (seen[q0] || !opaque(q0)) continue;
      let sp = 0; stack[sp++] = q0; seen[q0] = 1;
      let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
      while (sp) {
        const q = stack[--sp];
        const qx = q % W, qy = (q / W) | 0;
        area++;
        if (qx < x0) x0 = qx; if (qx > x1) x1 = qx;
        if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
        /* 8-connexité : un feuillage peint laisse des pixels presque
           isolés que la 4-connexité découperait en miettes */
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = qx + dx, ny = qy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (seen[n] || !opaque(n)) continue;
          seen[n] = 1; stack[sp++] = n;
        }
      }
      if (area >= MIN_AREA) boxes.push({ x0, y0, x1, y1, area });
    }

    /* --- 4. fusion des groupes qui se chevauchent : un tronc peint en
       deux masses distinctes ne doit pas donner deux fichiers --- */
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < boxes.length && !merged; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b2 = boxes[j];
          const gapX = Math.max(a.x0, b2.x0) - Math.min(a.x1, b2.x1);
          const gapY = Math.max(a.y0, b2.y0) - Math.min(a.y1, b2.y1);
          if (gapX < 12 && gapY < 12) {
            a.x0 = Math.min(a.x0, b2.x0); a.y0 = Math.min(a.y0, b2.y0);
            a.x1 = Math.max(a.x1, b2.x1); a.y1 = Math.max(a.y1, b2.y1);
            a.area += b2.area;
            boxes.splice(j, 1); merged = true; break;
          }
        }
    }

    /* --- 5. ordre de lecture, puis découpe --- */
    boxes.sort((a, b2) => (a.y0 - b2.y0) || (a.x0 - b2.x0));
    const out = [];
    for (const bx of boxes) {
      const w = bx.x1 - bx.x0 + 1, h = bx.y1 - bx.y0 + 1;
      const cc = document.createElement('canvas');
      cc.width = w + MARGIN * 2; cc.height = h + MARGIN * 2;
      cc.getContext('2d').drawImage(c, bx.x0, bx.y0, w, h, MARGIN, MARGIN, w, h);
      out.push({
        png: cc.toDataURL('image/png'),
        w, h,
        kind: w / W >= BAND_W ? 'bande' : 'objet',
        ratio: +(w / h).toFixed(2),
      });
    }

    /* --- 6. planche de contrôle sur damier --- */
    const CT = 150, cols = Math.min(6, Math.max(1, out.length));
    const rows = Math.ceil(out.length / cols);
    const cs = document.createElement('canvas');
    cs.width = cols * CT; cs.height = rows * CT;
    const sx = cs.getContext('2d');
    for (let a = 0; a < cs.width; a += 12) for (let bb = 0; bb < cs.height; bb += 12) {
      sx.fillStyle = ((a / 12 + bb / 12) | 0) % 2 ? '#d8d8d8' : '#f4f4f4';
      sx.fillRect(a, bb, 12, 12);
    }
    for (let i = 0; i < out.length; i++) {
      const im = new Image(); im.src = out[i].png; await im.decode();
      const s = Math.min((CT - 14) / im.width, (CT - 22) / im.height);
      sx.drawImage(im, (i % cols) * CT + (CT - im.width * s) / 2,
        ((i / cols) | 0) * CT + (CT - 14 - im.height * s),
        im.width * s, im.height * s);
      sx.fillStyle = '#111'; sx.font = 'bold 11px sans-serif'; sx.textAlign = 'center';
      sx.fillText(String(i).padStart(2, '0'), (i % cols) * CT + CT / 2, ((i / cols) | 0) * CT + CT - 3);
    }
    return { pieces: out, contact: cs.toDataURL('image/png'), notes, W, H };
  }, { b64, BAND_W, MIN_AREA, MARGIN });

  console.log('planche', path.basename(SRC), '·', res.W + '×' + res.H, '·', res.notes);
  console.log('');
  res.pieces.forEach((p2, i) => {
    const buf = Buffer.from(p2.png.split(',')[1], 'base64');
    fs.writeFileSync(OUT + 'piece_' + String(i).padStart(2, '0') + '.png', buf);
    console.log(String(i).padStart(2, '0'), p2.kind.padEnd(6),
      (p2.w + '×' + p2.h).padEnd(11), 'ratio ' + p2.ratio,
      '·', (buf.length / 1024 | 0) + ' Ko');
  });
  fs.writeFileSync(OUT + 'contact.png',
    Buffer.from(res.contact.split(',')[1], 'base64'));
  console.log('\n' + res.pieces.length + ' éléments · planche de contrôle : assets/scenery/contact.png');

  await b.close();
})();
