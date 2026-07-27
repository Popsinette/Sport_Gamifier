/* =========================================================
   Odyssée — moteur de rendu du monde (Canvas 2D)
   Voir DESIGN.md pour la direction artistique.

   Expose : window.Odyssey = { BIOMES, createScene }
   ========================================================= */
(function (global) {
"use strict";

/* ---------------------------------------------------------
   Utilitaires
   --------------------------------------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(str) {
  let s = 2166136261;
  for (let i = 0; i < str.length; i++) { s ^= str.charCodeAt(i); s = Math.imul(s, 16777619); }
  return s >>> 0;
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = t => t * t * (3 - 2 * t);

function hexRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mixRgb = (a, b, t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
const css = (c, a) => a == null
  ? "rgb(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + ")"
  : "rgba(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + "," + a + ")";

/* ---------------------------------------------------------
   Cycle jour/nuit — un grade multiplicatif unique
   --------------------------------------------------------- */
const PHASES = [
  { h: 0,    amb: [0.30, 0.34, 0.52], sun: "#9fb6e0", sunY: 0.16, star: 1,   label: "Nuit" },
  { h: 5.5,  amb: [0.55, 0.48, 0.55], sun: "#ffb98a", sunY: 0.74, star: 0.5, label: "Aube" },
  { h: 8,    amb: [0.92, 0.92, 0.95], sun: "#fff0d0", sunY: 0.44, star: 0,   label: "Matin" },
  { h: 13,   amb: [1.00, 1.00, 1.00], sun: "#fffaf0", sunY: 0.15, star: 0,   label: "Plein jour" },
  { h: 18,   amb: [0.95, 0.82, 0.74], sun: "#ff9e5e", sunY: 0.64, star: 0,   label: "Crépuscule" },
  { h: 20.5, amb: [0.55, 0.50, 0.62], sun: "#e07a5f", sunY: 0.82, star: 0.4, label: "Soir" },
  { h: 24,   amb: [0.30, 0.34, 0.52], sun: "#9fb6e0", sunY: 0.16, star: 1,   label: "Nuit" },
];

function gradeAt(hour) {
  let i = 0;
  while (i < PHASES.length - 2 && hour >= PHASES[i + 1].h) i++;
  const a = PHASES[i], b = PHASES[i + 1];
  const t = smooth(clamp((hour - a.h) / (b.h - a.h), 0, 1));
  return {
    amb: [lerp(a.amb[0], b.amb[0], t), lerp(a.amb[1], b.amb[1], t), lerp(a.amb[2], b.amb[2], t)],
    sun: mixRgb(hexRgb(a.sun), hexRgb(b.sun), t),
    sunY: lerp(a.sunY, b.sunY, t),
    star: lerp(a.star, b.star, t),
    label: t < 0.5 ? a.label : b.label,
  };
}
/* applique la lumière ambiante à une couleur */
const grade = (c, g) => [c[0] * g.amb[0], c[1] * g.amb[1], c[2] * g.amb[2]];

/* ---------------------------------------------------------
   Catalogue des biomes
   Chaque couche : t=type, y=ligne d'horizon (0-1), s=parallaxe,
   f=mélange au brouillard, c=couleur de base
   --------------------------------------------------------- */
const BIOMES = [
  { id:"vallee", name:"Vallée de l'Aube",
    sky:["#8ec5e8","#ffe6c9"], fog:"#f2dcc4", ground:"#7fa05e", path:"#c9ae7d", amb:"dust",
    layers:[
      { t:"ridge",  y:.52, a:.16, seg:7,  jag:.7, c:"#6f88a8", f:.72, s:.08 },
      { t:"hills",  y:.63, a:.10, seg:6,  c:"#5f8a63", f:.46, s:.20 },
      { t:"forest", y:.72, h:.09, n:13, kind:"round",   c:"#3f6b48", f:.22, s:.42 },
    ]},
  { id:"alpes", name:"Alpes Enneigées",
    sky:["#8fc0e6","#e4f1fa"], fog:"#dbe9f4", ground:"#eef4f8", path:"#cbd8e4", amb:"snow",
    layers:[
      { t:"ridge",  y:.46, a:.26, seg:8,  jag:1, c:"#7f97b3", f:.70, s:.07, snow:.55 },
      { t:"ridge",  y:.58, a:.20, seg:7,  jag:1, c:"#5d7характ",f:.44, s:.18, snow:.42 },
      { t:"forest", y:.74, h:.08, n:15, kind:"conifer", c:"#2f4a52", f:.18, s:.44 },
    ]},
  { id:"foret", name:"Forêt Enchantée",
    sky:["#3f7d8c","#a8dcc9"], fog:"#8fc5b8", ground:"#2f5a44", path:"#6d7a52", amb:"fireflies",
    layers:[
      { t:"forest", y:.56, h:.20, n:9,  kind:"conifer", c:"#4e8a86", f:.68, s:.09 },
      { t:"forest", y:.66, h:.18, n:11, kind:"round",   c:"#2f6b60", f:.40, s:.22 },
      { t:"forest", y:.76, h:.15, n:13, kind:"conifer", c:"#173d38", f:.12, s:.46 },
    ]},
  { id:"rizieres", name:"Rizières Japonaises",
    sky:["#9dc8e0","#f6e2b8"], fog:"#e2dcc0", ground:"#8fae5c", path:"#b8a06a", amb:"birds",
    layers:[
      { t:"ridge",  y:.50, a:.17, seg:6, jag:.5, c:"#7a90a6", f:.72, s:.08 },
      { t:"struct", y:.62, kind:"pagoda", c:"#6b5a56", f:.42, s:.20 },
      { t:"hills",  y:.72, a:.09, seg:7, c:"#5f8442", f:.16, s:.42 },
    ]},
  { id:"sakura", name:"Cerisiers en Fleurs",
    sky:["#9cc0e4","#ffeaf0"], fog:"#eadde2", ground:"#7f9c62", path:"#bda57e", amb:"petals",
    layers:[
      { t:"ridge",  y:.50, a:.18, seg:6, jag:.7, c:"#7d89ad", f:.62, s:.08, snow:.34 },
      { t:"forest", y:.66, h:.13, n:9,  kind:"round", c:"#e2a6c2", f:.34, s:.22 },
      { t:"forest", y:.76, h:.14, n:11, kind:"round", c:"#b8628a", f:.10, s:.46 },
    ]},
  { id:"dunes", name:"Dunes du Désert",
    sky:["#e8b878","#ffe9c4"], fog:"#f0d4a8", ground:"#dfae70", path:"#c8924f", amb:"dust",
    layers:[
      { t:"dunes",  y:.56, a:.13, seg:5, c:"#c99a63", f:.66, s:.08 },
      { t:"dunes",  y:.66, a:.11, seg:4, c:"#b8834e", f:.40, s:.20 },
      { t:"dunes",  y:.76, a:.09, seg:4, c:"#9c6a3c", f:.14, s:.44 },
    ]},
  { id:"canyon", name:"Canyon Rouge",
    sky:["#d99a6c","#ffdcae"], fog:"#e8bc90", ground:"#b06e42", path:"#c98e5c", amb:"dust",
    layers:[
      { t:"mesa",   y:.44, a:.24, seg:5, c:"#a56046", f:.64, s:.08 },
      { t:"mesa",   y:.58, a:.20, seg:4, c:"#8c4a36", f:.38, s:.20 },
      { t:"mesa",   y:.72, a:.14, seg:4, c:"#6b3428", f:.12, s:.46 },
    ]},
  { id:"jungle", name:"Jungle Tropicale",
    sky:["#6fb0a4","#e4f2dc"], fog:"#bcdcc0", ground:"#3a6336", path:"#8a7a4a", amb:"mist",
    layers:[
      { t:"hills",  y:.50, a:.14, seg:6, c:"#5f8a72", f:.74, s:.08 },
      { t:"forest", y:.64, h:.15, n:8,  kind:"round", c:"#3f8058", f:.44, s:.22 },
      { t:"forest", y:.78, h:.15, n:7,  kind:"palm",  c:"#153c2a", f:.06, s:.50 },
    ]},
  { id:"falaises", name:"Falaises Océanes",
    sky:["#7fb4dc","#e0f0f8"], fog:"#c8e0ee", ground:"#6f8a5e", path:"#b4a582", amb:"spray",
    layers:[
      { t:"ridge",  y:.50, a:.14, seg:6, jag:.8, c:"#7d93ac", f:.74, s:.08 },
      { t:"sea",    y:.64, c:"#4a8ab4", f:.34, s:.16 },
      { t:"mesa",   y:.74, a:.12, seg:3, c:"#6b6250", f:.10, s:.46 },
    ]},
  { id:"fjord", name:"Fjord Nordique",
    sky:["#7d9cb8","#dae8f0"], fog:"#c0d4e0", ground:"#4f6b58", path:"#8a8878", amb:"mist",
    layers:[
      { t:"ridge",  y:.42, a:.28, seg:6, jag:1, c:"#6d829c", f:.72, s:.07, snow:.40 },
      { t:"sea",    y:.62, c:"#3f6b84", f:.36, s:.16 },
      { t:"forest", y:.74, h:.10, n:13, kind:"conifer", c:"#22413a", f:.10, s:.46 },
    ]},
  { id:"automne", name:"Forêt d'Automne",
    sky:["#9cb8d4","#ffdfb0"], fog:"#eccfa8", ground:"#8a7444", path:"#b09060", amb:"leaves",
    layers:[
      { t:"ridge",  y:.52, a:.15, seg:6, jag:.6, c:"#8494a8", f:.72, s:.08 },
      { t:"forest", y:.66, h:.14, n:10, kind:"round", c:"#c88746", f:.42, s:.22 },
      { t:"forest", y:.77, h:.14, n:12, kind:"round", c:"#8c4f28", f:.12, s:.46 },
    ]},
  { id:"volcan", name:"Terres Volcaniques",
    sky:["#5a3f52","#e0764e"], fog:"#8c5a54", ground:"#3a2c30", path:"#5a4442", amb:"embers",
    layers:[
      { t:"ridge",  y:.44, a:.26, seg:6, jag:1, c:"#5c4048", f:.62, s:.08 },
      { t:"ridge",  y:.60, a:.18, seg:5, jag:1, c:"#42303a", f:.36, s:.20 },
      { t:"mesa",   y:.74, a:.10, seg:4, c:"#241c22", f:.08, s:.46 },
    ]},
  { id:"toundra", name:"Toundra Glacée",
    sky:["#a8c4d8","#eef4f8"], fog:"#dce8f0", ground:"#dae4e8", path:"#bcc8d0", amb:"snow",
    layers:[
      { t:"hills",  y:.56, a:.09, seg:5, c:"#96aec0", f:.76, s:.08 },
      { t:"hills",  y:.66, a:.07, seg:6, c:"#7e98ac", f:.44, s:.20 },
      { t:"forest", y:.78, h:.06, n:9, kind:"conifer", c:"#4e6270", f:.16, s:.44 },
    ]},
  { id:"temple", name:"Temple des Nuages",
    sky:["#8fa8cc","#f0e0ea"], fog:"#dcd0e0", ground:"#7a8a76", path:"#b0a48c", amb:"mist",
    layers:[
      { t:"ridge",  y:.40, a:.30, seg:5, jag:1, c:"#7482a8", f:.74, s:.06, snow:.30 },
      { t:"struct", y:.62, kind:"temple", c:"#8a6a62", f:.40, s:.20 },
      { t:"forest", y:.77, h:.17, n:8,  kind:"bamboo", c:"#33513c", f:.10, s:.46 },
    ]},
  { id:"village", name:"Village Médiéval",
    sky:["#c88a72","#ffdcb0"], fog:"#e8c4a0", ground:"#7a8a5a", path:"#b09468", amb:"dust",
    layers:[
      { t:"hills",  y:.54, a:.12, seg:6, c:"#8a8fa0", f:.70, s:.08 },
      { t:"struct", y:.66, kind:"village", c:"#7a5a4a", f:.36, s:.22 },
      { t:"forest", y:.78, h:.08, n:11, kind:"round", c:"#3f5236", f:.10, s:.46 },
    ]},
  { id:"iles", name:"Îles Tropicales",
    sky:["#6ec0dc","#e8f8f4"], fog:"#bde8ea", ground:"#e8dcb0", path:"#d8c894", amb:"spray",
    layers:[
      { t:"hills",  y:.52, a:.12, seg:5, c:"#6fa8b0", f:.74, s:.08 },
      { t:"sea",    y:.66, c:"#42b0c0", f:.30, s:.16 },
      { t:"forest", y:.78, h:.13, n:8, kind:"palm", c:"#2f6b52", f:.10, s:.48 },
    ]},
  { id:"cite", name:"Cité Flottante",
    sky:["#8f8ad0","#ffd8e8"], fog:"#d8c8ea", ground:"#6a5f88", path:"#9a8cb4", amb:"mist",
    layers:[
      { t:"float",  y:.36, a:.14, n:3, c:"#8f8ab8", f:.70, s:.08 },
      { t:"float",  y:.54, a:.16, n:2, c:"#6f6a9c", f:.40, s:.20 },
      { t:"struct", y:.72, kind:"ruins", c:"#4f4670", f:.12, s:.46 },
    ]},
  { id:"aurore", name:"Aurore Boréale",
    sky:["#1c2a52","#4a6a8c"], fog:"#3a5674", ground:"#d8e4ec", path:"#b0c0cc", amb:"aurora",
    layers:[
      { t:"ridge",  y:.46, a:.24, seg:7, jag:1, c:"#3f5878", f:.66, s:.07, snow:.60 },
      { t:"ridge",  y:.60, a:.16, seg:6, jag:1, c:"#2c4260", f:.38, s:.20, snow:.45 },
      { t:"forest", y:.76, h:.09, n:13, kind:"conifer", c:"#16283a", f:.10, s:.46 },
    ]},
];
/* correction d'une couleur saisie */
BIOMES[1].layers[1].c = "#5d7490";

/* ---------------------------------------------------------
   Générateurs de silhouettes (Path2D, mis en cache)
   --------------------------------------------------------- */
const pathCache = new Map();

/* HV = hauteur virtuelle : les y des couches sont exprimés dans le repère
   d'origine (sol à .80) puis remis à l'échelle de la ligne d'horizon réelle. */
function tilePath(biomeId, li, layer, tile, W, HV) {
  const key = biomeId + "|" + li + "|" + tile + "|" + (W | 0) + "x" + (HV | 0);
  let p = pathCache.get(key);
  if (p) return p;
  const rng = mulberry32(seedOf(key));
  p = buildLayer(layer, W, HV, rng);
  if (pathCache.size > 400) pathCache.clear();
  pathCache.set(key, p);
  return p;
}

function buildLayer(L, W, H, rng) {
  const p = new Path2D();
  const base = L.y * H;
  const FLOOR = H * 3;   /* les remplissages descendent hors cadre */

  if (L.t === "ridge" || L.t === "hills" || L.t === "dunes") {
    const segs = L.seg || 6;
    const amp = (L.a || .12) * H;
    const ys = [];
    for (let i = 0; i <= segs; i++) ys.push(rng());
    ys[segs] = ys[0]; /* tuile bouclée */
    p.moveTo(0, base - ys[0] * amp);
    if (L.jag) {
      /* crêtes : arêtes anguleuses avec micro-relief */
      for (let i = 1; i <= segs; i++) {
        const x0 = (i - 1) / segs * W, x1 = i / segs * W;
        const y0 = base - ys[i - 1] * amp, y1 = base - ys[i] * amp;
        const steps = 3;
        for (let k = 1; k <= steps; k++) {
          const t = k / steps;
          const jitter = (rng() - .5) * amp * .16 * L.jag * Math.sin(t * Math.PI);
          p.lineTo(lerp(x0, x1, t), lerp(y0, y1, t) + jitter);
        }
      }
    } else {
      /* collines/dunes : courbes lissées */
      for (let i = 1; i <= segs; i++) {
        const xa = (i - 1) / segs * W, xb = i / segs * W;
        const ya = base - ys[i - 1] * amp, yb = base - ys[i] * amp;
        p.quadraticCurveTo(lerp(xa, xb, .5), ya, lerp(xa, xb, .62), lerp(ya, yb, .55));
        p.quadraticCurveTo(lerp(xa, xb, .82), yb, xb, yb);
      }
    }
    p.lineTo(W, FLOOR); p.lineTo(0, FLOOR); p.closePath();
    return p;
  }

  if (L.t === "mesa") {
    const segs = L.seg || 4;
    const amp = (L.a || .16) * H;
    let x = 0, prevH = amp * .3;
    p.moveTo(0, FLOOR); p.lineTo(0, base - prevH);
    while (x < W) {
      const w = W / segs * (.45 + rng() * 1.05);
      const h = amp * (.28 + rng() * .72);
      const slope = w * (.10 + rng() * .16);
      /* épaulement intermédiaire : évite le trapèze parfait */
      p.lineTo(x + slope * .45, base - lerp(prevH, h, .55));
      p.lineTo(x + slope, base - h);
      p.lineTo(x + w - slope, base - h * (.93 + rng() * .07));
      p.lineTo(Math.min(x + w, W), base - h * (.30 + rng() * .3));
      prevH = h * .3;
      x += w;
    }
    p.lineTo(W, FLOOR); p.closePath();
    return p;
  }

  if (L.t === "sea") {
    p.rect(0, base, W, FLOOR - base);
    return p;
  }

  if (L.t === "forest") {
    const n = L.n || 12, h = (L.h || .12) * H * treeMul(L);
    const alt = L.kind === "conifer" ? "round" : L.kind === "round" ? "conifer" : L.kind;
    for (let i = 0; i < n; i++) {
      const x = (i + .5) / n * W + (rng() - .5) * (W / n) * .62;
      const s = .62 + rng() * .74;
      /* on mélange deux essences : une rangée d'arbres identiques fait clipart */
      const kind = rng() > .74 ? alt : L.kind;
      drawTree(p, x, base + (rng() - .5) * h * .12, h * s, kind, rng);
    }
    p.rect(0, base - 1, W, FLOOR - base + 1);
    return p;
  }

  if (L.t === "struct") { buildStruct(p, L, W, H, base, rng); return p; }

  if (L.t === "float") {
    const n = L.n || 3, amp = (L.a || .14) * H;
    for (let i = 0; i < n; i++) {
      const x = (i + .5) / n * W + (rng() - .5) * 40;
      const y = base + (rng() - .5) * amp;
      const w = 34 + rng() * 46, hh = 10 + rng() * 8;
      p.moveTo(x - w / 2, y);
      p.quadraticCurveTo(x, y - hh * .9, x + w / 2, y);
      p.quadraticCurveTo(x + w * .18, y + hh * 2.6, x, y + hh * 3.4);
      p.quadraticCurveTo(x - w * .18, y + hh * 2.6, x - w / 2, y);
      p.closePath();
      /* végétation sur l'îlot */
      drawTree(p, x - w * .2, y - hh * .5, 14 + rng() * 8, "round", rng);
      drawTree(p, x + w * .22, y - hh * .4, 11 + rng() * 7, "conifer", rng);
    }
    return p;
  }
  return p;
}

/* Échelle des arbres. Un personnage doit passer sous une frondaison, pas la
   dominer : les rangées proches sont nettement plus hautes que lui, les
   lointaines restent basses par perspective. On se cale sur la vitesse de
   parallaxe, qui EST la distance. */
function treeMul(L) {
  let m = 1.35 + clamp(L.s || .2, .06, .5) * 2.1;
  /* Une rangée plantée au niveau du héros ne peut pas lui arriver à la
     taille : on garantit une cime à sa hauteur, sans toucher aux rangées
     lointaines, dont la petitesse EST la perspective. */
  if ((L.y || .7) >= .74) m = Math.max(m, Math.min(3.6, .26 / (L.h || .12)));
  return m;
}
/* Facteur de taille le plus grand tiré dans le générateur (.62 + .74). */
const TREE_MAX = 1.36;

/* Sommet géométrique réel d'une couche. Le dégradé de remplissage part de
   là : s'il démarre plus bas que la cime, tout ce qui dépasse se peint avec
   la couleur de tête du dégradé et les arbres virent au blanc laiteux. */
function layerTopY(L, HV) {
  if (L.t === "forest")
    return L.y * HV - (L.h || .12) * HV * treeMul(L) * TREE_MAX;
  return (L.y - (L.a || L.h || .1)) * HV;
}

/* essence de complément, pour ne pas aligner des arbres identiques */
function altKind(k) {
  return k === "conifer" ? "round" : k === "round" ? "conifer" : k;
}

function drawTree(p, x, base, h, kind, rng) {
  if (kind === "conifer") {
    const w = h * .42;
    p.moveTo(x - w * .12, base);
    p.lineTo(x - w * .12, base - h * .22);
    p.lineTo(x - w * .5, base - h * .22);
    p.lineTo(x, base - h);
    p.lineTo(x + w * .5, base - h * .22);
    p.lineTo(x + w * .12, base - h * .22);
    p.lineTo(x + w * .12, base);
    p.closePath();
  } else if (kind === "palm") {
    const t = Math.max(1.2, h * .045);
    const lean = h * .16;
    /* stipe incurvé */
    p.moveTo(x - t, base);
    p.quadraticCurveTo(x - t + lean * .5, base - h * .5, x + lean, base - h * .84);
    p.lineTo(x + lean + t * 1.5, base - h * .83);
    p.quadraticCurveTo(x + t + lean * .5, base - h * .5, x + t, base);
    p.closePath();
    const cx = x + lean + t * .5, cy = base - h * .86;
    /* palmes retombantes */
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.06 + (i / 6) * .88);
      const ex = cx + Math.cos(a) * h * .50;
      const ey = cy + Math.abs(Math.sin(a)) * -h * .16 + h * .20;
      p.moveTo(cx, cy);
      p.quadraticCurveTo(cx + (ex - cx) * .55, cy - h * .19, ex, ey);
      p.quadraticCurveTo(cx + (ex - cx) * .48, cy - h * .04, cx, cy + h * .04);
      p.closePath();
    }
  } else if (kind === "bamboo") {
    const w = Math.max(1.1, h * .045);
    for (let k = 0; k < 3; k++) {
      const bx = x + (k - 1) * w * 3.4;
      const bh = h * (.78 + rng() * .5);
      const tilt = (rng() - .5) * h * .06;
      p.moveTo(bx - w / 2, base);
      p.lineTo(bx - w / 2 + tilt, base - bh);
      p.lineTo(bx + w / 2 + tilt, base - bh);
      p.lineTo(bx + w / 2, base);
      p.closePath();
      /* feuilles fines en haut de chaque tige */
      for (let j = 0; j < 3; j++) {
        const ly = base - bh * (.72 + j * .11);
        const dir = j % 2 ? 1 : -1;
        const lx = bx + tilt * (ly / base);
        p.moveTo(lx, ly);
        p.quadraticCurveTo(lx + dir * h * .13, ly - h * .06, lx + dir * h * .24, ly - h * .11);
        p.quadraticCurveTo(lx + dir * h * .12, ly - h * .02, lx, ly + w * .6);
        p.closePath();
      }
    }
  } else { /* round */
    const w = h * .52, t = h * .09;
    p.rect(x - t / 2, base - h * .55, t, h * .55);
    p.moveTo(x, base - h);
    p.bezierCurveTo(x + w, base - h * .96, x + w * 1.02, base - h * .38, x, base - h * .42);
    p.bezierCurveTo(x - w * 1.02, base - h * .38, x - w, base - h * .96, x, base - h);
    p.closePath();
  }
}

