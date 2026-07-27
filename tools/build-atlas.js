/* Construit les cinq atlas de héros à partir des planches brutes. */
const { chromium } = require('playwright');
const fs = require('fs');
const RAW = __dirname + '/../raw/';
const OUT = __dirname + '/../assets/hero/';

/* ordre des lignes de l'atlas */
const ROWS = ['idle', 'walk', 'run', 'jump', 'cheer', 'look', 'sit', 'sleep', 'interact'];

/* hauteur relative de chaque pose : une silhouette couchée ne doit pas être
   mise à l'échelle comme une silhouette debout */
const FACTOR = { idle: 1.0, walk: .99, run: .94, jump: .88, cheer: 1.05,
                 look: 1.0, sit: .68, sleep: .42, interact: .92 };

const CHARS = {
  explorateur: { idle:'perso1.png', walk:'perso1_walk.png', run:'perso1_walk.png',
                 jump:'perso1_jump.png', cheer:'perso1_happy.png', look:'perso1_look.png',
                 sit:'perso1_seat.png', sleep:'perso1_sleep.png', interact:'perso1_obst.png' },
  brumes:      { idle:'perso2.png', walk:'perso2_walk.png', run:'perso2_run.png',
                 jump:'perso2_saut.png', cheer:'perso2_happy.png', look:'perso2_look.png',
                 sit:'perso2_seat.png', sleep:'perso2_sleep.png', interact:'perso2_obst.png' },
  gardienne:   { idle:'perso3.png', walk:'perso3_walk.png', run:'perso3_run.png',
                 jump:'perso3_up.png', cheer:'perso3_jump.png', look:'perso3_look.png',
                 sit:'perso3_seat.png', sleep:'perso3_sleep.png', interact:'perso3_obst.png' },
  saisons:     { idle:'perso4.png', walk:'perso4_walk.png', run:'perso4_run.png',
                 jump:'perso4_jump.png', cheer:'perso4_happy.png', look:'perso4_look.png',
                 sit:'perso4_seat.png', sleep:'perso4_sleep.png', interact:'perso4_obst.png' },
  reveur:      { idle:'perso5.png', walk:'perso5_walk.png', run:'perso5_run.png',
                 jump:'perso5_jump.png', cheer:'perso5_happy.png', look:'perso5_look.png',
                 sit:'perso5_seat.png', sleep:'perso5_sleep.png', interact:'perso5_obst.png' },
};

