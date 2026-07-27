/* =========================================================
   Odyssée — le campement

   Dessine le camp du joueur : un fond de paysage, puis les
   pièces construites, chacune à son niveau. Rien n'est
   affiché tant que rien n'est bâti — le vide du départ fait
   partie de la progression.

   On réutilise le décor illustré quand il est disponible et
   le grade lumineux du moment : le camp appartient au même
   monde que le voyage, pas à un écran de menu.

   Expose : window.Camp = { draw }
   ========================================================= */
(function (global) {
"use strict";

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a) => "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + (a == null ? 1 : a) + ")";
const gr = (c, g) => [c[0] * g.amb[0], c[1] * g.amb[1], c[2] * g.amb[2]];

/* ---------------------------------------------------------
   Les pièces. Chacune se dessine à sa place, à son niveau.
   L'ordre du tableau est l'ordre de profondeur.
   --------------------------------------------------------- */
const WOOD = "#8a5a34", WOOD_D = "#5e3c22", STONE = "#8d8b86", CLOTH = "#d8c9ad";

function shelter(x, gy, s, lv, g, t) {
  const w = hex(WOOD), wd = hex(WOOD_D), cl = hex(CLOTH);
  if (lv === 1) {
    /* bâche tendue entre deux piquets, à hauteur d'épaule */
    const a = -s * .62, b = -s * .04;
    x.fillStyle = css(gr(wd, g));
    x.fillRect(a, gy - s * .52, s * .035, s * .52);
    x.fillRect(b, gy - s * .42, s * .035, s * .42);
    x.fillStyle = css(gr(cl, g));
    x.beginPath();
    x.moveTo(a - s * .03, gy - s * .52); x.lineTo(b + s * .06, gy - s * .42);
    x.lineTo(b + s * .05, gy - s * .30); x.lineTo(a - s * .02, gy - s * .38);
    x.closePath(); x.fill();
  } else if (lv === 2) {
    x.fillStyle = css(gr(cl, g));
    x.beginPath();
    x.moveTo(-s * .42, gy); x.lineTo(-s * .42 + s * .40, gy - s * .78);
    x.lineTo(-s * .42 + s * .80, gy); x.closePath(); x.fill();
    x.fillStyle = css(gr(mix(cl, [0, 0, 0], .22), g));
    x.beginPath();
    x.moveTo(-s * .42 + s * .40, gy - s * .78); x.lineTo(-s * .42 + s * .80, gy);
    x.lineTo(-s * .42 + s * .56, gy); x.closePath(); x.fill();
    x.fillStyle = css(gr(mix(cl, [0, 0, 0], .48), g));
    x.beginPath();
    x.moveTo(-s * .42 + s * .40, gy - s * .74); x.lineTo(-s * .42 + s * .22, gy);
    x.lineTo(-s * .42 + s * .56, gy); x.closePath(); x.fill();
  } else {
    /* cabane : murs de rondins, toit débordant */
    x.fillStyle = css(gr(w, g));
    x.fillRect(-s * .58, gy - s * .62, s * 1.10, s * .62);
    x.strokeStyle = css(gr(wd, g), .5); x.lineWidth = Math.max(1, s * .012);
    for (let i = 1; i < 4; i++) {
      x.beginPath(); x.moveTo(-s * .58, gy - s * .62 + i * s * .155);
      x.lineTo(s * .52, gy - s * .62 + i * s * .155); x.stroke();
    }
    x.fillStyle = css(gr(wd, g));
    x.beginPath();
    x.moveTo(-s * .70, gy - s * .60); x.lineTo(-s * .03, gy - s * .98);
    x.lineTo(s * .64, gy - s * .60); x.closePath(); x.fill();
    x.fillStyle = css(gr(mix(w, [0, 0, 0], .45), g));
    x.fillRect(-s * .12, gy - s * .40, s * .22, s * .40);
    /* fenêtre allumée la nuit */
    x.fillStyle = css(mix([70, 60, 50], [255, 214, 140], Math.min(1, g.star + .1)), .95);
    x.fillRect(s * .20, gy - s * .48, s * .18, s * .16);
  }
}

function bed(x, gy, s, lv, g) {
  const w = hex(WOOD), cl = hex(CLOTH);
  const bx = s * .72;
  if (lv === 1) {
    /* un tapis roulé, pas une flaque : une ellipse grise au sol se lisait
       comme un caillou */
    x.fillStyle = css(gr(mix(cl, [120, 90, 60], .30), g));
    x.beginPath();
    x.moveTo(bx - s * .20, gy - s * .01);
    x.lineTo(bx + s * .16, gy - s * .05);
    x.lineTo(bx + s * .20, gy - s * .11);
    x.lineTo(bx - s * .16, gy - s * .07);
    x.closePath(); x.fill();
    x.fillStyle = css(gr(mix(cl, [255, 255, 255], .25), g));
    x.beginPath(); x.ellipse(bx + s * .18, gy - s * .08, s * .035, s * .032, 0, 0, 7); x.fill();
  } else {
    const h = lv === 2 ? s * .10 : s * .15;
    x.fillStyle = css(gr(w, g));
    x.fillRect(bx - s * .22, gy - h, s * .44, h);
    x.fillStyle = css(gr(cl, g));
    x.fillRect(bx - s * .22, gy - h - s * .07, s * .44, s * .07);
    x.fillStyle = css(gr(mix(cl, [255, 255, 255], .35), g));
    x.fillRect(bx - s * .20, gy - h - s * .10, s * .13, s * .05);
    if (lv === 3) {
      x.fillStyle = css(gr(mix(w, [0, 0, 0], .25), g));
      x.fillRect(bx - s * .25, gy - h - s * .30, s * .04, s * .30);
      x.fillRect(bx + s * .21, gy - h - s * .30, s * .04, s * .30);
    }
  }
}