function buildStruct(p, L, W, H, base, rng) {
  const k = L.kind;
  if (k === "pagoda") {
    const x = W * (.24 + rng() * .5), s = 26 + rng() * 12;
    p.rect(x - s * .1, base - s * 1.5, s * .2, s * 1.5);
    for (let i = 0; i < 4; i++) {
      const y = base - s * (.42 + i * .34), w = s * (1.05 - i * .17);
      p.moveTo(x - w, y);
      p.quadraticCurveTo(x, y - s * .2, x + w, y);
      p.quadraticCurveTo(x, y - s * .06, x - w, y);
      p.closePath();
      p.rect(x - w * .5, y, w, s * .2);
    }
    p.moveTo(x, base - s * 1.72); p.lineTo(x + s * .05, base - s * 1.5);
    p.lineTo(x - s * .05, base - s * 1.5); p.closePath();
    /* torii au sol */
    const tx = x - s * 2.4, ts = s * .5;
    p.rect(tx - ts * .8, base - ts * 1.1, ts * .14, ts * 1.1);
    p.rect(tx + ts * .66, base - ts * 1.1, ts * .14, ts * 1.1);
    p.rect(tx - ts, base - ts * 1.24, ts * 2, ts * .14);
    p.rect(tx - ts * .86, base - ts * .98, ts * 1.72, ts * .1);
  } else if (k === "temple") {
    const x = W * (.3 + rng() * .4), s = 34 + rng() * 14;
    p.rect(x - s * .9, base - s * .8, s * 1.8, s * .8);
    for (let i = 0; i < 5; i++) p.rect(x - s * .76 + i * s * .34, base - s * .74, s * .12, s * .74);
    p.moveTo(x - s * 1.1, base - s * .8);
    p.lineTo(x, base - s * 1.34);
    p.lineTo(x + s * 1.1, base - s * .8);
    p.closePath();
    p.rect(x - s * 1.16, base - s * .86, s * 2.32, s * .1);
  } else if (k === "village") {
    let x = W * .06;
    while (x < W * .96) {
      const w = 20 + rng() * 20, h = 18 + rng() * 20;
      p.rect(x, base - h, w, h);
      p.moveTo(x - w * .14, base - h);
      p.lineTo(x + w * .5, base - h - w * .42);
      p.lineTo(x + w * 1.14, base - h);
      p.closePath();
      if (rng() > .55) p.rect(x + w * .62, base - h - w * .34, w * .17, w * .5); /* cheminée */
      x += w + 8 + rng() * 20;
    }
  } else { /* ruins */
    let x = W * .08;
    while (x < W * .95) {
      const h = 16 + rng() * 30;
      p.rect(x, base - h, 7, h);
      p.rect(x - 2, base - h - 4, 11, 4);
      x += 14 + rng() * 26;
    }
    p.rect(W * .05, base - 4, W * .9, 4);
  }
}