const TILE = 512, HR = .86, AY = .94;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setContent('<html><body></body></html>');

  for (const [id, poses] of Object.entries(CHARS)) {
    const payload = ROWS.map(r => ({
      row: r,
      factor: FACTOR[r],
      b64: fs.readFileSync(RAW + poses[r]).toString('base64'),
      file: poses[r],
    }));

    const res = await p.evaluate(async ({ list, TILE, HR, AY }) => {
      /* Détourage adaptatif : la tolérance est calée sur la dispersion réelle
         du fond, sinon un personnage clair sur fond clair se fait manger. */
      async function cut(b64) {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const W = img.width, H = img.height;
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const ID = x.getImageData(0, 0, W, H), D = ID.data;

        /* couleur et dispersion du fond, mesurées sur le pourtour */
        const samples = [];
        for (let a = 0; a < W; a += 7) { samples.push((a) * 4); samples.push(((H - 1) * W + a) * 4); }
        for (let yy = 0; yy < H; yy += 7) { samples.push((yy * W) * 4); samples.push((yy * W + W - 1) * 4); }
        let mr = 0, mg = 0, mb = 0;
        samples.forEach(i => { mr += D[i]; mg += D[i+1]; mb += D[i+2]; });
        mr /= samples.length; mg /= samples.length; mb /= samples.length;
        let spread = 0;
        samples.forEach(i => {
          spread += Math.abs(D[i]-mr) + Math.abs(D[i+1]-mg) + Math.abs(D[i+2]-mb);
        });
        spread /= samples.length;
        const T_HARD = Math.max(10, Math.min(26, spread * 2.6 + 8));
        const T_SOFT = T_HARD + 26;
        const dist = i => Math.abs(D[i]-mr) + Math.abs(D[i+1]-mg) + Math.abs(D[i+2]-mb);

        /* 1) diffusion depuis les bords, tolérance serrée */
        const gone = new Uint8Array(W * H);
        const st = [];
        for (let a = 0; a < W; a++) st.push(a, (H - 1) * W + a);
        for (let yy = 0; yy < H; yy++) st.push(yy * W, yy * W + W - 1);
        while (st.length) {
          const q = st.pop();
          if (gone[q]) continue;
          if (dist(q * 4) >= T_HARD) continue;
          gone[q] = 1;
          D[q * 4 + 3] = 0;
          const qx = q % W, qy = (q / W) | 0;
          if (qx > 0) st.push(q - 1);
          if (qx < W - 1) st.push(q + 1);
          if (qy > 0) st.push(q - W);
          if (qy < H - 1) st.push(q + W);
        }
        /* 2) frange : uniquement à 3 px d'un pixel retiré, pour nettoyer
           l'anticrénelage sans entamer l'intérieur du personnage */
        const R = 3;
        for (let yy = 0; yy < H; yy++) for (let a = 0; a < W; a++) {
          const q = yy * W + a;
          if (gone[q]) continue;
          const d = dist(q * 4);
          if (d >= T_SOFT) continue;
          let near = false;
          for (let dy = -R; dy <= R && !near; dy++) {
            const ny = yy + dy; if (ny < 0 || ny >= H) continue;
            for (let dx = -R; dx <= R; dx++) {
              const nx = a + dx; if (nx < 0 || nx >= W) continue;
              if (gone[ny * W + nx]) { near = true; break; }
            }
          }
          if (near) {
            const k = Math.max(0, Math.min(1, (d - T_HARD) / (T_SOFT - T_HARD)));
            D[q * 4 + 3] = Math.round(D[q * 4 + 3] * k);
          }
        }
        x.putImageData(ID, 0, 0);

        let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (let yy = 0; yy < H; yy++) for (let a = 0; a < W; a++)
          if (D[(yy * W + a) * 4 + 3] > 30) {
            if (a < x0) x0 = a; if (a > x1) x1 = a;
            if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
          }
        let s = 0, n = 0;
        for (let yy = Math.max(y0, y1 - Math.round((y1 - y0) * .07)); yy <= y1; yy++)
          for (let a = 0; a < W; a++)
            if (D[(yy * W + a) * 4 + 3] > 110) { s += a; n++; }
        return { canvas: c, box: [x0, y0, x1, y1], footCx: n ? s / n : (x0 + x1) / 2,
                 T_HARD: Math.round(T_HARD), spread: Math.round(spread) };
      }

      const out = document.createElement('canvas');
      out.width = TILE; out.height = TILE * list.length;
      const ox = out.getContext('2d');
      ox.imageSmoothingQuality = 'high';
      const infos = [];
      for (let i = 0; i < list.length; i++) {
        const r = await cut(list[i].b64);
        const [, by0, , by1] = r.box;
        const subjH = by1 - by0;
        const scale = (TILE * HR * list[i].factor) / subjH;
        const dx = TILE * .5 - r.footCx * scale;
        const dy = TILE * i + TILE * AY - by1 * scale;
        ox.drawImage(r.canvas, dx, dy, r.canvas.width * scale, r.canvas.height * scale);
        infos.push({ row: list[i].row, T: r.T_HARD, spread: r.spread, h: subjH });
      }
      return { png: out.toDataURL('image/png'), infos };
    }, { list: payload, TILE, HR, AY });

    const buf = Buffer.from(res.png.split(',')[1], 'base64');
    fs.writeFileSync(OUT + 'body_' + id + '.png', buf);
    console.log(id.padEnd(12), (buf.length / 1024 | 0) + ' Ko',
      '| tolérances ' + res.infos.map(i => i.T).join(','));

    const anims = {};
    ROWS.forEach((r, i) => {
      anims[r] = { row: i, frames: 1, fps: 1, loop: (r === 'idle' || r === 'walk' || r === 'run' || r === 'sit' || r === 'sleep') };
    });
    fs.writeFileSync(OUT + 'body_' + id + '.json', JSON.stringify({
      image: 'body_' + id + '.png',
      frameW: TILE, frameH: TILE,
      anchorX: .5, anchorY: AY, heightRatio: HR,
      z: 30, _rows: ROWS, animations: anims,
    }, null, 2) + '\n');
  }
  await b.close();
})();