function fire(x, gy, s, lv, g, t) {
  const st = hex(STONE), w = hex(WOOD_D);
  const fx = 0;
  x.fillStyle = css(gr(st, g));
  const n = lv === 1 ? 5 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    x.beginPath();
    x.ellipse(fx + Math.cos(a) * s * .16, gy - s * .01 + Math.sin(a) * s * .05,
      s * .045, s * .032, 0, 0, 7);
    x.fill();
  }
  x.fillStyle = css(gr(w, g));
  x.fillRect(fx - s * .10, gy - s * .06, s * .20, s * .028);
  /* la flamme grandit avec le niveau — c'est le premier signe visible que
     le campement progresse */
  const fh = s * (.14 + lv * .07);
  for (let i = 0; i < 3; i++) {
    const k = 1 - i * .3;
    const wob = Math.sin(t * 3.4 + i * 1.7) * s * .012;
    x.fillStyle = css(mix([255, 150, 40], [255, 240, 160], i * .45), .9 - i * .16);
    x.beginPath();
    x.moveTo(fx - s * .055 * k, gy - s * .05);
    x.quadraticCurveTo(fx - s * .07 * k + wob, gy - s * .05 - fh * .6 * k,
      fx + wob, gy - s * .05 - fh * k);
    x.quadraticCurveTo(fx + s * .07 * k + wob, gy - s * .05 - fh * .6 * k,
      fx + s * .055 * k, gy - s * .05);
    x.closePath(); x.fill();
  }
  const glow = x.createRadialGradient(fx, gy - fh * .5, 0, fx, gy - fh * .5, s * (.4 + lv * .12));
  glow.addColorStop(0, "rgba(255,178,90,.34)");
  glow.addColorStop(1, "rgba(255,178,90,0)");
  x.fillStyle = glow;
  x.beginPath(); x.arc(fx, gy - fh * .5, s * (.4 + lv * .12), 0, 7); x.fill();
}

function store(x, gy, s, lv, g) {
  const w = hex(WOOD), wd = hex(WOOD_D);
  const sx = -s * .78;
  const h = s * (.10 + lv * .05), wi = s * (.16 + lv * .06);
  x.fillStyle = css(gr(w, g));
  x.fillRect(sx - wi / 2, gy - h, wi, h);
  x.fillStyle = css(gr(wd, g));
  x.fillRect(sx - wi / 2, gy - h - s * .035, wi, s * .045);
  if (lv >= 2) { x.fillStyle = css(gr(mix(wd, [230, 190, 90], .6), g));
                 x.fillRect(sx - s * .02, gy - h, s * .04, s * .05); }
}

function table(x, gy, s, lv, g) {
  const w = hex(WOOD), wd = hex(WOOD_D);
  const tx = s * .36, h = s * (.10 + lv * .03), wi = s * (.16 + lv * .09);
  x.fillStyle = css(gr(wd, g));
  x.fillRect(tx - wi * .42, gy - h, s * .035, h);
  x.fillRect(tx + wi * .38, gy - h, s * .035, h);
  x.fillStyle = css(gr(w, g));
  x.fillRect(tx - wi / 2, gy - h - s * .03, wi, s * .035);
  if (lv >= 3) {
    x.fillStyle = css(gr(mix(w, [255, 255, 255], .3), g));
    x.beginPath(); x.arc(tx, gy - h - s * .055, s * .022, 0, 7); x.fill();
  }
}

function garden(x, gy, s, lv, g, t) {
  const wd = hex(WOOD_D);
  const gx = -s * .34;
  x.fillStyle = css(gr(mix(wd, [40, 30, 20], .3), g));
  x.fillRect(gx - s * .20, gy - s * .045, s * .40, s * .05);
  const n = 2 + lv;
  for (let i = 0; i < n; i++) {
    const px = gx - s * .15 + (i / Math.max(1, n - 1)) * s * .30;
    const hh = s * (.06 + (i % 2) * .02 + lv * .015);
    const sw = Math.sin(t * 1.6 + i) * s * .008;
    x.strokeStyle = css(gr([90, 130, 70], g));
    x.lineWidth = Math.max(1, s * .014);
    x.beginPath();
    x.moveTo(px, gy - s * .04);
    x.quadraticCurveTo(px + sw, gy - s * .04 - hh * .6, px + sw * 2, gy - s * .04 - hh);
    x.stroke();
    if (lv >= 2) {
      x.fillStyle = css(gr([200, 90, 90], g));
      x.beginPath(); x.arc(px + sw * 2, gy - s * .04 - hh, s * .018, 0, 7); x.fill();
    }
  }
}

const DRAW = { shelter, bed, fire, store, table, garden };
/* du fond vers l'avant */
const ORDER = ["shelter", "store", "bed", "garden", "table", "fire"];

function draw(ctx, cx, gy, s, base, g, t) {
  ctx.save();
  ctx.translate(cx, 0);
  ORDER.forEach(k => {
    const lv = base[k] || 0;
    if (lv > 0) DRAW[k](ctx, gy, s, lv, g, t);
  });
  ctx.restore();
}

global.Camp = { draw, PART_ORDER: ORDER };

})(window);
