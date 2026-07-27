/* =========================================================
   Odyssée — pipeline de sprites
   Charge des atlas PNG + JSON conformes à DESIGN.md §7,
   compose les couches dans l'ordre z, joue la machine
   d'états d'animation et applique la lumière du biome.

   Si aucun manifeste n'est présent dans assets/hero/, le
   module reste inactif et le moteur retombe sur le rendu
   vectoriel (hero.js). Aucune erreur, aucun écran vide.

   Expose : window.Sprites
   ========================================================= */
(function (global) {
"use strict";

const BASE = "assets/hero/";
const SLOT_Z = {
  mount: 0, capeBack: 10, pack: 20, body: 30, outfit: 35,
  boots: 40, hairBack: 50, head: 60, hairFront: 70,
  scarf: 80, capeFront: 90, lantern: 95,
};

let ready = false;          /* au moins un atlas chargé */
let manifest = null;
const atlases = new Map();  /* id -> { img, meta } */
let probed = false;

/* ---------------------------------------------------------
   Chargement
   --------------------------------------------------------- */
function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function resolveId(id) {
  const al = manifest && manifest.aliases;
  return (al && al[id]) || id;
}

async function loadAtlas(id) {
  id = resolveId(id);
  if (atlases.has(id)) return atlases.get(id);
  const meta = await fetch(BASE + id + ".json").then(r => {
    if (!r.ok) throw new Error("atlas absent : " + id);
    return r.json();
  });
  const img = await loadImage(BASE + (meta.image || id + ".png"));
  const a = { img, meta };
  atlases.set(id, a);
  return a;
}

/* Sonde une seule fois : le manifeste existe-t-il ? */
/* Sonde le manifeste. Un échec ne doit pas être définitif : réseau
   capricieux, worker en cours d'installation… on retente au chargement
   suivant plutôt que de rester bloqué sur le rendu de secours. */
async function probe() {
  if (probed) return ready;
  try {
    const r = await fetch(BASE + "manifest.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("manifeste " + r.status);
    manifest = await r.json();
    ready = Array.isArray(manifest.sets) && manifest.sets.length > 0;
    probed = ready;
  } catch (e) {
    ready = false;   /* attendu tant qu'aucun asset n'est livré */
  }
  return ready;
}

/* Précharge les couches nécessaires à un look donné */
async function preload(look) {
  if (!await probe()) return false;
  const ids = slotIds(look);
  const got = await Promise.allSettled(ids.map(o => loadAtlas(o.id)));
  return got.some(g => g.status === "fulfilled");
}

/* Traduit un look en liste de couches à composer */
function slotIds(look) {
  const out = [];
  const add = (slot, id) => { if (id && id !== "none") out.push({ slot, id }); };
  add("mount", look.mount && look.mount !== "none" ? "mount_" + look.mount : null);
  add("capeBack", look.cape && look.cape !== "none" ? "cape_" + look.cape + "_back" : null);
  add("pack", look.pack && look.pack !== "none" ? "pack_" + look.pack : null);
  add("body", "body_" + (look.body || "n"));
  add("outfit", "outfit_" + (look.outfit || "tunic"));
  add("boots", look.boots ? "boots_" + look.boots : null);
  add("hairBack", "hair_" + (look.hair || "wavy") + "_back");
  add("head", "head_" + (look.body || "n"));
  add("hairFront", "hair_" + (look.hair || "wavy") + "_front");
  add("scarf", look.scarf ? "scarf_" + look.scarf : null);
  add("capeFront", look.cape && look.cape !== "none" ? "cape_" + look.cape + "_front" : null);
  /* `available` évite de solliciter des atlas qu'on sait absents */
  const avail = manifest && manifest.available;
  const keep = avail
    ? out.filter(o => avail.indexOf(resolveId(o.id)) !== -1)
    : out;
  return keep
    .map(o => ({ slot: o.slot, id: resolveId(o.id) }))
    .sort((a, b) => (SLOT_Z[a.slot] || 50) - (SLOT_Z[b.slot] || 50));
}

/* ---------------------------------------------------------
   Machine d'états d'animation
   --------------------------------------------------------- */
function makeState() {
  return { name: "idle", t: 0, queue: null, lookTimer: 4 + Math.random() * 5 };
}

/* Choisit l'animation d'après l'état de jeu, avec priorités */
function resolve(st, ctxState, dt) {
  /* une animation ponctuelle en cours a priorité */
  if (st.queue) {
    st.t += dt;
    const d = st.queue.dur;
    if (st.t >= d) { st.queue = null; st.t = 0; }
    else return st.queue.name;
  }
  if (ctxState.cheer > .02) { st.queue = { name: "cheer", dur: 1.2 }; st.t = 0; return "cheer"; }
  if (ctxState.jump > .02)  { st.queue = { name: "jump",  dur: 1.0 }; st.t = 0; return "jump"; }
  if (ctxState.walk > .02)  { st.lookTimer = 5 + Math.random() * 4; return ctxState.run ? "run" : "walk"; }
  if (ctxState.sleeping)    return "sleep";
  if (ctxState.resting)     return "sit";
  st.lookTimer -= dt;
  if (st.lookTimer <= 0) { st.queue = { name: "look", dur: 2.0 }; st.t = 0; st.lookTimer = 6 + Math.random() * 4; return "look"; }
  return "idle";
}

/* ---------------------------------------------------------
   Rendu
   --------------------------------------------------------- */
function drawLayer(ctx, a, anim, timeSec, x, y, height) {
  const m = a.meta;
  const A = (m.animations && (m.animations[anim] || m.animations.idle));
  if (!A) return;
  const n = Math.max(1, A.frames | 0);
  const fps = A.fps || 12;
  let f = Math.floor(timeSec * fps);
  f = A.loop === false ? Math.min(n - 1, f) : f % n;

  const sw = m.frameW, sh = m.frameH;
  const sx = f * sw, sy = (A.row || 0) * sh;
  const scale = height / (sh * (m.heightRatio || 1));
  const dw = sw * scale, dh = sh * scale;
  const dx = x - dw * (m.anchorX == null ? .5 : m.anchorX);
  const dy = y - dh * (m.anchorY == null ? .94 : m.anchorY);
  ctx.drawImage(a.img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/* Applique le grade lumineux du biome sur le sprite composé.
   On compose hors écran puis on teinte : c'est ce qui intègre
   le personnage au décor (DESIGN.md §6). */
let buf = null, bctx = null;
function ensureBuf(w, h) {
  if (!buf) { buf = document.createElement("canvas"); bctx = buf.getContext("2d"); }
  if (buf.width !== w || buf.height !== h) { buf.width = w; buf.height = h; }
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.clearRect(0, 0, w, h);
  return bctx;
}

function draw(ctx, x, y, height, look, state, env, dt) {
  if (!ready) return false;
  const layers = slotIds(look).map(o => atlases.get(o.id)).filter(Boolean);
  if (!layers.length) return false;

  if (!state.anim) state.anim = makeState();
  const name = resolve(state.anim, state, dt || .016);
  const time = state.anim.queue ? state.anim.t : state.t;

  /* Élévation : les planches de saut et de joie montrent une pose en l'air,
     c'est le moteur qui fournit la hauteur — et un léger balancement pendant
     la marche, sans quoi une image fixe qui glisse paraît figée. */
  let lift = 0;
  if (state.jump > .02)  lift -= Math.sin(state.jump * Math.PI) * height * .55;
  if (state.cheer > .02) lift -= Math.abs(Math.sin(state.cheer * Math.PI * 2)) * height * .30;
  if (state.walk > .02)  lift -= Math.abs(Math.sin((state.phase || 0) * .5)) * height * .022;
  /* Respiration. Les planches sont des poses fixes : sans ce souffle, un
     héros à l'arrêt paraît en pause plutôt que vivant. */
  else lift -= (Math.sin((state.t || 0) * 1.5) * .5 + .5) * height * .009;

  /* zone de travail généreuse : cape et monture débordent du corps */
  const pad = height * .9;
  const w = Math.ceil(height * 2.2), h = Math.ceil(height * 1.8);
  const b = ensureBuf(w, h);
  const ox = w * .5, oy = h - pad * .18;
  for (const a of layers) drawLayer(b, a, name, time, ox, oy + lift, height);

  /* teinte ambiante en multiplication + liseré solaire */
  const amb = env.amb || [1, 1, 1];
  if (amb[0] < .99 || amb[1] < .99 || amb[2] < .99) {
    b.globalCompositeOperation = "multiply";
    b.fillStyle = "rgb(" + (amb[0] * 255 | 0) + "," + (amb[1] * 255 | 0) + "," + (amb[2] * 255 | 0) + ")";
    b.fillRect(0, 0, w, h);
    b.globalCompositeOperation = "destination-in";
    for (const a of layers) drawLayer(b, a, name, time, ox, oy + lift, height);
    b.globalCompositeOperation = "source-over";
  }
  /* voile solaire — « source-atop » pour ne teinter que le sprite :
     en « lighter », la passe colorerait aussi le fond transparent. */
  const sun = env.sun || [255, 245, 220];
  b.globalCompositeOperation = "source-atop";
  b.globalAlpha = .10;
  b.fillStyle = "rgb(" + (sun[0] | 0) + "," + (sun[1] | 0) + "," + (sun[2] | 0) + ")";
  b.fillRect(0, 0, w, h);
  b.globalAlpha = 1;
  b.globalCompositeOperation = "source-over";

  ctx.drawImage(buf, x - ox, y - oy);
  return true;
}

global.Sprites = {
  probe, preload, draw, makeState,
  get ready() { return ready; },
  get manifest() { return manifest; },
  SLOT_Z,
};

})(window);