/* ---------------------------------------------------------
   Le Voyageur
   --------------------------------------------------------- */
function drawTraveler(ctx, x, y, s, st, g, cloak) {
  /* st : { phase, walking, jump, cheer, look, t } */
  const sun = css(g.sun, .9);
  const dark = grade(hexRgb("#1b2430"), g);
  const cl = grade(hexRgb(cloak[0]), g);
  const cl2 = grade(hexRgb(cloak[1]), g);
  const skin = grade(hexRgb("#e8b48c"), g);

  const swing = st.walking ? Math.sin(st.phase) : 0;
  const bob = st.walking ? Math.abs(Math.cos(st.phase)) * 1.6 : Math.sin(st.t * 1.9) * .8;
  const jumpY = st.jump ? -Math.sin(st.jump * Math.PI) * s * 1.15 : 0;
  const cheerY = st.cheer ? -Math.abs(Math.sin(st.cheer * Math.PI * 2)) * s * .55 : 0;
  const lean = st.walking ? 3 : 0;

  ctx.save();
  ctx.translate(x, y + jumpY + cheerY - bob);

  /* ombre portée */
  ctx.save();
  ctx.globalAlpha = clamp(.30 + (jumpY + cheerY) / (s * 1.6), .05, .30);
  ctx.fillStyle = css(grade(hexRgb("#20303c"), g));
  ctx.beginPath();
  ctx.ellipse(0, -jumpY - cheerY + bob + 1, s * .30, s * .075, 0, 0, 7);
  ctx.fill();
  ctx.restore();

  ctx.rotate(lean * Math.PI / 180 * .18);

  /* jambe arrière */
  ctx.save();
  ctx.translate(-s * .01, -s * .40);
  ctx.rotate(swing * .46);
  ctx.fillStyle = css(mixRgb(dark, cl2, .30));
  roundRect(ctx, -s * .042, 0, s * .084, s * .42, s * .042);
  ctx.restore();
  /* jambe avant */
  ctx.save();
  ctx.translate(s * .01, -s * .40);
  ctx.rotate(-swing * .46);
  ctx.fillStyle = css(mixRgb(dark, cl2, .12));
  roundRect(ctx, -s * .042, 0, s * .084, s * .42, s * .042);
  ctx.restore();

  /* sac de voyage */
  ctx.fillStyle = css(mixRgb(dark, hexRgb("#6b4f3a"), .5));
  roundRect(ctx, -s * .215, -s * .86, s * .15, s * .30, s * .06);

  /* cape : épaules étroites, ourlet évasé */
  const sway = st.walking ? Math.sin(st.phase * .5) * s * .030 : Math.sin(st.t * 1.2) * s * .012;
  const cg = ctx.createLinearGradient(-s * .1, -s * 1.0, s * .12, -s * .28);
  cg.addColorStop(0, css(mixRgb(cl, [255,255,255], .08)));
  cg.addColorStop(.55, css(cl));
  cg.addColorStop(1, css(cl2));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(0, -s * .98);
  ctx.bezierCurveTo(s * .115, -s * .95, s * .150, -s * .66, s * .175 + sway, -s * .30);
  ctx.quadraticCurveTo(s * .09, -s * .245, 0, -s * .255);
  ctx.quadraticCurveTo(-s * .09, -s * .265, -s * .175 + sway * .6, -s * .32);
  ctx.bezierCurveTo(-s * .155, -s * .66, -s * .120, -s * .95, 0, -s * .98);
  ctx.closePath();
  ctx.fill();

  /* pli central (donne du drapé) */
  ctx.strokeStyle = css(mixRgb(cl2, [0,0,0], .22), .5);
  ctx.lineWidth = Math.max(.7, s * .022);
  ctx.beginPath();
  ctx.moveTo(s * .012, -s * .84);
  ctx.quadraticCurveTo(s * .055, -s * .58, s * .075 + sway * .6, -s * .30);
  ctx.stroke();

  /* bras qui balance devant la cape */
  ctx.save();
  ctx.translate(s * .075, -s * .80);
  ctx.rotate(-swing * .38 + .12);
  ctx.fillStyle = css(mixRgb(cl2, [0,0,0], .12));
  roundRect(ctx, -s * .036, 0, s * .072, s * .30, s * .036);
  ctx.restore();

  /* liseré de lumière côté soleil */
  ctx.strokeStyle = sun;
  ctx.lineWidth = Math.max(1, s * .030);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(s * .03, -s * .965);
  ctx.bezierCurveTo(s * .125, -s * .93, s * .158, -s * .64, s * .178 + sway, -s * .32);
  ctx.stroke();

  /* tête + capuche */
  ctx.fillStyle = css(skin);
  ctx.beginPath(); ctx.arc(s * .022, -s * 1.055, s * .088, 0, 7); ctx.fill();
  const hg = ctx.createLinearGradient(-s * .09, -s * 1.20, s * .10, -s * .95);
  hg.addColorStop(0, css(mixRgb(cl, [255,255,255], .14)));
  hg.addColorStop(1, css(cl2));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-s * .125, -s * .945);
  ctx.quadraticCurveTo(-s * .150, -s * 1.215, s * .045, -s * 1.212);
  ctx.quadraticCurveTo(s * .132, -s * 1.200, s * .118, -s * 1.078);
  ctx.quadraticCurveTo(s * .058, -s * 1.112, s * .028, -s * 1.028);
  ctx.quadraticCurveTo(-s * .005, -s * .945, -s * .125, -s * .945);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sun; ctx.lineWidth = Math.max(.8, s * .024);
  ctx.beginPath();
  ctx.moveTo(-s * .015, -s * 1.215);
  ctx.quadraticCurveTo(s * .132, -s * 1.200, s * .118, -s * 1.078);
  ctx.stroke();

  /* écharpe : deux pans qui suivent le corps avec retard (inertie) */
  const lag = st.walking ? Math.sin(st.phase - 1.1) : Math.sin(st.t * 1.5 - 1);
  ctx.fillStyle = css(grade(hexRgb(cloak[2]), g));
  ctx.beginPath();
  ctx.moveTo(-s * .04, -s * .935);
  ctx.quadraticCurveTo(-s * .26, -s * .90 + lag * s * .05, -s * .46, -s * .76 + lag * s * .12);
  ctx.quadraticCurveTo(-s * .30, -s * .80 + lag * s * .04, -s * .085, -s * .855);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(mixRgb(grade(hexRgb(cloak[2]), g), [0,0,0], .18));
  ctx.beginPath();
  ctx.moveTo(-s * .05, -s * .885);
  ctx.quadraticCurveTo(-s * .23, -s * .78 + lag * s * .07, -s * .37, -s * .58 + lag * s * .15);
  ctx.quadraticCurveTo(-s * .22, -s * .68 + lag * s * .05, -s * .075, -s * .80);
  ctx.closePath(); ctx.fill();

  /* lanterne la nuit */
  if (g.star > .25) {
    const lx = s * .26, ly = -s * .52;
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, s * .55);
    lg.addColorStop(0, "rgba(255,206,120,.55)");
    lg.addColorStop(1, "rgba(255,206,120,0)");
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly, s * .55, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,224,160,.95)";
    roundRect(ctx, lx - s * .035, ly - s * .05, s * .07, s * .1, s * .02);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/* ---------------------------------------------------------
   Obstacles — de véritables scènes
   --------------------------------------------------------- */
