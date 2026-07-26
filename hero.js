/* =========================================================
   Odyssée — Le Héros
   Mascotte illustrée : visage expressif, vêtements en couches,
   cape animée par le vent, sac, compagnon, monture.
   Proportions « Nintendo » : tête ≈ 1/3 de la silhouette.

   Repère : origine aux pieds, Y négatif vers le haut,
   1 unité = hauteur totale du personnage.

   Expose : window.Hero = { draw, CATALOG, defaultLook, unlocked }
   ========================================================= */
(function (global) {
"use strict";

/* ---------- couleur ---------- */
function hx(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a, b, t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const rgb = (c, a) => a == null ? "rgb(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + ")"
                                : "rgba(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + "," + a + ")";
const WHITE = [255,255,255], BLACK = [18,20,28];
const lit = (c, k) => mix(c, WHITE, k);
const shd = (c, k) => mix(c, BLACK, k);

/* ---------- catalogue ---------- */
const CATALOG = {
  body: [
    { id:"f", name:"Silhouette fine",     req:null },
    { id:"n", name:"Silhouette neutre",   req:null },
    { id:"m", name:"Silhouette robuste",  req:null },
  ],
  hair: [
    { id:"short",  name:"Courts",            req:null },
    { id:"wavy",   name:"Ondulés",           req:null },
    { id:"long",   name:"Longs",             req:null },
    { id:"pony",   name:"Queue haute",       req:{ t:"level", n:3 } },
    { id:"bun",    name:"Chignon",           req:{ t:"level", n:6 } },
    { id:"curly",  name:"Bouclés",           req:{ t:"steps", n:120 } },
    { id:"braids", name:"Tresses",           req:{ t:"steps", n:260 } },
  ],
  outfit: [
    { id:"tunic",  name:"Tunique de marche", req:null },
    { id:"coat",   name:"Manteau long",      req:{ t:"level", n:4 } },
    { id:"robe",   name:"Robe de voyage",    req:{ t:"obstacles", n:6 } },
    { id:"winter", name:"Tenue d'hiver",     req:{ t:"biomes", n:3 } },
    { id:"desert", name:"Tenue du désert",   req:{ t:"biomes", n:6 } },
  ],
  cape: [
    { id:"none",   name:"Sans cape",         req:null },
    { id:"simple", name:"Cape de lin",       req:{ t:"level", n:2 } },
    { id:"long",   name:"Grande cape",       req:{ t:"obstacles", n:4 } },
    { id:"feather",name:"Cape de plumes",    req:{ t:"streak", n:7 } },
    { id:"star",   name:"Cape étoilée",      req:{ t:"level", n:12 } },
    { id:"aurora", name:"Cape d'aurore",     req:{ t:"biomes", n:10 } },
  ],
  pack: [
    { id:"none",   name:"Les mains libres",  req:null },
    { id:"satchel",name:"Besace",            req:null },
    { id:"pack",   name:"Sac à dos",         req:{ t:"level", n:2 } },
    { id:"bedroll",name:"Sac & couchage",    req:{ t:"steps", n:90 } },
    { id:"lantern",name:"Sac & lanterne",    req:{ t:"obstacles", n:10 } },
  ],
  pet: [
    { id:"none",   name:"Aucun",             req:null },
    { id:"cat",    name:"Chat",              req:{ t:"streak", n:3 } },
    { id:"fox",    name:"Renardeau",         req:{ t:"level", n:5 } },
    { id:"bird",   name:"Oiseau",            req:{ t:"perfect", n:5 } },
    { id:"spirit", name:"Esprit lumineux",   req:{ t:"level", n:14 } },
  ],
  mount: [
    { id:"none",   name:"À pied",            req:null },
    { id:"horse",  name:"Cheval",            req:{ t:"level", n:8 } },
    { id:"stag",   name:"Grand cerf",        req:{ t:"biomes", n:8 } },
    { id:"dragon", name:"Dragonnet",         req:{ t:"level", n:16 } },
  ],
};

const SKINS  = ["#fbdcc0","#f2c19b","#dda274","#b87c4e","#8d5a33","#63402a"];
const HAIRS  = ["#2b2320","#4a3220","#7a4a24","#b06a2c","#d8b46a","#8f9aa8","#c85a5a","#6a5a9c"];
const CLOTH  = ["#4f7df3","#3dbe7c","#e08a3d","#d4607f","#9b6ce0","#2fa6b8","#c9a24a","#5a6craft"];
const CAPES  = ["#c8453f","#2f6fb8","#3a8a5c","#8a4fb0","#d68a2e","#2b3a52","#c9c2b4"];
CLOTH[7] = "#5a6478";

function defaultLook() {
  return { body:"n", skin:SKINS[0], hair:"wavy", hairColor:HAIRS[1],
           outfit:"tunic", outfitColor:CLOTH[0], cape:"none", capeColor:CAPES[0],
           pack:"satchel", pet:"none", mount:"none" };
}
function unlocked(req, S) {
  if (!req) return true;
  return (S[req.t] || 0) >= req.n;
}

/* =========================================================
   Rendu
   st  : { t, walk (0 = arrêt, 1 = marche), phase, jump, cheer }
   env : { sun:[r,g,b], amb:[r,g,b], night:0..1, wind:0..1 }
   ========================================================= */
function draw(ctx, x, y, S, look, st, env) {
  const g = env.amb, sun = env.sun;
  const T = c => [c[0]*g[0], c[1]*g[1], c[2]*g[2]];          /* grade ambiant */
  const skin = T(hx(look.skin));
  const hair = T(hx(look.hairColor));
  const cloth = T(hx(look.outfitColor));
  const capeC = T(hx(look.capeColor));
  const sunC = rgb(sun, .85);
  const body = look.body || "n";
  const W = body === "m" ? 1.13 : body === "f" ? .92 : 1;    /* largeur d'épaules */
  const wind = .35 + (env.wind || 0) * .65;

  const ph = st.phase || 0;
  const walking = st.walk > .02;
  const sw = walking ? Math.sin(ph) : 0;                      /* balancement */
  const bob = walking ? Math.abs(Math.cos(ph)) * .022 : Math.sin(st.t * 1.7) * .009;
  const jumpY = st.jump ? -Math.sin(st.jump * Math.PI) * .75 : 0;
  const cheerY = st.cheer ? -Math.abs(Math.sin(st.cheer * Math.PI * 2)) * .34 : 0;
  const mounted = look.mount && look.mount !== "none";

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);                    /* on travaille en unités de hauteur */

  /* ---- ombre portée ---- */
  const lift = -(jumpY + cheerY);
  ctx.globalAlpha = Math.max(.06, .30 - lift * .5);
  ctx.fillStyle = rgb(T(hx("#1d2a34")));
  ctx.beginPath();
  ctx.ellipse(mounted ? .02 : 0, 0, mounted ? .34 : .25, mounted ? .052 : .055, 0, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (mounted) {
    ctx.save();
    ctx.scale(.95, .95);
    drawMount(ctx, look.mount, T, sun, st, ph);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, jumpY + cheerY - bob);
  if (mounted) {
    /* le cavalier est assis sur la selle : on le pose dessus et on le
       réduit pour retrouver une proportion crédible avec la monture */
    ctx.translate(.075, -.500);
    ctx.scale(.62, .62);
  } else if (walking) {
    ctx.rotate(.035);
  }

  /* ---- cape : pan arrière ---- */
  if (look.cape !== "none") drawCape(ctx, look.cape, capeC, sun, st, ph, wind, W, "back");

  /* ---- sac ---- */
  if (look.pack !== "none") drawPack(ctx, look.pack, T, sun, st);

  /* ---- jambe arrière ---- */
  drawLeg(ctx, -sw, cloth, skin, T, -.028 * W, .82, mounted);

  /* ---- torse ---- */
  drawTorso(ctx, look.outfit, cloth, skin, T, sun, W, sw, st);

  /* ---- jambe avant ---- */
  drawLeg(ctx, sw, cloth, skin, T, .030 * W, 1, mounted);

  /* ---- bras arrière ---- */
  drawArm(ctx, -sw * .8, cloth, skin, -.085 * W, -.50, .88, st);

  /* ---- tête ---- */
  drawHead(ctx, look, skin, hair, T, sun, st, ph, walking, wind);

  /* ---- bras avant ---- */
  drawArm(ctx, sw * .85, cloth, skin, .088 * W, -.50, 1, st);

  /* ---- cape : pan avant ---- */
  if (look.cape !== "none") drawCape(ctx, look.cape, capeC, sun, st, ph, wind, W, "front");

  ctx.restore();
  ctx.restore();

  /* ---- compagnon (au sol, derrière le héros) ---- */
  if (look.pet && look.pet !== "none") {
    ctx.save();
    ctx.translate(x - S * .62, y);
    ctx.scale(S, S);
    drawPet(ctx, look.pet, T, sun, st, ph);
    ctx.restore();
  }
}

/* ---------------- torse ---------------- */
function drawTorso(ctx, outfit, cloth, skin, T, sun, W, sw, st) {
  const top = -.60, bot = -.24;
  const shoulder = .118 * W, waist = .092 * W, hip = .105 * W;

  const gd = ctx.createLinearGradient(-shoulder, top, shoulder * .8, bot);
  gd.addColorStop(0, rgb(lit(cloth, .22)));
  gd.addColorStop(.5, rgb(cloth));
  gd.addColorStop(1, rgb(shd(cloth, .26)));
  ctx.fillStyle = gd;

  ctx.beginPath();
  ctx.moveTo(-shoulder, top + .02);
  ctx.quadraticCurveTo(-shoulder * 1.06, top - .022, -shoulder * .5, top - .028);
  ctx.quadraticCurveTo(0, top - .034, shoulder * .5, top - .028);
  ctx.quadraticCurveTo(shoulder * 1.06, top - .022, shoulder, top + .02);
  if (outfit === "robe" || outfit === "coat") {
    ctx.quadraticCurveTo(shoulder * 1.02, -.44, hip * 1.22, bot - .06);
    ctx.quadraticCurveTo(0, bot + .01, -hip * 1.22, bot - .06);
    ctx.quadraticCurveTo(-shoulder * 1.02, -.44, -shoulder, top + .02);
  } else {
    ctx.quadraticCurveTo(waist * 1.14, -.42, hip, bot);
    ctx.quadraticCurveTo(0, bot + .022, -hip, bot);
    ctx.quadraticCurveTo(-waist * 1.14, -.42, -shoulder, top + .02);
  }
  ctx.closePath(); ctx.fill();

  /* ombre interne sous le col */
  const sh = ctx.createLinearGradient(0, top - .03, 0, top + .07);
  sh.addColorStop(0, rgb(shd(cloth, .34), .55));
  sh.addColorStop(1, rgb(shd(cloth, .34), 0));
  ctx.fillStyle = sh;
  ctx.fillRect(-shoulder, top - .03, shoulder * 2, .1);

  /* détails selon la tenue */
  if (outfit === "tunic" || outfit === "desert") {
    ctx.strokeStyle = rgb(shd(cloth, .42), .8);
    ctx.lineWidth = .012;
    ctx.beginPath(); ctx.moveTo(0, top - .01); ctx.lineTo(0, -.34); ctx.stroke();
    /* ceinture */
    ctx.fillStyle = rgb(T(hx("#6b4a30")));
    ctx.fillRect(-waist * 1.1, -.345, waist * 2.2, .038);
    ctx.fillStyle = rgb(T(hx("#e0b45a")));
    ctx.fillRect(-.022, -.348, .044, .044);
  }
  if (outfit === "coat") {
    ctx.strokeStyle = rgb(lit(cloth, .32), .9);
    ctx.lineWidth = .011;
    ctx.beginPath(); ctx.moveTo(.012, top - .012); ctx.lineTo(.02, bot - .05); ctx.stroke();
    ctx.fillStyle = rgb(T(hx("#5a4030")));
    ctx.fillRect(-waist * 1.05, -.36, waist * 2.1, .034);
    /* revers */
    ctx.fillStyle = rgb(lit(cloth, .18));
    ctx.beginPath();
    ctx.moveTo(-.05, top - .026); ctx.lineTo(.012, -.44); ctx.lineTo(.062, top - .022);
    ctx.closePath(); ctx.fill();
  }
  if (outfit === "winter") {
    /* col de fourrure */
    ctx.fillStyle = rgb(T(hx("#e8ddcc")));
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(i * .026, top - .028 + Math.abs(i) * .004, .028, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = rgb(T(hx("#e8ddcc")), .9);
    ctx.fillRect(-hip, bot - .03, hip * 2, .03);
  }
  if (outfit === "robe") {
    ctx.strokeStyle = rgb(lit(cloth, .38), .7);
    ctx.lineWidth = .010;
    for (const yy of [-.40, -.34]) {
      ctx.beginPath();
      ctx.moveTo(-hip * 1.1, yy); ctx.quadraticCurveTo(0, yy + .016, hip * 1.1, yy);
      ctx.stroke();
    }
  }
  if (outfit === "desert") {
    /* écharpe de tête retombant sur l'épaule */
    ctx.fillStyle = rgb(lit(cloth, .3), .9);
    ctx.beginPath();
    ctx.moveTo(-shoulder * .9, top);
    ctx.quadraticCurveTo(-shoulder * 1.3, -.46, -shoulder * .8, -.38);
    ctx.quadraticCurveTo(-shoulder * .6, -.46, -shoulder * .5, top - .01);
    ctx.closePath(); ctx.fill();
  }

  /* liseré de lumière côté soleil */
  ctx.strokeStyle = rgb(sun, .55);
  ctx.lineWidth = .013;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(shoulder * .82, top - .022);
  ctx.quadraticCurveTo(waist * 1.2, -.42, hip * .96, bot - .008);
  ctx.stroke();
}

/* ---------------- jambes ---------------- */
function drawLeg(ctx, swing, cloth, skin, T, dx, depth, mounted) {
  const hipY = -.245, thigh = .125, shin = .118;
  const a1 = mounted ? -.95 : swing * .52;
  const a2 = mounted ? 1.15 : Math.max(0, -swing * .42);
  const pantC = shd(cloth, .30 + (1 - depth) * .16);
  const bootC = T(hx("#6b4530"));
  const bootD = shd(bootC, .22 + (1 - depth) * .16);

  ctx.save();
  ctx.translate(dx, hipY);
  ctx.rotate(a1);
  /* cuisse */
  ctx.fillStyle = rgb(pantC);
  rr(ctx, -.036, 0, .072, thigh + .01, .03);
  ctx.translate(0, thigh);
  ctx.rotate(a2);
  /* mollet */
  ctx.fillStyle = rgb(shd(pantC, .06));
  rr(ctx, -.031, -.012, .062, shin * .55, .026);
  /* botte */
  ctx.fillStyle = rgb(bootD);
  rr(ctx, -.034, shin * .40, .068, shin * .62, .022);
  ctx.fillStyle = rgb(bootC);
  ctx.beginPath();
  ctx.moveTo(-.034, shin * .96);
  ctx.lineTo(.052, shin * .96);
  ctx.quadraticCurveTo(.070, shin * 1.02, .052, shin * 1.06);
  ctx.lineTo(-.034, shin * 1.06);
  ctx.closePath(); ctx.fill();
  /* revers de botte */
  ctx.fillStyle = rgb(lit(bootC, .2));
  rr(ctx, -.038, shin * .38, .076, .022, .01);
  ctx.restore();
}

/* ---------------- bras ---------------- */
function drawArm(ctx, swing, cloth, skin, dx, sy, depth, st) {
  const upper = .118, fore = .104;
  const a1 = swing * .62 + .06;
  const a2 = Math.max(.05, swing * .3 + .22);
  const c = shd(cloth, .12 + (1 - depth) * .22);
  ctx.save();
  ctx.translate(dx, sy);
  ctx.rotate(a1);
  ctx.fillStyle = rgb(c);
  rr(ctx, -.030, 0, .060, upper + .012, .026);
  ctx.translate(0, upper);
  ctx.rotate(a2);
  ctx.fillStyle = rgb(shd(c, .06));
  rr(ctx, -.026, -.01, .052, fore * .62, .022);
  /* main */
  ctx.fillStyle = rgb(shd(skin, (1 - depth) * .2));
  ctx.beginPath(); ctx.arc(0, fore * .70, .030, 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------------- tête, cheveux, visage ---------------- */
function drawHead(ctx, look, skin, hair, T, sun, st, ph, walking, wind) {
  const cy = -.775, r = .168;
  const tilt = walking ? Math.sin(ph * 2) * .022 : Math.sin(st.t * 1.4) * .014;
  const cheering = st.cheer > .02;

  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(tilt);

  /* cou */
  ctx.fillStyle = rgb(shd(skin, .22));
  rr(ctx, -.042, r * .62, .084, .07, .022);

  /* cheveux : masse arrière */
  drawHairBack(ctx, look.hair, hair, r, st, ph, wind);

  /* visage */
  const fg = ctx.createLinearGradient(-r * .5, -r, r * .7, r);
  fg.addColorStop(0, rgb(lit(skin, .16)));
  fg.addColorStop(.62, rgb(skin));
  fg.addColorStop(1, rgb(shd(skin, .14)));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(.012, 0, r * .93, r, 0, 0, 7);
  ctx.fill();
  /* menton légèrement en pointe */
  ctx.beginPath();
  ctx.moveTo(-r * .58, r * .32);
  ctx.quadraticCurveTo(.012, r * 1.16, r * .62, r * .32);
  ctx.quadraticCurveTo(.012, r * .78, -r * .58, r * .32);
  ctx.closePath(); ctx.fill();

  /* oreille */
  ctx.fillStyle = rgb(shd(skin, .10));
  ctx.beginPath(); ctx.ellipse(-r * .80, r * .06, .026, .036, -.2, 0, 7); ctx.fill();

  /* ---- yeux ---- */
  const eyeY = r * .06;
  const ex1 = r * .30, ex2 = r * .70;      /* vue 3/4 : œil éloigné plus petit */
  if (cheering) {
    ctx.strokeStyle = rgb(shd(BLACK, 0), .92);
    ctx.lineWidth = .017; ctx.lineCap = "round";
    for (const [ex, s] of [[ex1, .9], [ex2, 1]]) {
      ctx.beginPath();
      ctx.moveTo(ex - .028 * s, eyeY + .004);
      ctx.quadraticCurveTo(ex, eyeY - .030 * s, ex + .028 * s, eyeY + .004);
      ctx.stroke();
    }
  } else {
    for (const [ex, s] of [[ex1, .88], [ex2, 1]]) {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(ex, eyeY, .026 * s, .032 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = rgb(T(hx("#2a2230")));
      ctx.beginPath(); ctx.ellipse(ex + .005, eyeY + .002, .017 * s, .025 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ex + .011, eyeY - .010, .008 * s, 0, 7); ctx.fill();
    }
    /* cils / paupière */
    ctx.strokeStyle = rgb(shd(hair, .3), .85);
    ctx.lineWidth = .011; ctx.lineCap = "round";
    for (const [ex, s] of [[ex1, .88], [ex2, 1]]) {
      ctx.beginPath();
      ctx.moveTo(ex - .030 * s, eyeY - .026 * s);
      ctx.quadraticCurveTo(ex, eyeY - .040 * s, ex + .030 * s, eyeY - .022 * s);
      ctx.stroke();
    }
  }
  /* sourcils */
  ctx.strokeStyle = rgb(shd(hair, .12), .9);
  ctx.lineWidth = .014;
  for (const [ex, s] of [[ex1, .88], [ex2, 1]]) {
    ctx.beginPath();
    ctx.moveTo(ex - .026 * s, eyeY - .062 * s);
    ctx.quadraticCurveTo(ex, eyeY - .076 * s, ex + .028 * s, eyeY - .058 * s);
    ctx.stroke();
  }
  /* nez */
  ctx.strokeStyle = rgb(shd(skin, .30), .8);
  ctx.lineWidth = .012;
  ctx.beginPath();
  ctx.moveTo(r * .90, eyeY + .028);
  ctx.quadraticCurveTo(r * .98, eyeY + .050, r * .86, eyeY + .056);
  ctx.stroke();
  /* bouche */
  ctx.strokeStyle = rgb(T(hx("#a05252")), .92);
  ctx.lineWidth = .014; ctx.lineCap = "round";
  ctx.beginPath();
  if (cheering) {
    ctx.moveTo(r * .34, r * .48);
    ctx.quadraticCurveTo(r * .56, r * .72, r * .76, r * .46);
  } else {
    ctx.moveTo(r * .40, r * .50);
    ctx.quadraticCurveTo(r * .56, r * .60, r * .72, r * .48);
  }
  ctx.stroke();
  /* joues */
  ctx.fillStyle = rgb(T(hx("#f08a92")), cheering ? .42 : .26);
  ctx.beginPath(); ctx.ellipse(r * .22, r * .34, .040, .022, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * .84, r * .30, .034, .020, 0, 0, 7); ctx.fill();

  /* cheveux : frange et mèches avant */
  drawHairFront(ctx, look.hair, hair, r, st, ph, wind, sun);

  /* liseré de lumière sur le crâne */
  ctx.strokeStyle = rgb(sun, .5);
  ctx.lineWidth = .014;
  ctx.beginPath();
  ctx.arc(.012, -.01, r * 1.02, -1.25, -.15);
  ctx.stroke();

  ctx.restore();
}

function drawHairBack(ctx, style, hair, r, st, ph, wind) {
  const flow = Math.sin(st.t * 2.1) * .012 * wind;
  ctx.fillStyle = rgb(shd(hair, .18));
  if (style === "long" || style === "wavy" || style === "curly" || style === "braids") {
    const len = style === "long" ? .40 : style === "curly" ? .24 : .28;
    ctx.beginPath();
    ctx.moveTo(-r * .86, -r * .3);
    ctx.quadraticCurveTo(-r * 1.10 - flow, r * .9, -r * .78 - flow * 2, r * .8 + len);
    ctx.quadraticCurveTo(-r * .24, r * .92 + len, r * .18, r * .7 + len * .45);
    ctx.quadraticCurveTo(r * .62, r * .2, r * .58, -r * .55);
    ctx.closePath(); ctx.fill();
    if (style === "curly") {
      for (let i = 0; i < 7; i++) {
        const a = -.4 + i * .5;
        ctx.beginPath();
        ctx.arc(-r * .5 + Math.cos(a) * r * .95, r * .5 + Math.sin(a) * r * .8 + .06, .052, 0, 7);
        ctx.fill();
      }
    }
    if (style === "braids") {
      ctx.fillStyle = rgb(shd(hair, .26));
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(sx * r * .92 + flow * i * .4, r * .55 + i * .075, .034 - i * .004, 0, 7);
          ctx.fill();
        }
      }
    }
  } else if (style === "pony") {
    ctx.beginPath();
    ctx.moveTo(-r * .55, -r * .55);
    ctx.quadraticCurveTo(-r * 1.5 - flow * 3, -r * .2, -r * 1.25 - flow * 4, r * .95);
    ctx.quadraticCurveTo(-r * .85, r * .55, -r * .70, -r * .1);
    ctx.closePath(); ctx.fill();
  } else if (style === "bun") {
    ctx.beginPath(); ctx.arc(-r * .82, -r * .68, .072, 0, 7); ctx.fill();
    ctx.fillStyle = rgb(shd(hair, .3));
    ctx.beginPath(); ctx.arc(-r * .88, -r * .62, .034, 0, 7); ctx.fill();
  }
  /* calotte arrière commune */
  ctx.fillStyle = rgb(shd(hair, .12));
  ctx.beginPath();
  ctx.ellipse(-.012, -r * .12, r * .96, r * .95, 0, Math.PI * .55, Math.PI * 1.75);
  ctx.fill();
}

function drawHairFront(ctx, style, hair, r, st, ph, wind, sun) {
  const flow = Math.sin(st.t * 2.4) * .010 * wind;
  const gd = ctx.createLinearGradient(-r, -r, r * .6, r * .3);
  gd.addColorStop(0, rgb(lit(hair, .26)));
  gd.addColorStop(.6, rgb(hair));
  gd.addColorStop(1, rgb(shd(hair, .16)));
  ctx.fillStyle = gd;

  /* calotte + frange */
  ctx.beginPath();
  ctx.moveTo(-r * .98, r * .02);
  ctx.quadraticCurveTo(-r * 1.06, -r * 1.06, .012, -r * 1.10);
  ctx.quadraticCurveTo(r * 1.02, -r * 1.06, r * .98, -r * .12);
  if (style === "short") {
    ctx.quadraticCurveTo(r * .82, -r * .48, r * .52, -r * .40);
    ctx.quadraticCurveTo(r * .1, -r * .30, -r * .38, -r * .44);
    ctx.quadraticCurveTo(-r * .78, -r * .52, -r * .98, r * .02);
  } else if (style === "curly") {
    for (let i = 0; i < 5; i++) {
      const px = r * (.8 - i * .42), py = -r * (.32 + (i % 2) * .18);
      ctx.quadraticCurveTo(px + r * .12, py - r * .3, px - r * .16, py);
    }
    ctx.quadraticCurveTo(-r * .9, -r * .3, -r * .98, r * .02);
  } else {
    /* frange en mèches */
    ctx.quadraticCurveTo(r * .92 + flow, -r * .30, r * .60 + flow, -r * .52);
    ctx.quadraticCurveTo(r * .48, -r * .18, r * .22 + flow, -r * .46);
    ctx.quadraticCurveTo(r * .06, -r * .12, -r * .22 + flow, -r * .50);
    ctx.quadraticCurveTo(-r * .46, -r * .18, -r * .70, -r * .48);
    ctx.quadraticCurveTo(-r * .92, -r * .30, -r * .98, r * .02);
  }
  ctx.closePath(); ctx.fill();

  /* mèche latérale qui encadre le visage */
  if (style !== "short") {
    ctx.fillStyle = rgb(shd(hair, .06));
    ctx.beginPath();
    ctx.moveTo(r * .88, -r * .34);
    ctx.quadraticCurveTo(r * 1.00 + flow, r * .18, r * .86 + flow, r * .56);
    ctx.quadraticCurveTo(r * .80, r * .10, r * .74, -r * .28);
    ctx.closePath(); ctx.fill();
  }
  /* accroche-lumière */
  ctx.strokeStyle = rgb(lit(hair, .55), .55);
  ctx.lineWidth = .016; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * .40, -r * .84);
  ctx.quadraticCurveTo(r * .18, -r * 1.02, r * .70, -r * .70);
  ctx.stroke();
}

/* ---------------- cape ---------------- */
function drawCape(ctx, kind, c, sun, st, ph, wind, W, part) {
  const N = 7;
  const len = kind === "long" || kind === "aurora" ? .58 : kind === "star" ? .52 : .44;
  const spread = kind === "long" || kind === "aurora" ? .085 : .065;
  const t = st.t;
  const amp = (st.walk > .02 ? .050 : .026) * wind;

  /* le vent parcourt la cape : chaque segment est en retard sur le précédent.
     La cape traîne DERRIÈRE le héros (x négatif) et reste étroite : elle
     souligne la silhouette au lieu de l'engloutir. */
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const wave = Math.sin(t * 3.0 - k * 3.4 + ph * .5) * amp * k;
    pts.push({
      x: -.045 * W - k * k * .20 + wave * .6,
      y: -.605 + k * len,
      w: (.050 + k * spread) * W,
    });
  }

  if (part === "back") {
    const gd = ctx.createLinearGradient(0, -.62, -.22, -.60 + len);
    gd.addColorStop(0, rgb(lit(c, .18)));
    gd.addColorStop(.55, rgb(c));
    gd.addColorStop(1, rgb(shd(c, .34)));
    ctx.fillStyle = gd;
    ctx.beginPath();
    ctx.moveTo(pts[0].x + pts[0].w, pts[0].y);
    for (let i = 1; i <= N; i++) {
      const p = pts[i], q = pts[i - 1];
      ctx.quadraticCurveTo((q.x + q.w + p.x + p.w) / 2, (q.y + p.y) / 2, p.x + p.w, p.y);
    }
    /* ourlet ondulé */
    const e = pts[N];
    ctx.quadraticCurveTo(e.x + e.w * .3, e.y + .045, e.x, e.y + .022);
    ctx.quadraticCurveTo(e.x - e.w * .5, e.y + .05, e.x - e.w, e.y);
    for (let i = N - 1; i >= 0; i--) {
      const p = pts[i], q = pts[i + 1];
      ctx.quadraticCurveTo((q.x - q.w + p.x - p.w) / 2, (q.y + p.y) / 2, p.x - p.w, p.y);
    }
    ctx.closePath(); ctx.fill();

    /* plis */
    ctx.strokeStyle = rgb(shd(c, .40), .38);
    ctx.lineWidth = .011;
    for (const off of [-.4, .1]) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const p = pts[i];
        const px = p.x + p.w * off, py = p.y;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }

    /* motifs */
    if (kind === "star") {
      for (let i = 0; i < 7; i++) {
        const p = pts[2 + (i % 5)];
        const sx = p.x + ((i * 37) % 100 / 100 - .5) * p.w * 1.4;
        const sy = p.y + ((i * 53) % 40 / 100) * .05;
        const tw = .5 + Math.sin(t * 2 + i) * .5;
        ctx.fillStyle = rgb([255, 244, 210], .35 + tw * .55);
        star(ctx, sx, sy, .016 + tw * .006);
      }
    }
    if (kind === "aurora") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const ag = ctx.createLinearGradient(0, -.6, -.2, -.6 + len);
        ag.addColorStop(0, "rgba(90,240,200,0)");
        ag.addColorStop(.5, "rgba(90,220,255," + (.16 - i * .04) + ")");
        ag.addColorStop(1, "rgba(150,140,255,0)");
        ctx.fillStyle = ag;
        ctx.beginPath();
        for (let j = 0; j <= N; j++) {
          const p = pts[j];
          const o = Math.sin(t * 1.6 + j * .7 + i * 2) * p.w * .3;
          j ? ctx.lineTo(p.x + o, p.y) : ctx.moveTo(p.x + o, p.y);
        }
        for (let j = N; j >= 0; j--) {
          const p = pts[j];
          const o = Math.sin(t * 1.6 + j * .7 + i * 2) * p.w * .3;
          ctx.lineTo(p.x + o - p.w * .45, p.y);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    if (kind === "feather") {
      ctx.fillStyle = rgb(lit(c, .3), .55);
      for (let i = 1; i <= N; i++) {
        const p = pts[i];
        ctx.beginPath();
        ctx.ellipse(p.x - p.w * .45, p.y, p.w * .30, .034, .3, 0, 7);
        ctx.fill();
      }
    }
  } else {
    /* pan avant : petite retombée sur l'épaule + attache */
    ctx.fillStyle = rgb(lit(c, .1));
    ctx.beginPath();
    ctx.moveTo(.02 * W, -.615);
    ctx.quadraticCurveTo(.115 * W, -.60, .105 * W, -.50);
    ctx.quadraticCurveTo(.06 * W, -.545, .01 * W, -.585);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgb([230, 190, 90]);
    ctx.beginPath(); ctx.arc(.028 * W, -.607, .022, 0, 7); ctx.fill();
    ctx.fillStyle = rgb([150, 116, 42]);
    ctx.beginPath(); ctx.arc(.028 * W, -.607, .010, 0, 7); ctx.fill();
    /* liseré */
    ctx.strokeStyle = rgb(sun, .45);
    ctx.lineWidth = .012;
    ctx.beginPath();
    ctx.moveTo(.045 * W, -.615);
    ctx.quadraticCurveTo(.118 * W, -.59, .106 * W, -.505);
    ctx.stroke();
  }
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const rr2 = i % 2 ? r * .38 : r;
    const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

/* ---------------- sac ---------------- */
function drawPack(ctx, kind, T, sun, st) {
  const leather = T(hx("#7a5436")), dark = T(hx("#4e3623"));
  if (kind === "satchel") {
    ctx.fillStyle = rgb(dark);
    rr(ctx, -.175, -.44, .13, .13, .028);
    ctx.fillStyle = rgb(leather);
    rr(ctx, -.175, -.44, .13, .055, .022);
    ctx.strokeStyle = rgb(dark); ctx.lineWidth = .012;
    ctx.beginPath(); ctx.moveTo(-.12, -.44); ctx.quadraticCurveTo(-.02, -.60, .06, -.585); ctx.stroke();
    return;
  }
  /* sac à dos */
  ctx.fillStyle = rgb(dark);
  rr(ctx, -.205, -.565, .155, .225, .045);
  const gd = ctx.createLinearGradient(-.205, -.565, -.05, -.34);
  gd.addColorStop(0, rgb(T(hx("#8d6240")))); gd.addColorStop(1, rgb(dark));
  ctx.fillStyle = gd;
  rr(ctx, -.198, -.558, .142, .16, .04);
  ctx.fillStyle = rgb(leather);
  rr(ctx, -.198, -.558, .142, .062, .034);
  ctx.fillStyle = rgb(T(hx("#c8a24a")));
  rr(ctx, -.145, -.50, .036, .028, .008);
  /* bretelles */
  ctx.strokeStyle = rgb(dark); ctx.lineWidth = .020; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-.11, -.55); ctx.quadraticCurveTo(.02, -.615, .085, -.50); ctx.stroke();
  if (kind === "bedroll") {
    ctx.fillStyle = rgb(T(hx("#b8563f")));
    rr(ctx, -.225, -.35, .19, .052, .026);
    ctx.fillStyle = rgb(T(hx("#8e3f2e")));
    ctx.beginPath(); ctx.ellipse(-.225, -.324, .020, .026, 0, 0, 7); ctx.fill();
  }
  if (kind === "lantern") {
    const lx = -.235, ly = -.40;
    const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, .17);
    gl.addColorStop(0, "rgba(255,206,120,.5)");
    gl.addColorStop(1, "rgba(255,206,120,0)");
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(lx, ly, .17, 0, 7); ctx.fill();
    ctx.fillStyle = rgb(T(hx("#4a4038")));
    rr(ctx, lx - .028, ly - .034, .056, .068, .012);
    ctx.fillStyle = "rgba(255,226,150,.95)";
    rr(ctx, lx - .018, ly - .024, .036, .048, .008);
  }
}

