/* =========================================================
   Odyssée — décors illustrés

   Charge les bandes de paysage et les objets isolés livrés
   dans assets/scenery/, et les rend prêts à composer :
   teintés par la lumière du moment et noyés dans la brume
   selon leur distance, exactement comme les silhouettes
   procédurales qu'ils remplacent.

   Si aucun manifeste n'est présent, le module reste inactif
   et world.js continue de dessiner ses silhouettes. Aucune
   erreur, aucun écran vide.

   Expose : window.Scenery
   ========================================================= */
(function (global) {
"use strict";

const BASE = "assets/scenery/";

let ready = false;
let manifest = null;
let probed = false;
const imgs = new Map();      /* nom -> Image */
const tints = new Map();     /* clé -> canvas teinté */

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

async function probe() {
  if (probed) return ready;
  try {
    const r = await fetch(BASE + "manifest.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("manifeste " + r.status);
    manifest = await r.json();
    ready = !!manifest && Array.isArray(manifest.props);
    probed = ready;   /* un échec n'est pas définitif : on retentera */
  } catch (e) {
    ready = false;
  }
  return ready;
}

async function one(name) {
  if (imgs.has(name)) return imgs.get(name);
  const im = await loadImage(BASE + name + ".webp");
  /* le cache de teinte a besoin d'identifier l'image, sans quoi trois
     variantes d'arbre partagent la même entrée et deviennent identiques */
  im.__name = name;
  imgs.set(name, im);
  return im;
}

/* Charge les objets partagés et les bandes du biome demandé. Les autres
   biomes ne sont jamais sollicités : c'est ce qui tient le poids. */
async function preload(biomeId) {
  if (!await probe()) return false;
  const want = manifest.props.map(p => "prop_" + p);
  const bands = (manifest.bands || {})[biomeId] || [];
  bands.forEach(b => want.push("band_" + biomeId + "_" + b));
  const got = await Promise.allSettled(want.map(one));
  return got.some(g => g.status === "fulfilled");
}

/* ---------------------------------------------------------
   Interrogation
   --------------------------------------------------------- */
/* Un biome n'utilise les illustrations que s'il y a droit : appliquer des
   feuillus verts à une cerisaie en fleurs serait pire que le procédural. */
function usesProps(biomeId) {
  return ready && (manifest.propBiomes || []).indexOf(biomeId) !== -1;
}
function band(biomeId, li) {
  if (!ready) return null;
  const list = (manifest.bands || {})[biomeId];
  if (!list || !list[li]) return null;
  return imgs.get("band_" + biomeId + "_" + list[li]) || null;
}
function props(kind) {
  if (!ready) return null;
  const names = (manifest.kinds || {})[kind];
  if (!names) return null;
  const out = names.map(n => imgs.get("prop_" + n)).filter(Boolean);
  return out.length ? out : null;
}
function prop(name) { return ready ? imgs.get("prop_" + name) || null : null; }

/* ---------------------------------------------------------
   Teinte
   Les illustrations arrivent en lumière neutre. C'est ici qu'on
   leur applique le grade du moment et la brume de distance —
   sinon un arbre resterait vert vif en pleine nuit.

   Le résultat est mis en cache : la lumière évolue à l'échelle
   de la minute, il serait absurde de recomposer à chaque image.
   --------------------------------------------------------- */
const q = v => Math.round(v * 16) / 16;

function tinted(im, amb, fog, f, fade) {
  const a0 = q(amb[0]), a1 = q(amb[1]), a2 = q(amb[2]);
  const fq = Math.round(f * 16) / 16;
  const fd = fade || 0;
  const key = (im.__name || "?") + "|" + a0 + "," + a1 + "," + a2 + "|" + fq +
              "|" + (fog[0] | 0) + "," + (fog[1] | 0) + "," + (fog[2] | 0) + "|" + fd;
  let c = tints.get(key);
  if (c) return c;

  c = document.createElement("canvas");
  c.width = im.width; c.height = im.height;
  const x = c.getContext("2d");
  x.drawImage(im, 0, 0);

  if (a0 < .99 || a1 < .99 || a2 < .99) {
    x.globalCompositeOperation = "multiply";
    x.fillStyle = "rgb(" + (a0 * 255 | 0) + "," + (a1 * 255 | 0) + "," + (a2 * 255 | 0) + ")";
    x.fillRect(0, 0, c.width, c.height);
    /* le multiply déborde sur le vide : on redécoupe sur l'alpha d'origine */
    x.globalCompositeOperation = "destination-in";
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = "source-over";
  }
  if (fq > .01) {
    x.globalCompositeOperation = "source-atop";
    x.fillStyle = "rgba(" + (fog[0] | 0) + "," + (fog[1] | 0) + "," + (fog[2] | 0) + "," + fq + ")";
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = "source-over";
  }

  /* Une bande découpée dans un rectangle a un bas parfaitement droit, qui
     tranche sur le plan au sol. On la dissout sur sa dernière frange : la
     base du relief se noie dans la brume, comme dans le rendu procédural. */
  if (fd > 0) {
    const y0 = c.height * (1 - fd);
    const gd = x.createLinearGradient(0, y0, 0, c.height);
    gd.addColorStop(0, "rgba(0,0,0,0)");
    gd.addColorStop(1, "rgba(0,0,0,1)");
    x.globalCompositeOperation = "destination-out";
    x.fillStyle = gd;
    x.fillRect(0, y0, c.width, c.height - y0);
    x.globalCompositeOperation = "source-over";
  }

  if (tints.size > 80) tints.clear();
  tints.set(key, c);
  return c;
}

/* ---------------------------------------------------------
   Bande de paysage, répétée en miroir
   Le miroir garantit un raccord sans couture quelle que soit
   la planche livrée : aucune contrainte sur le générateur.
   --------------------------------------------------------- */
function drawBand(ctx, im, baseY, height, scroll, W) {
  const th = height, tw = im.width * (th / im.height);
  if (!(tw > 1)) return;
  const idx = Math.floor(scroll / tw);
  const off = -(scroll % tw);
  const n = Math.ceil(W / tw) + 2;
  for (let i = -1; i <= n; i++) {
    const tx = off + i * tw;
    ctx.save();
    if ((((idx + i) % 2) + 2) % 2) { ctx.translate(tx + tw, 0); ctx.scale(-1, 1); }
    else ctx.translate(tx, 0);
    ctx.drawImage(im, 0, baseY - th, tw, th);
    ctx.restore();
  }
}

global.Scenery = {
  probe, preload, band, props, prop, usesProps, tinted, drawBand,
  get ready() { return ready; },
  get manifest() { return manifest; },
};

})(window);