const OB_DRAW = {
  bridge(ctx, x, gy, s, g, t) {
    const wood = css(grade(hexRgb("#6b4a35"), g)), dark = css(grade(hexRgb("#3a2a20"), g));
    ctx.fillStyle = css(grade(hexRgb("#2b3540"), g));
    ctx.beginPath(); ctx.moveTo(x - s * 1.5, gy); ctx.lineTo(x - s * .55, gy);
    ctx.lineTo(x - s * .62, gy + s * 1.4); ctx.lineTo(x - s * 1.5, gy + s * 1.4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * .5, gy); ctx.lineTo(x + s * 1.6, gy);
    ctx.lineTo(x + s * 1.6, gy + s * 1.4); ctx.lineTo(x + s * .58, gy + s * 1.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = wood;
    for (let i = 0; i < 4; i++) ctx.fillRect(x - s * 1.5 + i * s * .24, gy - s * .1, s * .2, s * .12);
    ctx.save(); ctx.translate(x + s * .5, gy - s * .04); ctx.rotate(.22 + Math.sin(t * 1.4) * .012);
    ctx.fillStyle = wood;
    for (let i = 0; i < 4; i++) ctx.fillRect(i * s * .24, 0, s * .2, s * .12);
    ctx.restore();
    ctx.strokeStyle = dark; ctx.lineWidth = s * .045;
    ctx.beginPath(); ctx.moveTo(x - s * 1.5, gy - s * .42);
    ctx.quadraticCurveTo(x - s * .95, gy - s * .3, x - s * .58, gy - s * .16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * .56, gy - s * .1);
    ctx.quadraticCurveTo(x + s * .8, gy + s * .3 + Math.sin(t * 1.6) * s * .04, x + s * .74, gy + s * .6); ctx.stroke();
  },
  river(ctx, x, gy, s, g, t) {
    const w = s * 2.1;
    const wg = ctx.createLinearGradient(0, gy - s * .1, 0, gy + s * 1.2);
    wg.addColorStop(0, css(grade(hexRgb("#5fa8c8"), g)));
    wg.addColorStop(1, css(grade(hexRgb("#2f6484"), g)));
    ctx.fillStyle = wg;
    ctx.fillRect(x - w / 2, gy - s * .06, w, s * 1.3);
    ctx.strokeStyle = css(grade(hexRgb("#dff2fa"), g), .55);
    ctx.lineWidth = s * .035; ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const yy = gy + s * .08 + i * s * .13;
      const off = Math.sin(t * 2.4 + i * 1.3) * s * .16;
      ctx.beginPath();
      ctx.moveTo(x - w * .34 + off, yy);
      ctx.quadraticCurveTo(x + off, yy - s * .05, x + w * .32 + off, yy);
      ctx.stroke();
    }
    ctx.fillStyle = css(grade(hexRgb("#4e5a52"), g));
    ctx.beginPath(); ctx.ellipse(x - s * .4, gy + s * .3, s * .19, s * .1, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s * .46, gy + s * .52, s * .16, s * .09, 0, 0, 7); ctx.fill();
  },
  bear(ctx, x, gy, s, g, t) {
    const body = css(grade(hexRgb("#4a3830"), g));
    const br = Math.sin(t * 1.1) * s * .012;
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(x, gy - s * .42 + br, s * .58, s * .40, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - s * .52, gy - s * .74, s * .26, s * .24, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * .66, gy - s * .95, s * .085, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * .38, gy - s * .95, s * .085, 0, 7); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#2a1e1a"), g));
    ctx.beginPath(); ctx.ellipse(x - s * .74, gy - s * .70, s * .09, s * .07, 0, 0, 7); ctx.fill();
    for (const dx of [-.05, .05, .15]) {
      ctx.beginPath(); ctx.ellipse(x + dx * s * 4, gy - s * .04, s * .13, s * .07, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = css(g.sun, .92);
    ctx.beginPath(); ctx.arc(x - s * .60, gy - s * .78, s * .028, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s * .45, gy - s * .79, s * .026, 0, 7); ctx.fill();
  },
  door(ctx, x, gy, s, g, t) {
    const st = css(grade(hexRgb("#6f6558"), g)), st2 = css(grade(hexRgb("#4a4238"), g));
    ctx.fillStyle = st;
    ctx.fillRect(x - s * .95, gy - s * 1.7, s * .3, s * 1.7);
    ctx.fillRect(x + s * .65, gy - s * 1.7, s * .3, s * 1.7);
    ctx.fillRect(x - s * 1.1, gy - s * 1.92, s * 2.2, s * .26);
    ctx.fillStyle = st2;
    ctx.fillRect(x - s * .65, gy - s * 1.62, s * 1.3, s * 1.62);
    ctx.strokeStyle = css(mixRgb(g.sun, hexRgb("#ffd9a0"), .4), .5 + Math.sin(t * 1.5) * .18);
    ctx.lineWidth = s * .05;
    ctx.beginPath(); ctx.arc(x, gy - s * .86, s * .34, 0, 7); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + t * .25;
      ctx.moveTo(x + Math.cos(a) * s * .34, gy - s * .86 + Math.sin(a) * s * .34);
      ctx.lineTo(x + Math.cos(a) * s * .52, gy - s * .86 + Math.sin(a) * s * .52);
    }
    ctx.stroke();
  },
  dragon(ctx, x, gy, s, g, t) {
    const br = Math.sin(t * .75) * s * .045;
    const bg = ctx.createLinearGradient(0, gy - s * .9, 0, gy);
    bg.addColorStop(0, css(grade(hexRgb("#4f6a5c"), g)));
    bg.addColorStop(1, css(grade(hexRgb("#26332e"), g)));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.5, gy);
    ctx.quadraticCurveTo(x - s * 1.1, gy - s * .78 - br, x - s * .1, gy - s * .70 - br);
    ctx.quadraticCurveTo(x + s * .9, gy - s * .62 - br, x + s * 1.45, gy);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 1.2, gy - s * .3);
    ctx.quadraticCurveTo(x + s * 1.95, gy - s * .5, x + s * 1.75, gy - s * .06);
    ctx.quadraticCurveTo(x + s * 1.5, gy - s * .02, x + s * 1.2, gy - s * .3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#3b5147"), g));
    ctx.beginPath(); ctx.ellipse(x - s * 1.42, gy - s * .30 - br, s * .34, s * .21, -.2, 0, 7); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#6f8a78"), g));
    for (let i = 0; i < 5; i++) {
      const px = x - s * .85 + i * s * .42;
      ctx.beginPath();
      ctx.moveTo(px, gy - s * .70 - br);
      ctx.lineTo(px + s * .1, gy - s * .96 - br);
      ctx.lineTo(px + s * .2, gy - s * .70 - br);
      ctx.closePath(); ctx.fill();
    }
    /* souffle endormi */
    ctx.fillStyle = css(g.sun, .12 + Math.max(0, Math.sin(t * .75)) * .16);
    ctx.beginPath();
    ctx.ellipse(x - s * 1.78, gy - s * .26 - br, s * .3 + Math.max(0, Math.sin(t * .75)) * s * .2, s * .12, 0, 0, 7);
    ctx.fill();
  },
  storm(ctx, x, gy, s, g, t) {
    const cg = ctx.createLinearGradient(0, gy - s * 2.2, 0, gy - s * .3);
    cg.addColorStop(0, css(grade(hexRgb("#4a5261"), g), .95));
    cg.addColorStop(1, css(grade(hexRgb("#6b7382"), g), .5));
    ctx.fillStyle = cg;
    for (let i = 0; i < 4; i++) {
      const cx = x - s * .9 + i * s * .62, cy = gy - s * (1.5 + Math.sin(t * .5 + i) * .1);
      ctx.beginPath(); ctx.ellipse(cx, cy, s * .62, s * .34, 0, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = css(grade(hexRgb("#cfe0f0"), g), .45);
    ctx.lineWidth = s * .028;
    for (let i = 0; i < 14; i++) {
      const rx = x - s * 1.4 + ((i * 61 + t * 220) % (s * 2.8));
      const ry = gy - s * 1.1 + ((i * 37 + t * 400) % (s * 1.1));
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - s * .07, ry + s * .22); ctx.stroke();
    }
    if (Math.sin(t * 1.7) > .93) {
      ctx.strokeStyle = css(hexRgb("#fff6d0"), .9); ctx.lineWidth = s * .05;
      ctx.beginPath();
      ctx.moveTo(x, gy - s * 1.3); ctx.lineTo(x - s * .12, gy - s * .8);
      ctx.lineTo(x + s * .06, gy - s * .82); ctx.lineTo(x - s * .06, gy - s * .3);
      ctx.stroke();
    }
  },
  darkforest(ctx, x, gy, s, g, t) {
    const c = grade(hexRgb("#1c2a26"), g);
    for (let i = 0; i < 7; i++) {
      const tx = x - s * 1.5 + i * s * .5;
      const h = s * (1.3 + ((i * 7) % 5) * .16);
      const sway = Math.sin(t * .8 + i) * s * .02;
      const p = new Path2D();
      drawTree(p, tx + sway, gy, h, i % 2 ? "conifer" : "round", mulberry32(i * 97));
      ctx.fillStyle = css(mixRgb(c, [0,0,0], i / 14));
      ctx.fill(p);
    }
    const fg = ctx.createLinearGradient(0, gy - s * 1.5, 0, gy);
    fg.addColorStop(0, css(grade(hexRgb("#0d1512"), g), .0));
    fg.addColorStop(1, css(grade(hexRgb("#0d1512"), g), .55));
    ctx.fillStyle = fg;
    ctx.fillRect(x - s * 1.7, gy - s * 1.6, s * 3.4, s * 1.6);
    for (let i = 0; i < 3; i++) {
      const ex = x - s * .5 + i * s * .55, ey = gy - s * .7 + Math.sin(t + i * 2) * s * .06;
      ctx.fillStyle = css(g.sun, .5 + Math.sin(t * 2 + i) * .25);
      ctx.beginPath(); ctx.arc(ex, ey, s * .035, 0, 7); ctx.fill();
    }
  },
  avalanche(ctx, x, gy, s, g, t) {
    ctx.fillStyle = css(grade(hexRgb("#e8f0f6"), g));
    ctx.beginPath();
    ctx.moveTo(x - s * 1.6, gy);
    ctx.quadraticCurveTo(x - s * .9, gy - s * 1.25, x + s * .1, gy - s * .9);
    ctx.quadraticCurveTo(x + s * 1.0, gy - s * .6, x + s * 1.5, gy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#c2d6e4"), g));
    ctx.beginPath();
    ctx.moveTo(x - s * 1.2, gy);
    ctx.quadraticCurveTo(x - s * .6, gy - s * .55, x + s * .3, gy - s * .38);
    ctx.quadraticCurveTo(x + s * .9, gy - s * .25, x + s * 1.2, gy);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 16; i++) {
      const px = x - s * 1.5 + ((i * 53 + t * 30) % (s * 3));
      const py = gy - s * 1.0 - ((i * 29 + t * 55) % (s * .7));
      ctx.fillStyle = css(grade(hexRgb("#ffffff"), g), .35);
      ctx.beginPath(); ctx.arc(px, py, s * .05, 0, 7); ctx.fill();
    }
  },
  ice(ctx, x, gy, s, g, t) {
    const ig = ctx.createLinearGradient(0, gy - s * 1.7, 0, gy);
    ig.addColorStop(0, css(grade(hexRgb("#dff0fa"), g), .95));
    ig.addColorStop(1, css(grade(hexRgb("#7fb4cc"), g), .95));
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.moveTo(x - s * .95, gy);
    ctx.lineTo(x - s * .78, gy - s * 1.55);
    ctx.lineTo(x - s * .1, gy - s * 1.75);
    ctx.lineTo(x + s * .62, gy - s * 1.42);
    ctx.lineTo(x + s * .9, gy);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(grade(hexRgb("#ffffff"), g), .5);
    ctx.lineWidth = s * .03;
    ctx.beginPath();
    ctx.moveTo(x - s * .4, gy - s * 1.6); ctx.lineTo(x - s * .18, gy - s * .7); ctx.lineTo(x - s * .42, gy);
    ctx.moveTo(x + s * .3, gy - s * 1.5); ctx.lineTo(x + s * .12, gy - s * .6);
    ctx.stroke();
    ctx.fillStyle = css(g.sun, .1 + Math.sin(t * 1.2) * .05);
    ctx.beginPath(); ctx.ellipse(x, gy - s * .9, s * .5, s * .8, 0, 0, 7); ctx.fill();
  },
  chasm(ctx, x, gy, s, g, t) {
    const w = s * 1.9;
    const cg = ctx.createLinearGradient(0, gy, 0, gy + s * 1.4);
    cg.addColorStop(0, css(grade(hexRgb("#3a3038"), g)));
    cg.addColorStop(1, "rgba(8,8,12,1)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, gy - s * .04);
    ctx.lineTo(x + w / 2, gy - s * .04);
    ctx.lineTo(x + w / 2 - s * .2, gy + s * 1.4);
    ctx.lineTo(x - w / 2 + s * .2, gy + s * 1.4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#6b5a4a"), g));
    ctx.fillRect(x - w / 2 - s * .1, gy - s * .12, s * .28, s * .14);
    ctx.fillRect(x + w / 2 - s * .18, gy - s * .12, s * .28, s * .14);
    for (let i = 0; i < 5; i++) {
      const px = x - w * .3 + ((i * 41 + t * 12) % (w * .7));
      const py = gy + s * .9 - ((i * 33 + t * 26) % (s * 1.0));
      ctx.fillStyle = css(g.sun, .22);
      ctx.beginPath(); ctx.arc(px, py, s * .022, 0, 7); ctx.fill();
    }
  },
  sea(ctx, x, gy, s, g, t) {
    const wg = ctx.createLinearGradient(0, gy - s * .1, 0, gy + s * 1.3);
    wg.addColorStop(0, css(grade(hexRgb("#5aa0c4"), g)));
    wg.addColorStop(1, css(grade(hexRgb("#2a5a7c"), g)));
    ctx.fillStyle = wg;
    ctx.fillRect(x - s * 2.2, gy - s * .06, s * 4.4, s * 1.4);
    ctx.strokeStyle = css(grade(hexRgb("#e4f4fc"), g), .5);
    ctx.lineWidth = s * .035;
    for (let i = 0; i < 5; i++) {
      const yy = gy + s * .1 + i * s * .16;
      const off = Math.sin(t * 1.9 + i * 1.5) * s * .2;
      ctx.beginPath();
      ctx.moveTo(x - s * 1.4 + off, yy);
      ctx.quadraticCurveTo(x + off, yy - s * .07, x + s * 1.3 + off, yy);
      ctx.stroke();
    }
    const bx = x + s * .5, by = gy + s * .12 + Math.sin(t * 1.3) * s * .05;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 1.3) * .05);
    ctx.fillStyle = css(grade(hexRgb("#5c4436"), g));
    ctx.beginPath();
    ctx.moveTo(-s * .34, 0); ctx.lineTo(s * .34, 0);
    ctx.quadraticCurveTo(s * .2, s * .16, -s * .2, s * .16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(grade(hexRgb("#f0e6d4"), g));
    ctx.beginPath();
    ctx.moveTo(0, -s * .62); ctx.lineTo(s * .26, -s * .02); ctx.lineTo(0, -s * .02);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  rockfall(ctx, x, gy, s, g, t) {
    const c1 = grade(hexRgb("#8a7f72"), g), c2 = grade(hexRgb("#5c5248"), g);
    const rocks = [[-.6,-.28,.42],[.14,-.44,.55],[.72,-.24,.38],[-.16,-.86,.3],[.5,-.8,.26]];
    rocks.forEach((r, i) => {
      const rg = ctx.createLinearGradient(0, gy + r[1] * s - r[2] * s, 0, gy + r[1] * s + r[2] * s);
      rg.addColorStop(0, css(mixRgb(c1, hexRgb("#ffffff"), .12)));
      rg.addColorStop(1, css(c2));
      ctx.fillStyle = rg;
      ctx.save();
      ctx.translate(x + r[0] * s, gy + r[1] * s + Math.sin(t * .9 + i) * s * .008);
      ctx.rotate(i * .7);
      ctx.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * Math.PI * 2;
        const rr = r[2] * s * (.78 + ((k * 13) % 5) * .06);
        k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  },
};

/* ---------------------------------------------------------
   La scène
   --------------------------------------------------------- */
function createScene(canvas, opts) {
  opts = opts || {};
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0, H = 0, dpr = 1;
  let camX = 0, camTarget = 0;
  let running = false, raf = 0, last = 0, t = 0;
  let blocked = false, obstacle = null;
  let cheer = 0, jump = 0, walkPhase = 0;
  let particles = [], birds = [], clouds = [];
  let biomeIndex = 0, prevBiome = -1, fadeT = 1;
  let heroAnim = null;
  const reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const STEP_PX = 26;      /* distance parcourue par pas */
  const HERO_X = .34;      /* position écran du héros */

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedAmbience();
  }

  function seedAmbience() {
    const b = BIOMES[biomeIndex];
    particles = [];
    const n = reduce ? 0 : ({ snow: 90, petals: 46, leaves: 40, embers: 54, dust: 40,
                              fireflies: 34, mist: 22, spray: 30, aurora: 0 }[b.amb] || 34);
    for (let i = 0; i < n; i++) particles.push(newParticle(b.amb, true));
    clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({ x: Math.random() * W * 2, y: H * (.08 + Math.random() * .22),
                    s: .5 + Math.random() * .9, o: .18 + Math.random() * .28 });
    }
    birds = [];
    if (!reduce && Math.random() > .35) {
      const bx = W + Math.random() * W, by = H * (.16 + Math.random() * .2);
      for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) {
        birds.push({ x: bx + i * 14 + Math.random() * 8, y: by + (i % 2) * 7 - Math.random() * 5,
                     p: Math.random() * 6 });
      }
    }
  }

  function newParticle(kind, spread) {
    const p = { x: Math.random() * W, y: spread ? Math.random() * H : -8, k: kind };
    if (kind === "snow")      { p.vx = -6 - Math.random() * 8;  p.vy = 12 + Math.random() * 18; p.r = 1 + Math.random() * 1.8; p.o = .5 + Math.random() * .5; }
    else if (kind === "petals"){ p.vx = -14 - Math.random() * 16; p.vy = 14 + Math.random() * 14; p.r = 2 + Math.random() * 2; p.o = .55 + Math.random() * .4; p.a = Math.random() * 6; }
    else if (kind === "leaves"){ p.vx = -20 - Math.random() * 22; p.vy = 16 + Math.random() * 16; p.r = 2.2 + Math.random() * 2.2; p.o = .5 + Math.random() * .4; p.a = Math.random() * 6; }
    else if (kind === "embers"){ p.x = Math.random() * W; p.y = H * (.7 + Math.random() * .35); p.vx = -6 - Math.random() * 10; p.vy = -14 - Math.random() * 22; p.r = .8 + Math.random() * 1.4; p.o = .5 + Math.random() * .5; }
    else if (kind === "fireflies"){ p.y = H * (.45 + Math.random() * .45); p.vx = -3 - Math.random() * 5; p.vy = (Math.random() - .5) * 6; p.r = 1.2 + Math.random() * 1.2; p.o = 0; p.ph = Math.random() * 6; }
    else if (kind === "mist") { p.y = H * (.5 + Math.random() * .4); p.vx = -5 - Math.random() * 7; p.vy = 0; p.r = 26 + Math.random() * 40; p.o = .05 + Math.random() * .07; }
    else if (kind === "spray"){ p.y = H * (.62 + Math.random() * .3); p.vx = -10 - Math.random() * 12; p.vy = -6 - Math.random() * 10; p.r = 1 + Math.random() * 1.6; p.o = .3 + Math.random() * .4; }
    else                      { p.vx = -8 - Math.random() * 10; p.vy = (Math.random() - .5) * 6; p.r = .9 + Math.random() * 1.3; p.o = .18 + Math.random() * .28; }
    return p;
  }

  /* --- boucle --- */
  function frame(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000 || 0);
    last = now; t += dt;

    const diff = camTarget - camX;
    const moving = Math.abs(diff) > .4;
    if (moving) camX += diff * Math.min(1, dt * 2.4);
    else camX = camTarget;
    const walking = moving && !blocked;
    if (walking || (!blocked && opts.alwaysWalk !== false)) walkPhase += dt * 10.1;

    if (cheer > 0) cheer = Math.max(0, cheer - dt * 1.5);
    if (jump > 0)  jump  = Math.max(0, jump  - dt * 1.1);

    const bi = Math.floor(Math.max(0, camX / STEP_PX) / 25) % BIOMES.length;
    if (bi !== biomeIndex) {
      prevBiome = biomeIndex; biomeIndex = bi; fadeT = 0; seedAmbience();
      /* on ne garde en mémoire que le paysage traversé */
      if (global.Scenery) global.Scenery.preload(BIOMES[bi].id).catch(() => {});
    }
    if (fadeT < 1) fadeT = Math.min(1, fadeT + dt / 1.4);

    draw(dt, walking);
    raf = requestAnimationFrame(frame);
  }

  function blend(a, b, k) { return mixRgb(hexRgb(a), hexRgb(b), k); }

  function draw(dt, walking) {
    const g = gradeAt(opts.hour != null ? opts.hour : new Date().getHours() + new Date().getMinutes() / 60);
    const B = BIOMES[biomeIndex];
    const P = prevBiome >= 0 && fadeT < 1 ? BIOMES[prevBiome] : B;
    const k = fadeT;
    const skyTop = grade(blend(P.sky[0], B.sky[0], k), g);
    const skyBot = grade(blend(P.sky[1], B.sky[1], k), g);
    const fog    = grade(blend(P.fog, B.fog, k), g);
    const ground = grade(blend(P.ground, B.ground, k), g);
    const pathC  = grade(blend(P.path, B.path, k), g);
    /* Ligne d'horizon haute : le bandeau de verre occupe le bas du cadre,
       le voyageur doit rester entièrement visible au-dessus. */
    const gy = H * .615;

    /* ciel */
    const sg = ctx.createLinearGradient(0, 0, 0, gy);
    sg.addColorStop(0, css(skyTop)); sg.addColorStop(1, css(skyBot));
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, gy + 1);

    /* étoiles */
    if (g.star > .02) {
      const rng = mulberry32(1337);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        const sx = rng() * W, sy = rng() * gy * .8, sr = rng();
        ctx.globalAlpha = g.star * (.25 + sr * .6) * (.6 + Math.sin(t * 1.4 + i) * .4);
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }

    /* aurore boréale */
    if (B.amb === "aurora" && !reduce) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const ag = ctx.createLinearGradient(0, gy * .12, 0, gy * .72);
        ag.addColorStop(0, "rgba(90,240,190,0)");
        ag.addColorStop(.45, "rgba(90,240,190," + (.16 - i * .03) + ")");
        ag.addColorStop(1, "rgba(120,140,255,0)");
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.moveTo(-40, gy * .7);
        for (let x = -40; x <= W + 40; x += 24) {
          ctx.lineTo(x, gy * .28 + Math.sin(x / 90 + t * .35 + i * 1.6) * 26 + i * 16);
        }
        ctx.lineTo(W + 40, gy * .74); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    /* soleil / lune + halo */
    const sunX = W * .78, sunY = gy * g.sunY;
    const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * .55);
    halo.addColorStop(0, css(g.sun, .55));
    halo.addColorStop(.35, css(g.sun, .13));
    halo.addColorStop(1, css(g.sun, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sunX, sunY, H * .55, 0, 7); ctx.fill();
    ctx.fillStyle = css(mixRgb(g.sun, [255,255,255], .45), .95);
    ctx.beginPath(); ctx.arc(sunX, sunY, H * (g.star > .5 ? .038 : .046), 0, 7); ctx.fill();

    /* rayons volumétriques */
    if (!reduce && g.star < .6) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const a = -1.15 + i * .17 + Math.sin(t * .12 + i) * .022;
        const len = H * 1.6, spread = .030 + (i % 2) * .014;
        /* le rayon s'éteint en s'éloignant : pas de triangle net */
        const rg = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(a) * len, sunY + Math.sin(a) * len);
        rg.addColorStop(0, css(g.sun, .05));
        rg.addColorStop(.45, css(g.sun, .022));
        rg.addColorStop(1, css(g.sun, 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a - spread) * len, sunY + Math.sin(a - spread) * len);
        ctx.lineTo(sunX + Math.cos(a + spread) * len, sunY + Math.sin(a + spread) * len);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    /* nuages — volutes douces teintées du ciel, jamais des blobs opaques */
    const cloudC = mixRgb(mixRgb(skyTop, skyBot, .5), [255, 255, 255], .58);
    clouds.forEach(c => {
      c.x -= (4 + c.s * 5) * dt;
      if (c.x < -200 * c.s) { c.x = W + 60 + Math.random() * W * .6; c.y = H * (.06 + Math.random() * .24); }
      const cw = 62 * c.s, ch = 15 * c.s;
      const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, cw);
      cg.addColorStop(0, css(cloudC, c.o * .75));
      cg.addColorStop(.55, css(cloudC, c.o * .42));
      cg.addColorStop(1, css(cloudC, 0));
      ctx.fillStyle = cg;
      ctx.save();
      ctx.translate(c.x, c.y); ctx.scale(1, ch / cw); ctx.translate(-c.x, -c.y);
      ctx.beginPath(); ctx.arc(c.x, c.y, cw, 0, 7); ctx.fill();
      ctx.restore();
      const cg2 = ctx.createRadialGradient(c.x + cw * .4, c.y - ch * .3, 0, c.x + cw * .4, c.y - ch * .3, cw * .55);
      cg2.addColorStop(0, css(cloudC, c.o * .55));
      cg2.addColorStop(1, css(cloudC, 0));
      ctx.fillStyle = cg2;
      ctx.save();
      ctx.translate(c.x + cw * .4, c.y - ch * .3); ctx.scale(1, .62); ctx.translate(-(c.x + cw * .4), -(c.y - ch * .3));
      ctx.beginPath(); ctx.arc(c.x + cw * .4, c.y - ch * .3, cw * .55, 0, 7); ctx.fill();
      ctx.restore();
    });

    /* oiseaux */
    if (birds.length) {
      ctx.strokeStyle = css(mixRgb(fog, [30,36,48], .62), .55);
      ctx.lineWidth = 1.4; ctx.lineCap = "round";
      birds.forEach(b => {
        b.x -= 22 * dt; b.p += dt * 7;
        const fl = Math.sin(b.p) * 3;
        ctx.beginPath();
        ctx.moveTo(b.x - 4, b.y + fl);
        ctx.quadraticCurveTo(b.x, b.y - 1.5, b.x + 4, b.y + fl);
        ctx.stroke();
      });
      if (birds[0].x < -30) birds = [];
    }

    /* couches de décor — repère remis à l'échelle de la ligne d'horizon */
    const HV = gy / .80;
    const layers = B.layers;
    for (let li = 0; li < layers.length; li++) {
      const L = layers[li];
      const pl = P.layers[Math.min(li, P.layers.length - 1)];
      const col = grade(mixRgb(hexRgb(pl.c), hexRgb(L.c), k), g);
      const fill = mixRgb(col, fog, L.f);
      const tileW = W;
      const off = -(camX * L.s) % tileW;
      /* Volume + dissolution du plan au sol.
         Sans ce fondu, les couches s'empilent en bandes horizontales dures :
         c'est ce qui distingue un décor peint d'un empilement de rectangles. */
      const topY = layerTopY(L, HV);
      const baseY = L.y * HV;
      const fadeEnd = baseY + Math.max(8, gy - baseY) * 1.25 + H * .04;
      const lg = ctx.createLinearGradient(0, topY, 0, fadeEnd);
      const kBase = clamp((baseY - topY) / (fadeEnd - topY), .02, .96);
      lg.addColorStop(0, css(mixRgb(fill, [255, 255, 255], .12), 1));
      lg.addColorStop(kBase, css(fill, 1));
      lg.addColorStop(lerp(kBase, 1, .18), css(mixRgb(fill, fog, .30), .55));
      lg.addColorStop(lerp(kBase, 1, .52), css(mixRgb(fill, fog, .5), .18));
      lg.addColorStop(1, css(mixRgb(fill, fog, .6), 0));
      ctx.fillStyle = lg;

      /* ---- décor illustré, quand les planches sont livrées ----
         Le plan au sol reste peint par le moteur : c'est lui qui fond la
         couche dans la suivante. Seule la silhouette devient une image. */
      const SC = global.Scenery;
      const bandIm = SC && SC.ready ? SC.band(B.id, li) : null;
      const propIm = SC && SC.ready && L.t === "forest" && SC.usesProps(B.id)
        ? SC.props(L.kind) : null;
      if (bandIm || propIm) {
        ctx.fillRect(0, baseY - 1, W, HV * 3 - baseY);
        if (bandIm) {
          const bh = (L.a || L.h || .12) * HV * 1.9;
          SC.drawBand(ctx, SC.tinted(bandIm, g.amb, fog, L.f * .8, .22),
            baseY, bh, camX * L.s, W);
        } else {
          const altIm = SC.props(altKind(L.kind));
          const th0 = (L.h || .12) * HV * treeMul(L);
          for (let ti = -1; ti <= 1; ti++) {
            const tileIndex = Math.floor((camX * L.s) / tileW) + ti;
            const rng = mulberry32(seedOf(B.id + "|" + li + "|" + tileIndex +
              "|" + (tileW | 0) + "x" + (HV | 0)));
            const n = L.n || 12;
            for (let i = 0; i < n; i++) {
              const px = (i + .5) / n * tileW + (rng() - .5) * (tileW / n) * .62;
              const s = .62 + rng() * .74;
              const useAlt = rng() > .74 && altIm;
              const pool = useAlt ? altIm : propIm;
              const im = pool[(rng() * pool.length) | 0];
              const dy = (rng() - .5) * th0 * .12;
              const th = th0 * s, tw = im.width * (th / im.height);
              const tim = SC.tinted(im, g.amb, fog, L.f * .8);
              ctx.drawImage(tim, off + ti * tileW + px - tw / 2,
                baseY + dy - th, tw, th);
            }
          }
        }
      }

      for (let ti = -1; ti <= 1 && !(bandIm || propIm); ti++) {
        const tileIndex = Math.floor((camX * L.s) / tileW) + ti;
        const p = tilePath(B.id, li, L, tileIndex, tileW, HV);
        ctx.save();
        ctx.translate(off + ti * tileW, 0);
        ctx.fill(p);
        /* névés */
        if (L.snow) {
          ctx.save();
          ctx.clip(p);
          const peak = (L.y - L.a) * HV;
          const sgd = ctx.createLinearGradient(0, peak, 0, peak + L.a * HV * .78);
          const snowC = mixRgb(grade(hexRgb("#ffffff"), g), fog, L.f * .40);
          sgd.addColorStop(0, css(snowC, Math.min(1, L.snow + .35)));
          sgd.addColorStop(.55, css(snowC, L.snow * .5));
          sgd.addColorStop(1, css(snowC, 0));
          ctx.fillStyle = sgd;
          ctx.fillRect(0, peak - 4, tileW, L.a * HV + 8);
          ctx.restore();
        }
        /* reflet sur l'eau */
        if (L.t === "sea") {
          ctx.save(); ctx.clip(p);
          ctx.strokeStyle = css(mixRgb(g.sun, [255,255,255], .3), .30);
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 7; i++) {
            const yy = L.y * HV + 5 + i * 6;
            const ww = (60 - i * 6) * (.7 + Math.sin(t * 1.6 + i) * .3);
            ctx.beginPath();
            ctx.moveTo(sunX - ww / 2, yy); ctx.lineTo(sunX + ww / 2, yy); ctx.stroke();
          }
          ctx.restore();
        }
        /* Liseré solaire le long de l'arête : c'est cet accroche-lumière
           qui « décolle » chaque plan et donne le rendu peint.
           Réservé aux silhouettes d'un seul tenant. Sur une forêt — des
           dizaines de formes distinctes réunies dans un même chemin — il
           détourerait chaque arbre, y compris ceux masqués par les autres,
           et la rangée virerait au fil de fer. */
        const rimOK = L.t === "ridge" || L.t === "hills" || L.t === "dunes"
                   || L.t === "mesa"  || L.t === "sea";
        if (rimOK && L.f < .6) {
          ctx.save();
          ctx.clip(p);
          const rimC = mixRgb(g.sun, [255, 255, 255], .25);
          ctx.strokeStyle = css(rimC, .30 * (1 - L.f));
          ctx.lineWidth = 2.2;
          ctx.stroke(p);
          ctx.restore();
        }
        ctx.restore();
      }
      /* voile de brouillard entre les couches */
      if (L.f > .2) {
        const band = ctx.createLinearGradient(0, (L.y - .13) * HV, 0, (L.y + .16) * HV);
        band.addColorStop(0, css(fog, 0));
        band.addColorStop(.45, css(fog, L.f * .22));
        band.addColorStop(1, css(fog, 0));
        ctx.fillStyle = band;
        ctx.fillRect(0, (L.y - .13) * HV, W, HV * .29);
      }
    }

    /* sol */
    const gg = ctx.createLinearGradient(0, gy - 6, 0, H);
    gg.addColorStop(0, css(mixRgb(ground, fog, .18)));
    gg.addColorStop(1, css(mixRgb(ground, [0,0,0], .22)));
    ctx.fillStyle = gg; ctx.fillRect(0, gy - 2, W, H - gy + 2);

    /* sentier */
    ctx.fillStyle = css(pathC, .92);
    ctx.beginPath();
    ctx.moveTo(0, gy + H * .035);
    ctx.quadraticCurveTo(W * .5, gy + H * .022, W, gy + H * .035);
    ctx.lineTo(W, gy + H * .105);
    ctx.quadraticCurveTo(W * .5, gy + H * .092, 0, gy + H * .105);
    ctx.closePath(); ctx.fill();

    /* Premier plan : silhouettes sombres défilant vite, juste devant le
       sentier. C'est la couche qui crée la sensation de profondeur. */
    if (!reduce) {
      const fgOff = -(camX * 1.55) % 220;
      ctx.fillStyle = css(mixRgb(ground, [10, 14, 22], .58), .9);
      for (let ti = -1; ti <= 2; ti++) {
        const ox = fgOff + ti * 220;
        const rngF = mulberry32(seedOf(B.id + "fg" + (Math.floor((camX * 1.55) / 220) + ti)));
        for (let i = 0; i < 5; i++) {
          const px = ox + rngF() * 220;
          const s = (.5 + rngF() * .9) * H * .055;
          const sway = Math.sin(t * 1.7 + px * .05) * s * .16;
          ctx.beginPath();
          if (rngF() > .45) {
            /* touffe d'herbe */
            for (let b = -2; b <= 2; b++) {
              ctx.moveTo(px + b * s * .13, gy + H * .105);
              ctx.quadraticCurveTo(px + b * s * .2 + sway * .5, gy + H * .105 - s * .6,
                                   px + b * s * .30 + sway, gy + H * .105 - s);
              ctx.quadraticCurveTo(px + b * s * .16, gy + H * .105 - s * .5, px + b * s * .13 + s * .06, gy + H * .105);
            }
          } else {
            /* caillou */
            ctx.ellipse(px, gy + H * .10, s * .45, s * .26, 0, Math.PI, 0);
          }
          ctx.fill();
        }
      }
    }

    /* obstacle */
    const heroX = W * HERO_X;
    if (blocked && obstacle && OB_DRAW[obstacle]) {
      ctx.save();
      OB_DRAW[obstacle](ctx, W * .74, gy + H * .052, H * .125, g, t);
      ctx.restore();
    }

    /* le Héros — sprites HD si disponibles, rendu vectoriel sinon */
    if (opts.look) {
      const mounted = opts.look.mount && opts.look.mount !== "none";
      const spriteMode = global.Sprites && global.Sprites.ready;
      /* Taille du héros. Il doit rester lisible sans écraser le paysage :
         au-delà d'un quart de la hauteur d'image, les arbres deviennent des
         buissons et la profondeur s'effondre. */
      const hx2 = heroX, hy2 = gy + H * .080,
            hh = H * (mounted ? .215 : (spriteMode ? .235 : .21));

      /* Ombre de contact. C'est elle qui pose le personnage au sol : sans
         elle, l'illustration paraît collée par-dessus le décor. Elle
         rétrécit et pâlit dès qu'il quitte le sol. */
      const airJ = jump > .02 ? Math.sin(jump * Math.PI) : 0;
      const airC = cheer > .02 ? Math.abs(Math.sin(cheer * Math.PI * 2)) : 0;
      const air = clamp(Math.max(airJ, airC * .55), 0, 1);
      const shR = hh * .34 * (1 - air * .30);
      const shA = .34 * (1 - air * .60) * (1 - g.star * .45);
      ctx.save();
      ctx.translate(hx2, hy2 + hh * .012);
      ctx.scale(1, .26);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, shR);
      sg.addColorStop(0, "rgba(18,24,32," + shA.toFixed(3) + ")");
      sg.addColorStop(.55, "rgba(18,24,32," + (shA * .45).toFixed(3) + ")");
      sg.addColorStop(1, "rgba(18,24,32,0)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(0, 0, shR, 0, 7); ctx.fill();
      ctx.restore();
      const hState = { t, walk: (walking && !blocked) ? 1 : 0, run: false,
                       phase: walkPhase, jump, cheer,
                       resting: blocked && !walking, sleeping: false, anim: heroAnim };
      const hEnv = { sun: g.sun, amb: g.amb, night: g.star, wind: .5 + Math.sin(t * .3) * .3 };
      const done = spriteMode
        && global.Sprites.draw(ctx, hx2, hy2, hh, opts.look, hState, hEnv, dt);
      heroAnim = hState.anim;
      if (!done && global.Hero) global.Hero.draw(ctx, hx2, hy2, hh, opts.look,
        { t, walk: hState.walk, phase: walkPhase, jump, cheer }, hEnv);
    }

    /* Tout premier plan, DEVANT le héros. Sans une couche qui le recouvre,
       il reste posé au-dessus de toute l'image au lieu d'être dedans. */
    if (!reduce) {
      const nOff = -(camX * 2.3) % 300;
      const SCf = global.Scenery;
      const grassIm = SCf && SCf.ready && SCf.usesProps(B.id) ? SCf.prop("grass") : null;
      ctx.fillStyle = css(mixRgb(ground, [8, 12, 20], .72), .95);
      for (let ti = -1; ti <= 2; ti++) {
        const ox = nOff + ti * 300;
        const rngN = mulberry32(seedOf(B.id + "nf" + (Math.floor((camX * 2.3) / 300) + ti)));
        for (let i = 0; i < 3; i++) {
          const px = ox + rngN() * 300;
          const s = (.7 + rngN() * .7) * H * .078;
          /* Enraciné juste sous le sentier : les brins doivent croiser les
             bottes du héros, sinon la couche ne recouvre rien. */
          const by = gy + H * .112;
          if (grassIm) {
            /* au premier plan, on assombrit franchement : c'est le contraste
               de valeur qui crée la profondeur, pas le détail */
            const gh = s, gw = grassIm.width * (gh / grassIm.height);
            ctx.drawImage(SCf.tinted(grassIm,
              [g.amb[0] * .62, g.amb[1] * .64, g.amb[2] * .68], fog, 0),
              px - gw / 2, by - gh, gw, gh);
            continue;
          }
          const sway = Math.sin(t * 1.4 + px * .04) * s * .10;
          ctx.beginPath();
          for (let b = -3; b <= 3; b++) {
            ctx.moveTo(px + b * s * .11, by);
            ctx.quadraticCurveTo(px + b * s * .17 + sway * .5, by - s * .62,
                                 px + b * s * .26 + sway, by - s);
            ctx.quadraticCurveTo(px + b * s * .14, by - s * .5,
                                 px + b * s * .11 + s * .05, by);
          }
          ctx.fill();
        }
      }
    }

    /* particules */
    if (particles.length) {
      const b = BIOMES[biomeIndex];
      particles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === "petals" || p.k === "leaves") { p.a += dt * 2.2; p.x += Math.sin(p.a) * 12 * dt; }
        if (p.k === "fireflies") { p.ph += dt * 1.6; p.o = (Math.sin(p.ph) * .5 + .5) * .85; p.y += Math.sin(p.ph * .7) * 8 * dt; }
        if (p.x < -60 || p.y > H + 20 || p.y < -60) Object.assign(p, newParticle(b.amb, false), { x: W + Math.random() * 40 });
        if (p.k === "mist") {
          const mg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          mg.addColorStop(0, css(fog, p.o)); mg.addColorStop(1, css(fog, 0));
          ctx.fillStyle = mg;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        } else if (p.k === "embers") {
          ctx.fillStyle = "rgba(255," + (96 + ((p.r * 34) | 0)) + ",48," + (p.o * .72) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .85, 0, 7); ctx.fill();
        } else if (p.k === "fireflies") {
          ctx.fillStyle = "rgba(210,255,170," + p.o + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        } else if (p.k === "petals" || p.k === "leaves") {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
          ctx.fillStyle = p.k === "petals"
            ? css(grade(hexRgb("#ffc8dd"), g), p.o)
            : css(grade(hexRgb("#d98a3e"), g), p.o);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.7, p.r * .85, 0, 0, 7); ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = css(mixRgb(grade(hexRgb("#ffffff"), g), fog, .25), p.o);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        }
      });
    }

    /* étincelles de célébration */
    if (cheer > 0) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + cheer * 3;
        const r = (1 - cheer) * H * .17;
        ctx.fillStyle = css(mixRgb(g.sun, [255,255,255], .35), cheer * .85);
        ctx.beginPath();
        ctx.arc(heroX + Math.cos(a) * r, gy - H * .05 + Math.sin(a) * r * .6, 1.6 + cheer * 1.6, 0, 7);
        ctx.fill();
      }
    }

    /* étalonnage final : vignette + voile de lumière */
    const vg = ctx.createRadialGradient(W * .5, H * .45, H * .28, W * .5, H * .5, H * .95);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(10,14,22,.34)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const bloom = ctx.createLinearGradient(sunX, sunY, sunX - W * .5, sunY + H * .5);
    bloom.addColorStop(0, css(g.sun, .10));
    bloom.addColorStop(1, css(g.sun, 0));
    ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);
  }

  /* --- API --- */
  const api = {
    resize,
    start() {
      if (running) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    setSteps(steps, instant) {
      camTarget = steps * STEP_PX;
      if (instant) {
        camX = camTarget;
        biomeIndex = Math.floor(steps / 25) % BIOMES.length;
        prevBiome = -1; fadeT = 1;
        seedAmbience();
      }
    },
    setBlocked(b, kind) { blocked = b; obstacle = kind || null; },
    celebrate() { cheer = 1; },
    leap() { jump = 1; },
    biomeAt(steps) { return BIOMES[Math.floor(steps / 25) % BIOMES.length]; },
    tourAt(steps) { return Math.floor(steps / (25 * BIOMES.length)); },
    phaseLabel() {
      return gradeAt(opts.hour != null ? opts.hour : new Date().getHours() + new Date().getMinutes() / 60).label;
    },
    setLook(l) {
      opts.look = l;
      if (global.Sprites) global.Sprites.preload(l).catch(() => {});
    },
    STEP_PX,
  };
  resize();
  return api;
}

global.Odyssey = { BIOMES, createScene, gradeAt };

})(window);