/* ---------------- compagnons ---------------- */
function drawPet(ctx, kind, T, sun, st, ph) {
  const hop = Math.abs(Math.sin(ph * .9)) * .022;
  const tail = Math.sin(st.t * 4) * .3;
  ctx.save();
  ctx.translate(0, -hop);
  ctx.globalAlpha = .35;
  ctx.fillStyle = rgb(T(hx("#22303a")));
  ctx.beginPath(); ctx.ellipse(0, hop, .075, .018, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;

  if (kind === "spirit") {
    const g1 = ctx.createRadialGradient(0, -.13, 0, 0, -.13, .13);
    g1.addColorStop(0, "rgba(190,245,255,.95)");
    g1.addColorStop(.5, "rgba(120,200,255,.45)");
    g1.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(0, -.13 - hop * 2, .13, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.beginPath(); ctx.arc(0, -.13 - hop * 2, .034, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  if (kind === "bird") {
    const fly = Math.sin(st.t * 6) * .03;
    ctx.translate(0, -.44 + fly);
    const c = T(hx("#5aa8d8"));
    ctx.fillStyle = rgb(c);
    ctx.beginPath(); ctx.ellipse(0, 0, .052, .038, .1, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(.045, -.022, .028, 0, 7); ctx.fill();
    ctx.fillStyle = rgb(lit(c, .3));
    ctx.beginPath();
    ctx.moveTo(-.01, -.01);
    ctx.quadraticCurveTo(-.05, -.06 - fly, -.075, .006);
    ctx.quadraticCurveTo(-.04, .012, -.01, -.01);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgb(T(hx("#e8a33d")));
    ctx.beginPath(); ctx.moveTo(.070, -.022); ctx.lineTo(.096, -.012); ctx.lineTo(.070, -.004); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1d2028";
    ctx.beginPath(); ctx.arc(.052, -.03, .008, 0, 7); ctx.fill();
    ctx.restore(); return;
  }
  const base = kind === "cat" ? T(hx("#7b7f8c")) : T(hx("#d2803c"));
  const belly = kind === "cat" ? T(hx("#d8dce4")) : T(hx("#f2e0cc"));
  /* corps */
  ctx.fillStyle = rgb(base);
  ctx.beginPath(); ctx.ellipse(-.01, -.088, .078, .052, 0, 0, 7); ctx.fill();
  ctx.fillStyle = rgb(belly);
  ctx.beginPath(); ctx.ellipse(-.005, -.068, .058, .030, 0, 0, 7); ctx.fill();
  /* pattes */
  ctx.fillStyle = rgb(shd(base, .18));
  for (let i = 0; i < 4; i++) {
    const px = -.055 + i * .036;
    const sy = Math.sin(ph * 2 + i * 1.6) * .012;
    rr(ctx, px, -.046 + sy, .019, .048, .008);
  }
  /* tête */
  ctx.fillStyle = rgb(base);
  ctx.beginPath(); ctx.arc(.068, -.11, .048, 0, 7); ctx.fill();
  /* oreilles */
  ctx.beginPath();
  ctx.moveTo(.042, -.145); ctx.lineTo(.048, -.196); ctx.lineTo(.078, -.152); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(.082, -.150); ctx.lineTo(.104, -.192); ctx.lineTo(.108, -.138); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(T(hx("#f0a8a8")));
  ctx.beginPath(); ctx.moveTo(.050, -.152); ctx.lineTo(.054, -.180); ctx.lineTo(.070, -.156); ctx.closePath(); ctx.fill();
  /* museau */
  ctx.fillStyle = rgb(belly);
  ctx.beginPath(); ctx.ellipse(.098, -.096, .026, .020, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#25282f";
  ctx.beginPath(); ctx.arc(.082, -.122, .009, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(.114, -.100, .007, 0, 7); ctx.fill();
  /* queue */
  ctx.strokeStyle = rgb(base);
  ctx.lineWidth = kind === "fox" ? .042 : .026;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-.082, -.098);
  ctx.quadraticCurveTo(-.14, -.13 + tail * .06, -.15, -.20 + tail * .05);
  ctx.stroke();
  if (kind === "fox") {
    ctx.strokeStyle = rgb(belly); ctx.lineWidth = .022;
    ctx.beginPath(); ctx.moveTo(-.146, -.185 + tail * .05); ctx.lineTo(-.152, -.205 + tail * .05); ctx.stroke();
  }
  ctx.restore();
}

/* ---------------- montures ---------------- */
function drawMount(ctx, kind, T, sun, st, ph) {
  const gait = Math.sin(ph * 1.2);
  const bodyC = kind === "dragon" ? T(hx("#4f8a6a")) : kind === "stag" ? T(hx("#8a6242")) : T(hx("#6b4a34"));
  const maneC = kind === "dragon" ? T(hx("#2f5a48")) : T(hx("#3a2a1e"));
  const bob = Math.abs(Math.cos(ph * 1.2)) * .014;

  ctx.save();
  ctx.translate(0, -bob);
  /* pattes */
  ctx.strokeStyle = rgb(shd(bodyC, .22));
  ctx.lineWidth = .052; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const px = -.20 + i * .135;
    const sg = Math.sin(ph * 1.2 + i * 1.7) * .10;
    ctx.beginPath();
    ctx.moveTo(px, -.30);
    ctx.quadraticCurveTo(px + sg * .5, -.16, px + sg, -.02);
    ctx.stroke();
  }
  /* corps */
  const gd = ctx.createLinearGradient(0, -.52, 0, -.24);
  gd.addColorStop(0, rgb(lit(bodyC, .16)));
  gd.addColorStop(1, rgb(shd(bodyC, .22)));
  ctx.fillStyle = gd;
  ctx.beginPath();
  ctx.ellipse(-.02, -.38, .30, .135, 0, 0, 7);
  ctx.fill();
  /* encolure + tête */
  ctx.fillStyle = rgb(bodyC);
  ctx.beginPath();
  ctx.moveTo(.16, -.46);
  ctx.quadraticCurveTo(.34, -.60, .40, -.60);
  ctx.quadraticCurveTo(.50, -.60, .50, -.53);
  ctx.quadraticCurveTo(.42, -.50, .36, -.46);
  ctx.quadraticCurveTo(.28, -.40, .20, -.34);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(.475, -.555, .075, .046, .35, 0, 7); ctx.fill();
  /* oreilles / cornes */
  if (kind === "stag") {
    ctx.strokeStyle = rgb(T(hx("#c9b48c"))); ctx.lineWidth = .020;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(.44, -.60);
      ctx.quadraticCurveTo(.46 + s * .04, -.72, .52 + s * .06, -.78);
      ctx.moveTo(.47, -.68); ctx.lineTo(.55 + s * .03, -.70);
      ctx.stroke();
    }
  } else if (kind === "dragon") {
    ctx.fillStyle = rgb(T(hx("#8fc0a4")));
    for (let i = 0; i < 6; i++) {
      const px = -.20 + i * .09;
      ctx.beginPath();
      ctx.moveTo(px, -.50); ctx.lineTo(px + .03, -.575); ctx.lineTo(px + .06, -.50);
      ctx.closePath(); ctx.fill();
    }
    /* aile */
    ctx.fillStyle = rgb(T(hx("#3f6f58")), .9);
    const flap = Math.sin(st.t * 3) * .05;
    ctx.beginPath();
    ctx.moveTo(-.05, -.47);
    ctx.quadraticCurveTo(-.20, -.78 - flap, -.36, -.60 - flap);
    ctx.quadraticCurveTo(-.24, -.54, -.06, -.44);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = rgb(shd(bodyC, .1));
    ctx.beginPath();
    ctx.moveTo(.44, -.60); ctx.lineTo(.455, -.665); ctx.lineTo(.485, -.60); ctx.closePath(); ctx.fill();
  }
  /* crinière */
  ctx.fillStyle = rgb(maneC);
  ctx.beginPath();
  ctx.moveTo(.18, -.45);
  ctx.quadraticCurveTo(.30, -.62, .42, -.615);
  ctx.quadraticCurveTo(.32, -.55, .26, -.40);
  ctx.closePath(); ctx.fill();
  /* queue */
  ctx.strokeStyle = rgb(maneC); ctx.lineWidth = .046;
  ctx.beginPath();
  ctx.moveTo(-.31, -.40);
  ctx.quadraticCurveTo(-.44, -.34 + gait * .03, -.46, -.16 + gait * .04);
  ctx.stroke();
  /* œil */
  ctx.fillStyle = "#1d2028";
  ctx.beginPath(); ctx.arc(.492, -.575, .013, 0, 7); ctx.fill();
  /* selle */
  ctx.fillStyle = rgb(T(hx("#8a3f3a")));
  rr(ctx, -.11, -.512, .21, .055, .022);
  ctx.restore();
}

/* ---------------- util ---------------- */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath(); ctx.fill();
}

global.Hero = { draw, CATALOG, SKINS, HAIRS, CLOTH, CAPES, defaultLook, unlocked };

})(window);
