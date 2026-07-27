/* =========================================================
   Odyssée — logique applicative
   Habitudes → XP → progression du voyageur à travers le monde.
   Données 100 % locales (localStorage).
   ========================================================= */
(function () {
"use strict";

const KEY = "odyssee.v1";
["kikoSport.v1", "astria.v1", "relic.v1", "sakura.v1"].forEach(k => localStorage.removeItem(k));

const XP = { 1: 5, 2: 10, 3: 15 };
const PERFECT = 25;
const MAX_FREEZE = 3;
const MILESTONES = { 3: 15, 7: 25, 14: 40, 30: 75, 50: 100, 100: 150 };
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const SEG = 25;                       /* pas par biome */

const ICON_SET = ["water","walk","run","meditate","strength","bike","salad","fruit",
                  "sleep","bed","book","write","tooth","shower","sun","moon",
                  "pill","nophone","broom","music","speak","coffee","dog","heart"];
const HUES = ["#4f7df3","#3dbe7c","#e8a33d","#e0628a","#9b6ce0","#38a8c8","#d4a03c","#7a8595"];
/* Palette chaleureuse. Le corail arrive en tête : c'est la couleur qui
   donne son caractère à l'application, et un accent froid par défaut
   refroidissait tout l'écran alors que le voyage est une aventure douce. */
const THEMES = [
  { a1:"#f0655c", a2:"#ff9a72" },   /* corail — défaut */
  { a1:"#dc9a2e", a2:"#f7cc63" },   /* or */
  { a1:"#e05f8a", a2:"#ff9dba" },   /* rose */
  { a1:"#9b6ce0", a2:"#c49bff" },   /* violet */
  { a1:"#2fb37a", a2:"#6fe0ac" },   /* vert */
  { a1:"#3d92e6", a2:"#7ec6ff" },   /* bleu */
];
/* teinte de cape assortie au thème */
const CLOAKS = [
  ["#d4574e","#8f342d","#f0c25e"], ["#d4894a","#8f5528","#5fa8c0"],
  ["#d4628a","#8f3f5e","#f0c25e"], ["#8b6cd0","#584596","#f0a05e"],
  ["#4aa87a","#2c6b4c","#e8a04a"], ["#5b7fd4","#39548f","#e8836b"],
];

const QUOTES = [
  "Chaque petit pas compte.", "La régularité bat l'intensité.", "Un jour à la fois.",
  "Tu construis la personne que tu deviens.", "Mieux vaut 1 % chaque jour que 100 % un jour.",
  "Ton rythme, pas celui des autres.", "Se reposer fait aussi partie du chemin.",
  "Les habitudes sont des votes pour ton futur toi.", "Rater un jour n'efface rien.",
  "Sois fière du chemin parcouru.", "Petit aujourd'hui, immense dans un an.",
  "La douceur dure plus longtemps que la discipline.", "Le plus dur est déjà fait : commencer.",
  "Prends soin de toi comme d'une amie.",
];

const SUGGEST = [
  { icon:"water",    name:"Boire 1,5 L d'eau",      diff:1 },
  { icon:"walk",     name:"Marcher 10 minutes",     diff:2 },
  { icon:"meditate", name:"5 min de respiration",   diff:1 },
  { icon:"salad",    name:"Un fruit ou un légume",  diff:1 },
  { icon:"sleep",    name:"Me coucher avant 23 h",  diff:2 },
  { icon:"book",     name:"Lire 10 pages",          diff:2 },
  { icon:"nophone",  name:"Pas d'écran au lit",     diff:3 },
  { icon:"write",    name:"Noter 3 gratitudes",     diff:1 },
  { icon:"broom",    name:"10 min de rangement",    diff:1 },
  { icon:"strength", name:"5 min de renforcement",  diff:2 },
  /* Les gestes du foyer : ce sont eux qui rapportent le tissu, et ils
     donnent au campement sa raison d'être. */
  { icon:"bed",      name:"Faire mon lit",          diff:1 },
  { icon:"broom",    name:"Faire la vaisselle",     diff:1 },
  { icon:"shower",   name:"Aérer les pièces",       diff:1 },
];

/* Objectifs proposés au premier lancement. Chacun amorce deux ou trois
   habitudes — assez pour démarrer, jamais assez pour écraser. */
const GOALS = [
  { id:"move",   icon:"walk",     name:"Bouger chaque jour",
    line:"Marche, étirements, renforcement",
    habits:[{ icon:"walk", name:"Marcher 10 minutes", diff:2 },
            { icon:"strength", name:"5 min de renforcement", diff:2 }] },
  { id:"screen", icon:"nophone",  name:"Moins d'écrans",
    line:"Reprendre la main sur son temps",
    habits:[{ icon:"nophone", name:"Pas d'écran au lit", diff:3 },
            { icon:"nophone", name:"30 min sans téléphone", diff:2 }] },
  { id:"water",  icon:"water",    name:"Boire plus d'eau",
    line:"Un réflexe simple, un effet rapide",
    habits:[{ icon:"water", name:"Boire 1,5 L d'eau", diff:1 }] },
  { id:"sleep",  icon:"sleep",    name:"Mieux dormir",
    line:"Des soirées calmes, des matins clairs",
    habits:[{ icon:"sleep", name:"Me coucher avant 23 h", diff:2 },
            { icon:"moon", name:"Écrans éteints 30 min avant", diff:2 }] },
  { id:"eat",    icon:"salad",    name:"Manger mieux",
    line:"Sans régime et sans culpabilité",
    habits:[{ icon:"salad", name:"Un fruit ou un légume", diff:1 },
            { icon:"coffee", name:"Un vrai petit-déjeuner", diff:1 }] },
  { id:"calm",   icon:"meditate", name:"Apaiser le mental",
    line:"Respirer, ralentir, souffler",
    habits:[{ icon:"meditate", name:"5 min de respiration", diff:1 },
            { icon:"write", name:"Noter 3 gratitudes", diff:1 }] },
  { id:"learn",  icon:"book",     name:"Nourrir l'esprit",
    line:"Lire, apprendre, créer",
    habits:[{ icon:"book", name:"Lire 10 pages", diff:2 }] },
  { id:"home",   icon:"broom",    name:"Un intérieur clair",
    line:"Dix minutes suffisent",
    habits:[{ icon:"broom", name:"10 min de rangement", diff:1 },
            { icon:"bed", name:"Faire mon lit", diff:1 }] },
];
const goalById = id => GOALS.find(g => g.id === id);

const TITLES = [
  [20,"Légende du chemin"], [16,"Maître du rythme"], [12,"Inarrêtable"],
  [8,"Voyageur aguerri"], [5,"Marcheur assidu"], [3,"En route"], [1,"Premiers pas"],
];

const TROPHIES = [
  { icon:"seed",      name:"Premier pas",       stat:"done",   goal:1 },
  { icon:"check",     name:"10 coches",         stat:"done",   goal:10 },
  { icon:"hundred",   name:"100 coches",        stat:"done",   goal:100 },
  { icon:"trophy",    name:"500 coches",        stat:"done",   goal:500 },
  { icon:"flame",     name:"3 jours de suite",  stat:"best",   goal:3 },
  { icon:"bolt",      name:"7 jours de suite",  stat:"best",   goal:7 },
  { icon:"star",      name:"30 jours de suite", stat:"best",   goal:30 },
  { icon:"gem",       name:"1 jour parfait",    stat:"perf",   goal:1 },
  { icon:"calendar",  name:"7 jours parfaits",  stat:"perf",   goal:7 },
  { icon:"crown",     name:"30 jours parfaits", stat:"perf",   goal:30 },
  { icon:"rocket",    name:"Niveau 5",          stat:"lvl",    goal:5 },
  { icon:"medal",     name:"Niveau 10",         stat:"lvl",    goal:10 },
  { icon:"badge",     name:"Niveau 20",         stat:"lvl",    goal:20 },
  { icon:"books",     name:"5 habitudes",       stat:"habits", goal:5 },
  { icon:"snowflake", name:"3 gels en réserve", stat:"freeze", goal:3 },
  { icon:"flag",      name:"5 défis réussis",   stat:"chal",   goal:5 },
  { icon:"boot",      name:"10 obstacles",      stat:"obs",    goal:10 },
  { icon:"globe",     name:"5 paysages",        stat:"biomes", goal:5 },
  { icon:"mountain",  name:"10 paysages",       stat:"biomes", goal:10 },
  { icon:"compass",   name:"250 pas",           stat:"steps",  goal:250 },
];

const CHALLENGES = [
  { icon:"calendar", name:"Semaine régulière", desc:"Coche au moins une habitude 5 jours différents", goal:5,  xp:40, kind:"days" },
  { icon:"gem",      name:"Perfectionniste",   desc:"Réussis 3 journées parfaites cette semaine",     goal:3,  xp:50, kind:"perfect" },
  { icon:"star",     name:"Collectionneuse",   desc:"Coche 15 habitudes au fil de la semaine",        goal:15, xp:40, kind:"checks" },
];

/* ---------------------------------------------------------
   Obstacles — générés, pas écrits à la main : le catalogue
   grandit avec le monde (voir DESIGN.md §6).
   --------------------------------------------------------- */
const OB_POOL = [
  { scene:"rockfall",   icon:"rocks",     name:"Éboulement sur le sentier" },
  { scene:"river",      icon:"river",     name:"La rivière a débordé" },
  { scene:"bridge",     icon:"bridge",    name:"Le pont est brisé" },
  { scene:"darkforest", icon:"darkwood",  name:"La forêt sombre" },
  { scene:"bear",       icon:"bear",      name:"Un ours barre la route" },
  { scene:"storm",      icon:"storm",     name:"La tempête se lève" },
  { scene:"ice",        icon:"ice",       name:"Un mur de glace" },
  { scene:"chasm",      icon:"chasm",     name:"Une faille profonde" },
  { scene:"avalanche",  icon:"avalanche", name:"Une coulée de neige" },
];
const OB_BIG = [
  { scene:"door",   icon:"door",   name:"La porte antique" },
  { scene:"dragon", icon:"dragon", name:"Un dragon endormi" },
  { scene:"sea",    icon:"boat",   name:"La grande traversée" },
  { scene:"storm",  icon:"storm",  name:"Le passage de la tempête" },
];
const TASKS = [
  "10 squats sur une chaise",
  "30 secondes de gainage sur les genoux",
  "20 montées de genoux, tranquillement",
  "10 respirations lentes et profondes",
  "un grand verre d'eau, bu doucement",
  "30 secondes d'équilibre sur un pied",
  "15 montées sur la pointe des pieds",
  "30 secondes de cercles de bras",
  "10 pompes contre un mur",
  "1 minute d'étirement du dos",
  "2 minutes de marche sur place",
  "20 secondes d'étirement de chaque côté",
];

const OBSTACLES = (function () {
  const out = [];
  const segments = Odyssey.BIOMES.length * 2;   /* 900 pas de contenu */
  for (let s = 0; s < segments; s++) {
    const base = s * SEG;
    [9, 17].forEach((off, j) => {
      const i = out.length;
      const P = OB_POOL[(s * 2 + j) % OB_POOL.length];
      /* Un petit obstacle se franchit toujours le jour même : un défi
         physique, rien d'autre. Le bloquer derrière un niveau ou une série
         qu'on ne peut pas atteindre aujourd'hui rendait l'effort invisible
         — on cochait sans que le voyageur avance d'un pas. */
      out.push({ id: "o" + s + "_" + j, pos: base + off, xp: 15 + Math.floor(i / 5) * 5,
                 scene: P.scene, icon: P.icon, name: P.name, reqs: [],
                 task: TASKS[i % TASKS.length] });
    });
    const B = OB_BIG[s % OB_BIG.length];
    const big = {
      id: "b" + s, pos: base + SEG, big: true, xp: 45 + s * 5,
      scene: B.scene, icon: B.icon, name: B.name,
      task: TASKS[(s * 5 + 3) % TASKS.length] + " puis " + TASKS[(s * 7 + 1) % TASKS.length],
      reqs: [{ t: "level", n: 2 + Math.round(s * 1.15) }],
    };
    if (s >= 2) big.reqs.push({ t: "streak", n: Math.min(3 + Math.floor(s / 3), 12) });
    out.push(big);
  }
  return out.sort((a, b) => a.pos - b.pos);
})();

/* ---------------------------------------------------------
   État
   --------------------------------------------------------- */
/* Anciennes silhouettes → personnages nommés. Déclaré ici, avant
   `load()` : une constante déclarée plus bas serait dans sa zone morte
   temporelle au moment de la migration. */
const BODY_MIGRATION = { n: "explorateur", f: "gardienne", m: "brumes" };

function blank() {
  return {
    xp: 0, done: 0, perf: 0, best: 0,
    steps: 0, passed: [],
    freeze: 1, frozenDays: [], processed: null,
    milestones: [], challenges: {},
    theme: 0,
    notice: 0, softReset: false,
    look: Hero.defaultLook(),
    goals: [], onboarded: false,
    gold: 0,
    found: [],
    res: { bois: 0, pierre: 0, tissu: 0 },
    base: { fire: 0, bed: 0, shelter: 0, store: 0, table: 0, garden: 0 },
    name: "",
    prefs: { appearance: "auto", haptics: true, sound: true, motion: false },
    habits: [], log: {},
  };
}
let S = load();
const taskDone = new Set();   /* défis physiques validés, session courante */

/* Un échec de migration ne doit JAMAIS effacer les habitudes : on retombe
   sur les données brutes, jamais sur un état vierge. */
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  if (raw) {
    let parsed = null;
    try { parsed = Object.assign(blank(), JSON.parse(raw)); } catch (e) {}
    if (parsed) {
      try { return migrate(parsed); }
      catch (e) { console.warn("Odyssée : migration impossible, données conservées", e); return parsed; }
    }
  }
  try {
    const old = localStorage.getItem("rituels.v1");
    if (old) return migrate(fromRituels(JSON.parse(old)));
  } catch (e) {}
  return blank();
}
/* reprise des données de la version précédente */
function fromRituels(p) {
  const EM = { "💧":"water","🚶‍♀️":"walk","🏃‍♀️":"run","🧘‍♀️":"meditate","💪":"strength",
    "🚴‍♀️":"bike","🥗":"salad","🍎":"fruit","😴":"sleep","🛌":"bed","📖":"book","✍️":"write",
    "🦷":"tooth","🚿":"shower","🌞":"sun","🌙":"moon","💊":"pill","📵":"nophone","🧹":"broom",
    "🎹":"music","🗣️":"speak","☕":"coffee","🐶":"dog","❤️":"heart" };
  const s = blank();
  s.xp = p.xp || 0; s.done = p.totalDone || 0; s.perf = p.perfectDays || 0;
  s.best = p.bestStreak || 0; s.steps = p.journeySteps || p.totalDone || 0;
  s.freeze = p.freezes == null ? 1 : p.freezes;
  s.frozenDays = p.freezeDays || []; s.processed = p.processedUntil || null;
  s.milestones = p.milestones || []; s.challenges = p.challenges || {};
  s.theme = p.accent || 0; s.log = p.completions || {};
  s.habits = (p.habits || []).map((h, i) => ({
    id: h.id, name: h.name, icon: EM[h.emoji] || ICON_SET[i % ICON_SET.length],
    hue: h.color || HUES[i % HUES.length], diff: h.diff || 2, days: h.days || [0,1,2,3,4,5,6],
  }));
  return s;
}
function migrate(s) {
  if (!s.look) s.look = Hero.defaultLook();
  else s.look = Object.assign(Hero.defaultLook(), s.look);
  if (BODY_MIGRATION[s.look.body]) s.look.body = BODY_MIGRATION[s.look.body];
  if (!Array.isArray(s.goals)) s.goals = [];
  /* L'or récompense l'effort déjà fourni : un compte existant ne repart pas
     de zéro, il retrouve la contrepartie de son parcours. */
  if (typeof s.gold !== "number") s.gold = (s.done || 0) * 3 + (s.perf || 0) * 10;
  if (typeof s.name !== "string") s.name = "";
  if (!Array.isArray(s.found)) s.found = [];
  s.res = Object.assign({ bois: 0, pierre: 0, tissu: 0 }, s.res || {});
  s.base = Object.assign({ fire: 0, bed: 0, shelter: 0, store: 0, table: 0, garden: 0 },
    s.base || {});
  /* on complète les préférences plutôt que de les remplacer : une clé
     ajoutée plus tard ne doit pas effacer les choix déjà faits */
  s.prefs = Object.assign({ appearance: "auto", haptics: true, sound: true, motion: false },
    s.prefs || {});
  /* Un compte déjà en route ne repasse pas par le premier lancement. */
  if (!s.onboarded) s.onboarded = s.habits.length > 0 || s.done > 0;
  s.habits.forEach((h, i) => {
    if (!h.icon) h.icon = ICON_SET[i % ICON_SET.length];
    if (!h.hue) h.hue = HUES[i % HUES.length];
  });
  return s;
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

/* ---------- dates ---------- */
const key = (d = new Date()) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const fromK = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const wd = (d = new Date()) => (d.getDay() + 6) % 7;
const shift = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = (d = new Date()) => shift(d, -wd(d));
const wkKey = (d = new Date()) => key(monday(d));

/* ---------- niveaux ---------- */
const need = l => 40 + (l - 1) * 20;
function level(xp) {
  let l = 1, r = xp;
  while (r >= need(l)) { r -= need(l); l++; }
  return { l, into: r, need: need(l) };
}
const title = l => (TITLES.find(t => l >= t[0]) || TITLES[TITLES.length - 1])[1];

/* ---------- habitudes ---------- */
const logOf = k => S.log[k] || [];
const isDone = (h, k) => logOf(k).includes(h.id);
const onDay = (h, d) => h.days.includes(wd(d));
const forDay = d => S.habits.filter(h => onDay(h, d));
function perfect(d) {
  const hs = forDay(d);
  if (!hs.length) return false;
  const l = logOf(key(d));
  return hs.every(h => l.includes(h.id));
}

/* gels : protègent la série sans jamais punir */
function processMissed() {
  const today = key();
  if (!S.processed) { S.processed = today; save(); return; }
  if (S.processed >= today) return;
  let d = shift(fromK(S.processed), 1);
  while (key(d) < today) {
    const k = key(d);
    if (!logOf(k).length && !S.frozenDays.includes(k)) {
      if (!forDay(d).length) { if (S.habits.length) S.frozenDays.push(k); }
      else if (S.freeze > 0) { S.freeze--; S.frozenDays.push(k); S.notice++; }
      else if (S.done > 0) S.softReset = true;
    }
    d = shift(d, 1);
  }
  if (S.frozenDays.length > 400) S.frozenDays = S.frozenDays.slice(-400);
  S.processed = today;
  save();
}

function streak() {
  let n = 0, d = new Date();
  if (!logOf(key(d)).length) d = shift(d, -1);
  for (let i = 0; i < 1000; i++) {
    const k = key(d);
    if (logOf(k).length) n++;
    else if (!S.frozenDays.includes(k)) break;
    d = shift(d, -1);
  }
  return n;
}
function hStreak(h) {
  let n = 0, d = new Date();
  if (onDay(h, d) && !isDone(h, key(d))) d = shift(d, -1);
  for (let i = 0; i < 730; i++) {
    if (onDay(h, d)) {
      if (isDone(h, key(d))) n++;
      else if (!S.frozenDays.includes(key(d))) break;
    }
    d = shift(d, -1);
  }
  return n;
}
const countPerfect = () => Object.keys(S.log).filter(k => perfect(fromK(k))).length;

/* ---------- défi hebdomadaire ---------- */
function challenge() {
  return CHALLENGES[Math.floor(monday().getTime() / (7 * 864e5)) % CHALLENGES.length];
}
function chalProgress(c) {
  const m = monday();
  let days = 0, perf = 0, checks = 0;
  for (let i = 0; i < 7; i++) {
    const d = shift(m, i);
    if (key(d) > key()) break;
    const n = logOf(key(d)).length;
    if (n) days++;
    checks += n;
    if (perfect(d)) perf++;
  }
  return c.kind === "days" ? days : c.kind === "perfect" ? perf : checks;
}

/* ---------- voyage ---------- */
function journey() {
  const passed = new Set(S.passed);
  const last = OBSTACLES.filter(o => passed.has(o.id)).reduce((m, o) => Math.max(m, o.pos), 0);
  const next = OBSTACLES.find(o => !passed.has(o.id));
  const base = Math.max(S.steps, last);
  const pos = next ? Math.min(base, next.pos) : base;
  return { pos, next, blocked: !!next && base >= next.pos };
}
/* =========================================================
   EXPÉDITIONS
   La journée n'est plus une liste de cases. C'est une portion
   de route nommée, avec une distance, et des lieux qu'on voit
   venir de loin.

   Toute la mécanique tient dans une idée : rendre visible ce
   qui est à quelques pas. On ne coche pas une habitude de plus
   pour la case — on la coche parce que le coffre est à trois
   pas et qu'on veut savoir ce qu'il y a dedans.
   ========================================================= */

/* Découvertes. Elles ne bloquent JAMAIS la route : les croiser suffit.
   C'est ce qui les distingue des obstacles et les rend gratuites — une
   surprise qui empêcherait d'avancer cesserait d'être une surprise. */
const DISC_NAMES = {
  flore: ["Orchidée de brume", "Lys des névés", "Fougère argentée", "Bruyère pourpre",
          "Sauge sauvage", "Iris des mares", "Chardon doré", "Ancolie bleue"],
  vue: ["Belvédère du col", "Corniche des vents", "Promontoire nord", "Rocher penché",
        "Terrasse d'ardoise", "Balcon des cimes", "Éperon calcaire", "Table d'orientation"],
  faune: ["Renard roux", "Chouette hulotte", "Chevreuil craintif", "Héron cendré",
          "Lièvre variable", "Martre des pins", "Faucon crécerelle", "Salamandre tachetée"],
  ruine: ["Borne millénaire", "Chapelle effondrée", "Pont oublié", "Cairn de pierres",
          "Tour de guet", "Muret de berger", "Puits scellé", "Dolmen penché"],
};
const DISC_KINDS = [
  { k: "flore", icon: "seed",     label: "Flore" },
  { k: "vue",   icon: "mountain", label: "Panorama" },
  { k: "faune", icon: "bear",     label: "Faune" },
  { k: "ruine", icon: "door",     label: "Vestige" },
];
const CHEST_GOLD = 25;

/* Lieux d'une expédition, engendrés de façon déterministe : le même
   paysage offre toujours les mêmes découvertes, hier comme sur un autre
   téléphone. Rien n'est tiré au hasard au moment de jouer. */
const marksCache = new Map();
function marksOf(idx) {
  if (marksCache.has(idx)) return marksCache.get(idx);
  const rng = Odyssey.mulberry32(Odyssey.seedOf("exp|" + idx));
  const start = idx * SEG;
  const out = [];

  /* obstacles déjà en place, aux pas 9, 17 et 25 */
  OBSTACLES.forEach(o => {
    if (o.pos > start && o.pos <= start + SEG)
      out.push({ kind: "obstacle", id: o.id, pos: o.pos, icon: o.icon, name: o.name, ob: o });
  });

  /* Trois découvertes, placées AU MILIEU des trois intervalles laissés par
     les obstacles (9, 17, 25) plutôt que tirées au hasard. Un tirage libre
     produisait des trous de neuf pas — trois jours sans rien pour qui coche
     trois habitudes. Le léger décalage évite l'effet métronome. */
  const bands = [[3, 5], [12, 14], [19, 21]];
  for (let n = 0; n < 3; n++) {
    const band = bands[n];
    const s = band[0] + ((rng() * (band[1] - band[0] + 1)) | 0);
    const chest = rng() < .34;
    if (chest) {
      out.push({ kind: "chest", id: "c" + idx + "_" + n, pos: start + s,
                 icon: "gem", name: "Coffre oublié" });
    } else {
      const d = DISC_KINDS[(rng() * DISC_KINDS.length) | 0];
      const pool = DISC_NAMES[d.k];
      out.push({ kind: "find", id: "f" + idx + "_" + n, pos: start + s,
                 icon: d.icon, type: d.k, label: d.label,
                 name: pool[(rng() * pool.length) | 0] });
    }
  }
  out.sort((a, b) => a.pos - b.pos);
  marksCache.set(idx, out);
  return out;
}

/* L'expédition en cours : une traversée de paysage, plusieurs jours. */
function expedition(J) {
  const idx = Math.floor(J.pos / SEG);
  const biome = Odyssey.BIOMES[idx % Odyssey.BIOMES.length];
  const start = idx * SEG;
  return {
    idx, biome, start, end: start + SEG,
    walked: J.pos - start,
    left: start + SEG - J.pos,
    marks: marksOf(idx),
  };
}

/* Ramassage. Franchir le pas suffit — aucun geste supplémentaire, aucune
   fenêtre à ne pas rater. */
function collect(J, announce) {
  const ex = expedition(J);
  const fresh = [];
  /* On balaie TOUTE la route parcourue, pas seulement l'expédition en
     cours : une sauvegarde importée ou un long trajet rattrapé d'un coup
     doit retrouver ses découvertes, sinon le carnet reste vide sans raison
     visible. Les jalons sont mis en cache, le balayage ne coûte rien. */
  for (let i = 0; i <= ex.idx; i++) {
    marksOf(i).forEach(m => {
      if (m.kind === "obstacle") return;
      if (m.pos > J.pos) return;
      if (S.found.indexOf(m.id) !== -1) return;
      S.found.push(m.id);
      if (m.kind === "chest") S.gold += CHEST_GOLD;
      fresh.push(m);
    });
  }
  if (!fresh.length) return null;
  save();
  return announce ? fresh[fresh.length - 1] : null;
}

const reqLabel = r => r.t === "level" ? "Niveau " + r.n
  : r.t === "streak" ? "Série de " + r.n + " jours" : r.n + " habitudes cochées";
const reqNow = r => r.t === "level" ? level(S.xp).l : r.t === "streak" ? streak() : S.done;
const reqOk = r => reqNow(r) >= r.n;

/* =========================================================
   Scène
   ========================================================= */
const $ = id => document.getElementById(id);
const ic = (n, o) => Icons.svg(n, o);
let scene = null;
/* Au tout premier rendu on ramasse en silence : sans ce garde-fou, un
   compte repris annoncerait vingt découvertes d'affilée. */
let booted = false;
let pendingFind = null;

function boot3D() {
  scene = Odyssey.createScene($("stage"), { look: S.look });
  /* Le préchargement est asynchrone : on redessine une fois les planches
     disponibles, sinon la garde-robe reste figée sur l'état vectoriel. */
  if (window.Sprites) {
    Sprites.preload(S.look).then(ok => { if (ok) render(); }).catch(() => {});
  }
  /* Décors illustrés : on ne charge que le biome courant. */
  if (window.Scenery) {
    const bi = Odyssey.BIOMES[Math.floor(journey().pos / SEG) % Odyssey.BIOMES.length];
    Scenery.preload(bi.id).catch(() => {});
  }
  scene.setSteps(journey().pos, true);
  scene.start();
  window.addEventListener("resize", () => scene.resize());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) scene.stop();
    else { scene.start(); render(); }
  });
}

/* =========================================================
   Rendu
   ========================================================= */
function applyTheme() {
  const t = THEMES[S.theme] || THEMES[0];
  document.documentElement.style.setProperty("--a1", t.a1);
  document.documentElement.style.setProperty("--a2", t.a2);
  if (scene) scene.setLook(S.look);
}

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtDays = d => d.length === 7 ? "Tous les jours"
  : d.slice().sort((a, b) => a - b).map(i => ["lun","mar","mer","jeu","ven","sam","dim"][i]).join(" · ");

function render() {
  processMissed();
  applyTheme();
  const today = new Date(), k = key(today);
  const L = level(S.xp), st = streak();
  const J = journey();

  if (scene) {
    scene.setSteps(J.pos);
    scene.setBlocked(J.blocked, J.next ? J.next.scene : null,
      J.next ? J.next.pos - J.pos : 99);
  }

  /* — en-tête — */
  const ds = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  $("dateLine").textContent = ds[0].toUpperCase() + ds.slice(1);
  $("phaseLine").innerHTML = ic("clock", { size: 15 }) + "<span>" + (scene ? scene.phaseLabel() : "") + "</span>";

  /* — bandeau de la scène — */
  const biome = Odyssey.BIOMES[Math.floor(J.pos / SEG) % Odyssey.BIOMES.length];
  const tour = Math.floor(J.pos / (SEG * Odyssey.BIOMES.length));
  $("wPlace").textContent = biome.name;
  $("wSub").textContent = J.pos + " pas" + (tour ? " · tour " + (tour + 1) : "");
  /* Les pastilles ne sont réécrites que si leur contenu change : sinon on
     relance l'animation des compteurs à chaque rendu, et le mouvement
     permanent cesse d'attirer l'œil quand il compte vraiment. */
  const pills = $("wPills");
  const sig = st + "|" + S.freeze + "|" + S.gold;
  if (pills.dataset.sig !== sig) {
    if (!pills.firstChild) {
      pills.innerHTML =
        '<span class="w-pill">' + ic("flame", { size: 13 }) + '<b class="roll">0</b></span>' +
        '<span class="w-pill">' + ic("snowflake", { size: 13 }) + '<b class="roll">0</b></span>' +
        '<span class="w-pill gold">' + ic("gem", { size: 13 }) + '<b class="roll">0</b></span>';
    }
    const rs = pills.querySelectorAll(".roll");
    roll(rs[0], st); roll(rs[1], S.freeze); roll(rs[2], S.gold);
    pills.dataset.sig = sig;
  }

  const todays = forDay(today);
  const doneN = todays.filter(h => isDone(h, k)).length;
  $("wOrb").textContent = L.l;
  $("wTitle").textContent = title(L.l);
  $("wMeta").textContent = L.into + " / " + L.need + " XP";
  $("wRing").textContent = doneN + "/" + todays.length;
  $("wXp").style.width = Math.round(L.into / L.need * 100) + "%";

  renderHeroScreen(L, st, J);
  /* Ramassage avant l'affichage, pour que la carte montre déjà le jalon
     comme atteint quand la découverte s'annonce. */
  const found = collect(J, booted);
  if (found) pendingFind = found;

  renderRoute(J);
  renderMini(J);
  renderObstacle(J);
  renderCarnet(J);
  renderCamp();
  renderChallenge();
  renderToday(todays, k);
  renderHabits();
  renderGoalTags();
  renderProgress(L, st, J);
  renderProfile(L, J);
  renderNotices(st);
}

/* ---------- obstacle ---------- */
/* ---------------------------------------------------------
   La carte de route
   Le seul écran qui compte. On y lit d'un coup d'œil où l'on
   est, ce qui arrive, et dans combien de pas.
   --------------------------------------------------------- */
/* Ce qu'on annonce d'un lieu qu'on n'a pas encore atteint. On dit sa
   NATURE, jamais son nom : savoir qu'un panorama attend à trois pas donne
   envie d'y aller, mais la surprise reste entière. Cacher jusqu'à la nature
   ne créerait qu'une répétition de « quelque chose ». */
function teaser(m, revealed) {
  if (m.kind === "obstacle") return m.name;
  if (revealed) return m.name;
  if (m.kind === "chest") return "Un coffre";
  return { flore: "Une plante inconnue", vue: "Un point de vue",
           faune: "Une créature", ruine: "Un vestige" }[m.type] || "Une découverte";
}

/* Bandeau compact. Il ne duplique pas la scène — il en montre le seul
   élément qui change quand on coche : la distance parcourue et ce qui
   arrive. C'est ce qui rend le progrès visible sans quitter la liste. */
function renderMini(J) {
  const bar = $("miniBar");
  if (!bar) return;
  const ex = expedition(J);
  const av = $("mbAv");
  const src = "assets/hero/thumb_" + S.look.body + ".png";
  if (av.getAttribute("src") !== src) { av.src = src; av.onerror = () => av.remove(); }

  const next = ex.marks.find(m => m.pos > J.pos);
  $("mbNext").textContent = next ? teaser(next, false) : "Le paysage suivant";
  $("mbDist").textContent = next ? (next.pos - J.pos) + " pas" : ex.left + " pas";
  $("mbFill").style.width = (clamp01(ex.walked / SEG) * 100).toFixed(1) + "%";

  const prev = +($("mbSteps").dataset.v || 0);
  roll($("mbSteps"), J.pos);
  /* le pas se voit : l'avatar avance d'un cran à chaque progression */
  if (J.pos > prev && prev && !reduceMotion()) {
    av.classList.remove("step");
    void av.offsetWidth;
    av.classList.add("step");
  }
}

function renderRoute(J) {
  const slot = $("routeSlot");
  if (!slot) return;
  const ex = expedition(J);
  const pct = clamp01(ex.walked / SEG) * 100;

  /* Les jalons sont placés à leur distance réelle sur la ligne : la
     position du coffre à l'écran EST sa position sur la route. Aucune
     abstraction entre ce qu'on voit et ce qui se passe. */
  const pins = ex.marks.map(m => {
    const at = clamp01((m.pos - ex.start) / SEG) * 100;
    const done = m.kind === "obstacle"
      ? S.passed.indexOf(m.id) !== -1
      : S.found.indexOf(m.id) !== -1;
    return '<span class="rt-pin ' + m.kind + (done ? " on" : "") +
      '" style="left:' + at.toFixed(1) + '%" title="' + esc(teaser(m, done)) + '">' +
      ic(m.icon, { size: 13 }) + "</span>";
  }).join("");

  /* les trois prochains jalons, en clair */
  const next = ex.marks.filter(m => m.pos > J.pos).slice(0, 3).map(m =>
    '<div class="rn">' +
      '<span class="rn-i ' + m.kind + '">' + ic(m.icon, { size: 16 }) + "</span>" +
      "<b>" + esc(teaser(m, false)) + "</b>" +
      "<em>" + (m.pos - J.pos) + " pas</em></div>").join("");

  slot.innerHTML =
    '<div class="glass route">' +
      '<div class="rt-h">' +
        '<div><div class="rt-e">Expédition ' + (ex.idx + 1) + "</div>" +
        "<b>" + esc(ex.biome.name) + "</b>" +
        "<span>" + (ex.left > 0
          ? ex.left + " pas avant le paysage suivant"
          : "Paysage traversé") + "</span></div>" +
        '<div class="rt-d"><b>' + ex.walked + "</b><em>/" + SEG + "</em></div>" +
      "</div>" +
      '<div class="rt-line">' +
        '<i class="rt-fill" style="width:' + pct.toFixed(1) + '%"></i>' +
        pins +
        '<span class="rt-me" style="left:' + pct.toFixed(1) + '%"></span>' +
      "</div>" +
      (next ? '<div class="rt-next">' + next + "</div>"
            : '<div class="rt-empty">Plus rien devant toi : le paysage suivant se dessine.</div>') +
    "</div>";
}

/* ---------------------------------------------------------
   Carnet de voyage
   Une seule collection, pas huit. Chaque case vide dit où
   aller la remplir : c'est une carte au trésor, pas un
   inventaire.
   --------------------------------------------------------- */
function renderCarnet(J) {
  const g = $("carnetGrid");
  if (!g) return;
  const ex = expedition(J);

  /* On ne montre que la route déjà parcourue et celle en cours. Étaler les
     quarante lieux du monde entier donnerait un mur de cases vides — c'est
     décourageant, et ça éventerait la surprise des paysages à venir. */
  const list = [];
  for (let i = 0; i <= ex.idx; i++) {
    const b = Odyssey.BIOMES[i % Odyssey.BIOMES.length];
    marksOf(i).forEach(m => {
      if (m.kind !== "find") return;
      list.push({ m, biome: b, on: S.found.indexOf(m.id) !== -1 });
    });
  }
  const got = list.filter(f => f.on).length;
  $("carnetN").textContent = String(got);

  if (!list.length) {
    g.innerHTML = '<div class="cn-empty">Ton carnet est encore vierge. ' +
      "Les premières découvertes t'attendent sur la route.</div>";
    return;
  }
  /* Trouvées en tête, de la plus récente à la plus ancienne ; les lieux
     encore devant ferment la marche. Le carnet s'ouvre sur ce qu'on a fait,
     pas sur ce qu'il reste — et se termine par ce qui donne envie. */
  const ordered = list.filter(f => f.on).reverse().concat(list.filter(f => !f.on));
  g.innerHTML = ordered.map(f =>
    '<div class="cn' + (f.on ? " on" : "") + '">' +
      '<span class="cn-i">' + ic(f.on ? f.m.icon : "spark", { size: 19 }) + "</span>" +
      "<b>" + esc(f.on ? f.m.name : teaser(f.m, false)) + "</b>" +
      "<em>" + esc(f.biome.name) + "</em></div>").join("");
}

function renderObstacle(J) {
  const slot = $("obSlot");
  if (!J.blocked || !J.next) { slot.innerHTML = ""; return; }
  const o = J.next;
  const ok = o.reqs.every(reqOk);
  const tOk = !o.task || taskDone.has(o.id);
  const can = ok && tOk;
  slot.innerHTML =
    '<div class="glass ob">' +
      '<div class="ob-h">' +
        '<div class="ob-i">' + ic(o.icon, { size: 23 }) + "</div>" +
        '<div class="ob-t"><b>' + o.name + "</b><span>" +
          (o.big ? "Passage majeur — ouvre un nouveau paysage" : "Le voyageur ne peut pas passer") +
        "</span></div>" +
        '<div class="ob-xp">+' + o.xp + " XP</div>" +
      "</div>" +
      (o.reqs.length ? '<div class="reqs">' + o.reqs.map(r =>
        '<span class="req' + (reqOk(r) ? " ok" : "") + '">' +
        (reqOk(r) ? ic("check", { size: 13 }) : "") + reqLabel(r) +
        (reqOk(r) ? "" : " · " + reqNow(r) + "/" + r.n) + "</span>").join("") + "</div>" : "") +
      (o.task ? '<button class="task' + (tOk ? " done" : "") + '" id="obTask">' +
        '<span class="tk">' + ic("check", { size: 12 }) + "</span>" +
        "<span>" + (tOk ? "Fait : " : "Défi à relever : ") + o.task + "</span></button>" : "") +
      '<button class="go" id="obGo"' + (can ? "" : " disabled") + ">" +
        /* Dire ce qui manque exactement. « Il te manque encore un peu »
           devant un défi qu'on peut relever tout de suite laisse croire à
           un blocage alors qu'il suffit de bouger. */
        (can ? "Franchir l'obstacle"
             : !tOk && ok ? "Relève le défi pour passer"
             : "Il te manque encore un peu") + "</button>" +
      /* Devant un passage majeur, les habitudes cochées ne font plus
         avancer le voyageur. Le dire, et les compter : un effort mis en
         réserve reste un effort, un effort invisible décourage. */
      (S.steps > J.pos
        ? '<div class="banked">' + ic("boot", { size: 14 }) +
          "<span><b>" + (S.steps - J.pos) + " pas</b> en réserve, " +
          "dépensés dès l'obstacle franchi.</span></div>"
        : "") +
    "</div>";

  const tb = $("obTask");
  if (tb) tb.onclick = () => {
    taskDone.has(o.id) ? taskDone.delete(o.id) : taskDone.add(o.id);
    buzz(10);
    render();
  };
  const gb = $("obGo");
  if (gb) gb.onclick = () => { if (!gb.disabled) pass(o); };
}

function pass(o) {
  S.passed.push(o.id);
  S.xp += o.xp;
  taskDone.delete(o.id);
  save();
  if (scene) scene.leap();
  sparks();
  render();
  if (o.big) {
    const nb = Odyssey.BIOMES[Math.floor(o.pos / SEG) % Odyssey.BIOMES.length];
    alertBox("compass", "Nouveau paysage", "« " + o.name + " » franchi. Le voyageur entre dans : " + nb.name + ". +" + o.xp + " XP.");
  } else {
    alertBox(o.icon, "Obstacle franchi", "« " + o.name + " » est derrière toi. +" + o.xp + " XP, la route continue.");
  }
}

/* ---------- défi ---------- */
function renderChallenge() {
  const c = challenge();
  const p = Math.min(chalProgress(c), c.goal);
  const won = S.challenges[wkKey()] === true;
  $("chalCard").className = "glass chal" + (won ? " won" : "");
  $("chalCard").innerHTML =
    '<div class="chal-i">' + ic(c.icon, { size: 21 }) + "</div>" +
    '<div class="chal-b">' +
      '<div class="chal-n"><b>' + c.name + "</b><span>" + (won ? "Réussi · +" + c.xp : "+" + c.xp + " XP") + "</span></div>" +
      '<div class="chal-d">' + c.desc + "</div>" +
      '<div class="bar"><i style="width:' + Math.round(p / c.goal * 100) + '%"></i></div>' +
      '<div class="chal-c">' + p + " / " + c.goal + "</div>" +
    "</div>";
}

/* ---------- habitudes du jour ---------- */
/* Le gain de matériaux, affiché sur chaque habitude. Sans lui, le lien
   entre ce qu'on coche et ce qu'on construit reste à deviner : la règle est
   simple mais elle doit être lisible, pas devinée. */
function resTag(h) {
  const r = RES.find(q => q.k === resOf(h));
  return '<span class="rtag ' + r.k + '">' + ic(r.icon, { size: 12 }) + "+1</span>";
}

function renderToday(todays, k) {
  const box = $("todayRows");
  if (!todays.length) {
    box.innerHTML = '<div class="empty"><div class="empty-i">' + ic("seed", { size: 27 }) + "</div>" +
      "<p>Aucune habitude prévue aujourd'hui.<br>Ajoute ta première habitude pour faire avancer le voyageur.</p>" +
      '<button class="go" id="emptyAdd">Créer une habitude</button></div>';
    const b = $("emptyAdd");
    if (b) b.onclick = () => { go("habits"); openSheet(null); };
    return;
  }
  /* Les habitudes cochées descendent en bas de liste. Ce qui reste à faire
     remonte sous le pouce, et la liste raccourcit visiblement au lieu de
     rester figée — le progrès se lit sans compter. */
  const order = todays.slice().sort((a, b) =>
    (isDone(a, k) ? 1 : 0) - (isDone(b, k) ? 1 : 0));
  box.innerHTML = order.map((h, i) => {
    const d = isDone(h, k), s = hStreak(h);
    return '<div class="row' + (d ? " done" : "") + '" data-id="' + h.id + '" style="animation-delay:' + (i * 40) + 'ms">' +
      '<div class="row-i" style="background:' + h.hue + '1f;color:' + h.hue + '">' + ic(h.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + esc(h.name) + "</div>" +
      '<div class="row-m"><span>+' + XP[h.diff] + " XP</span>" + resTag(h) +
      (s > 1 ? '<span class="fl">' + ic("flame", { size: 12 }) + s + "</span>" : "") + "</div></div>" +
      '<div class="tick">' + ic("check", { size: 14 }) + "</div></div>";
  }).join("");
  box.querySelectorAll(".row").forEach(el => {
    el.onclick = () => {
      /* la récompense part de la coche elle-même, pas d'un coin de l'écran */
      const t = el.querySelector(".tick").getBoundingClientRect();
      toggle(S.habits.find(h => h.id === el.dataset.id),
        { x: t.left + t.width / 2, y: t.top + t.height / 2 });
    };
  });
}

/* ---------- gestion des habitudes ---------- */
function renderHabits() {
  const box = $("habitRows");
  if (!S.habits.length) {
    box.innerHTML = '<div class="empty"><div class="empty-i">' + ic("spark", { size: 27 }) + "</div>" +
      "<p>Crée tes propres habitudes,<br>ou pioche dans les suggestions ci-dessous.</p></div>";
  } else {
    box.innerHTML = S.habits.map((h, i) =>
      '<div class="row" data-id="' + h.id + '" style="animation-delay:' + (i * 35) + 'ms">' +
      '<div class="row-i" style="background:' + h.hue + '1f;color:' + h.hue + '">' + ic(h.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + esc(h.name) + "</div>" +
      '<div class="row-m"><span>' + fmtDays(h.days) + " · +" + XP[h.diff] + " XP</span>" + resTag(h) +
      '<span class="fl">' + ic("flame", { size: 12 }) + hStreak(h) + "</span></div></div>" +
      '<div class="chev">' + ic("chevron", { size: 17 }) + "</div></div>").join("");
    box.querySelectorAll(".row").forEach(el => {
      el.onclick = () => openSheet(S.habits.find(h => h.id === el.dataset.id));
    });
  }
  $("suggRows").innerHTML = SUGGEST.map((s, i) => {
    const has = S.habits.some(h => h.name === s.name);
    return '<div class="row" style="cursor:default">' +
      '<div class="row-i" style="background:' + HUES[i % HUES.length] + '1f;color:' + HUES[i % HUES.length] + '">' +
      ic(s.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + s.name + "</div>" +
      '<div class="row-m"><span>+' + XP[s.diff] + " XP · tous les jours</span>" + resTag(s) + "</div></div>" +
      '<button class="add" data-i="' + i + '"' + (has ? " disabled" : "") + ">" + (has ? "Ajoutée" : "Ajouter") + "</button></div>";
  }).join("");
  $("suggRows").querySelectorAll(".add:not([disabled])").forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      const s = SUGGEST[+b.dataset.i];
      S.habits.push({ id: uid(), name: s.name, icon: s.icon, hue: HUES[+b.dataset.i % HUES.length], diff: s.diff, days: [0,1,2,3,4,5,6] });
      save(); render();
    };
  });
}

/* ---------- progrès ---------- */
/* jalons servant aux déblocages du héros */
function unlockStats(L, st, J) {
  return { level: L.l, steps: J.pos, streak: st, perfect: S.perf,
           obstacles: S.passed.length,
           biomes: Math.min(Odyssey.BIOMES.length, Math.floor(J.pos / SEG) + 1) };
}

function renderProgress(L, st, J) {
  $("pOrb").textContent = L.l;
  $("pTitle").textContent = title(L.l);
  $("pSub").textContent = L.into + " / " + L.need + " XP avant le niveau " + (L.l + 1);
  $("pXp").style.width = Math.round(L.into / L.need * 100) + "%";

  const T = {
    done: S.done, best: S.best, perf: S.perf, lvl: L.l,
    habits: S.habits.length, freeze: S.freeze, steps: J.pos,
    chal: Object.values(S.challenges).filter(Boolean).length,
    obs: S.passed.length,
    biomes: Math.min(Odyssey.BIOMES.length, Math.floor(J.pos / SEG) + 1),
  };

  const locked = TROPHIES.filter(t => T[t.stat] < t.goal)
    .sort((a, b) => (T[b.stat] / b.goal) - (T[a.stat] / a.goal));
  if (!locked.length) {
    $("nextCard").className = "glass next";
    $("nextCard").innerHTML = '<div class="next-i">' + ic("trophy", { size: 22 }) + "</div>" +
      '<div class="next-b"><div class="next-n">Tous les trophées obtenus</div>' +
      '<div class="next-s">Chapeau bas.</div></div>';
  } else {
    const n = locked[0], cur = T[n.stat];
    $("nextCard").className = "glass next";
    $("nextCard").innerHTML = '<div class="next-i">' + ic(n.icon, { size: 22 }) + "</div>" +
      '<div class="next-b"><div class="next-n">' + n.name + "</div>" +
      '<div class="next-s">' + cur + " / " + n.goal + " — plus que " + (n.goal - cur) + "</div>" +
      '<div class="bar"><i style="width:' + Math.round(cur / n.goal * 100) + '%"></i></div></div>';
  }

  const today = new Date();
  let bars = "";
  for (let i = 6; i >= 0; i--) {
    const d = shift(today, -i), hs = forDay(d);
    const n = logOf(key(d)).filter(id => hs.some(h => h.id === id)).length;
    const p = hs.length ? Math.round(n / hs.length * 100) : 0;
    const lab = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" }) + " : " + n + "/" + hs.length;
    bars += '<div class="' + (i === 0 ? "now" : "") + '" title="' + lab + '">' +
      '<div class="tr"><div class="fi" style="height:' + p + '%"></div></div>' +
      '<div class="lb">' + DAYS[wd(d)] + "</div></div>";
  }
  $("weekBars").innerHTML = bars;

  heatmap(today);

  roll($("stDone"), S.done);
  roll($("stXp"), S.xp);
  roll($("stBest"), S.best);
  roll($("stPerf"), S.perf);
  roll($("stGold"), S.gold);
  roll($("stBiomes"), Math.min(Odyssey.BIOMES.length, Math.floor(J.pos / SEG) + 1));

  $("troGrid").innerHTML = TROPHIES.map(t => {
    const w = T[t.stat] >= t.goal;
    return '<div class="' + (w ? "won" : "lock") + '"><div class="ti">' + ic(t.icon, { size: 22 }) + "</div>" +
      "<small>" + t.name + "</small></div>";
  }).join("");

  $("themeRow").innerHTML = THEMES.map((t, i) =>
    '<div class="dot' + (S.theme === i ? " on" : "") + '" data-i="' + i +
    '" style="background:linear-gradient(150deg,' + t.a2 + "," + t.a1 + ')"></div>').join("");
  $("themeRow").querySelectorAll(".dot").forEach(d => {
    d.onclick = () => { S.theme = +d.dataset.i; save(); render(); };
  });
}

function heatmap(today) {
  const H = ["rgba(61,190,124,.26)", "rgba(61,190,124,.5)", "rgba(61,190,124,.74)", "rgba(61,190,124,1)"];
  ["hl1","hl2","hl3","hl4"].forEach((id, i) => { $(id).style.background = H[i]; });
  const y = today.getFullYear(), m = today.getMonth();
  $("heatMonth").textContent = today.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate();
  let h = DAYS.map(l => '<div class="dw">' + l + "</div>").join("");
  for (let i = 0; i < wd(first); i++) h += '<div class="c void"></div>';
  for (let dd = 1; dd <= n; dd++) {
    const d = new Date(y, m, dd), k = key(d);
    if (k > key(today)) { h += '<div class="c fut"></div>'; continue; }
    const hs = forDay(d);
    const c = logOf(k).filter(id => hs.some(x => x.id === id)).length;
    const r = hs.length ? c / hs.length : 0;
    const bg = c === 0 ? "var(--fill)" : H[Math.min(3, Math.floor(r * 4))];
    const lab = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " : " + c + (hs.length ? "/" + hs.length : "");
    h += '<div class="c' + (k === key(today) ? " now" : "") + '" style="background:' + bg + '" title="' + lab + '"></div>';
  }
  $("heatGrid").innerHTML = h;
}

/* ---------- cocher ---------- */
/* =========================================================
   LE CAMPEMENT
   Le voyage a une destination ; il lui fallait un point
   d'attache. Les habitudes rapportent des matériaux, et
   c'est le joueur qui décide où les mettre.

   L'arbitrage est le cœur du module : les ressources sont
   assez rares pour qu'un choix en soit un, jamais assez pour
   qu'on doive attendre sans rien faire.
   ========================================================= */
const RES = [
  { k: "bois",   icon: "wood",  label: "Bois" },
  { k: "pierre", icon: "stone", label: "Pierre" },
  { k: "tissu",  icon: "cloth", label: "Tissu" },
];

/* Quelle habitude rapporte quoi. Le lien doit se comprendre sans être
   expliqué : ce qu'on fait dehors donne du bois, ce qui demande de la
   constance donne de la pierre, ce qui prend soin de soi donne du tissu. */
const RES_BY_ICON = {
  walk: "bois", run: "bois", bike: "bois", strength: "bois", seed: "bois",
  sun: "bois", dog: "bois", music: "bois",
  book: "pierre", write: "pierre", meditate: "pierre", nophone: "pierre",
  moon: "pierre", speak: "pierre", pill: "pierre", coffee: "pierre",
  water: "tissu", salad: "tissu", fruit: "tissu", sleep: "tissu", bed: "tissu",
  shower: "tissu", tooth: "tissu", broom: "tissu", heart: "tissu",
};
const resOf = h => RES_BY_ICON[h.icon] || "bois";

/* Les pièces du campement. Trois niveaux chacune : le premier est presque
   gratuit pour que la construction démarre tout de suite, le troisième se
   mérite. */
const PARTS = [
  { k: "fire",    icon: "flame",    name: "Feu de camp",
    lv: ["Foyer de pierres", "Feu abrité", "Grande cheminée"],
    cost: [{ bois: 2 }, { bois: 5, pierre: 3 }, { bois: 10, pierre: 9 }] },
  { k: "bed",     icon: "bed",      name: "Couchage",
    lv: ["Tapis de sol", "Lit de camp", "Vrai lit"],
    cost: [{ bois: 2, tissu: 1 }, { bois: 5, tissu: 4 }, { bois: 9, tissu: 8, pierre: 3 }] },
  { k: "shelter", icon: "home",     name: "Abri",
    lv: ["Bâche tendue", "Tente", "Cabane"],
    cost: [{ bois: 3, tissu: 2 }, { bois: 8, tissu: 6 }, { bois: 14, tissu: 9, pierre: 8 }] },
  { k: "store",   icon: "books",    name: "Réserve",
    lv: ["Sacoche", "Coffre", "Cellier"],
    cost: [{ bois: 3 }, { bois: 7, pierre: 2 }, { bois: 12, pierre: 8 }] },
  { k: "table",   icon: "coffee",   name: "Table",
    lv: ["Souche", "Table basse", "Grande table"],
    cost: [{ bois: 4 }, { bois: 8, pierre: 3 }, { bois: 13, pierre: 7 }] },
  { k: "garden",  icon: "salad",    name: "Potager",
    lv: ["Carré de terre", "Potager", "Verger"],
    cost: [{ bois: 3, tissu: 2 }, { bois: 6, tissu: 4, pierre: 3 }, { bois: 11, tissu: 7, pierre: 8 }] },
];

/* Le rang du campement se lit sur la somme des niveaux : construire
   n'importe quoi fait progresser, il n'y a pas d'ordre imposé. */
const TIERS = [
  [0,  "Bivouac"], [3,  "Campement"], [6,  "Halte"], [9,  "Tente"],
  [12, "Cabane"], [15, "Maison"], [18, "Domaine"],
];
const baseLevels = () => PARTS.reduce((n, p) => n + (S.base[p.k] || 0), 0);
const baseTier = () => {
  const n = baseLevels();
  return TIERS.filter(t => n >= t[0]).pop()[1];
};
const canAfford = c => Object.keys(c).every(k => (S.res[k] || 0) >= c[k]);

const GOLD_PER_HABIT = 3;
const GOLD_PERFECT = 10;

function toggle(h, at) {
  const today = new Date(), k = key(today);
  const list = S.log[k] || (S.log[k] = []);
  const prevL = level(S.xp).l;
  const wasP = perfect(today);
  const c = challenge();
  const chalBefore = S.challenges[wkKey()] === true;
  const xp = XP[h.diff] || 10;
  const i = list.indexOf(h.id);
  let on;

  if (i >= 0) {
    list.splice(i, 1);
    S.xp = Math.max(0, S.xp - xp); S.done = Math.max(0, S.done - 1);
    S.steps = Math.max(0, S.steps - 1);
    S.gold = Math.max(0, S.gold - GOLD_PER_HABIT);
    S.res[resOf(h)] = Math.max(0, (S.res[resOf(h)] || 0) - 1);
    on = false;
    Sfx.play("uncheck");
  } else {
    list.push(h.id);
    S.xp += xp; S.done++; S.steps++;
    S.gold += GOLD_PER_HABIT;
    /* un matériau par habitude : le campement avance au même rythme que
       le voyage, sans jamais demander d'attendre */
    S.res[resOf(h)] = (S.res[resOf(h)] || 0) + 1;
    on = true;
    buzz(11);
    if (scene) scene.celebrate();
    Sfx.play("check");
    if (at) {
      /* deux gains distincts, décalés : lus l'un après l'autre plutôt que
         confondus en un seul chiffre */
      /* décalés dans le temps ET en hauteur : deux gains lus l'un après
         l'autre, jamais superposés */
      floatGain(at.x, at.y, "+" + xp + " XP", "xp", "bolt");
      setTimeout(() => floatGain(at.x, at.y + 26, "+" + GOLD_PER_HABIT, "gold", "gem"), 260);
      const rk = RES.find(r => r.k === resOf(h));
      setTimeout(() => floatGain(at.x, at.y + 52, "+1", "res", rk.icon), 500);
      burst(at.x, at.y, ["#7ec6ff", "#3d92e6", "#f7cc63", "#ffffff"]);
    }
  }

  const nowP = perfect(today);
  let gotFreeze = false;
  if (!wasP && nowP) {
    S.xp += PERFECT; S.gold += GOLD_PERFECT;
    RES.forEach(r => S.res[r.k] += 2);
    if (S.freeze < MAX_FREEZE) { S.freeze++; gotFreeze = true; }
  }
  if (wasP && !nowP) {
    S.xp = Math.max(0, S.xp - PERFECT);
    S.gold = Math.max(0, S.gold - GOLD_PERFECT);
    RES.forEach(r => S.res[r.k] = Math.max(0, S.res[r.k] - 2));
    if (S.freeze > 0) S.freeze--;
  }

  const st = streak();
  if (st > S.best) S.best = st;
  S.perf = countPerfect();

  let mile = null;
  if (on && MILESTONES[st] && !S.milestones.includes(st)) {
    S.milestones.push(st); S.xp += MILESTONES[st]; mile = st;
  }
  let chalWon = false;
  if (on && !chalBefore && chalProgress(c) >= c.goal) {
    S.challenges[wkKey()] = true; S.xp += c.xp; chalWon = true;
  }

  save();
  render();
  if (!on) return;

  /* Un seul message à la fois, du plus rare au plus courant. Une
     découverte cède le pas à un niveau : deux fenêtres empilées
     transformeraient une récompense en corvée de clics. */
  const f = pendingFind; pendingFind = null;
  const newL = level(S.xp).l;
  if (newL > prevL) { sparks(); alertBox("star", "Niveau " + newL, "Tu deviens « " + title(newL) + " ». Le voyageur avance plus loin que jamais."); }
  else if (mile) { sparks(); alertBox("flame", mile + " jours d'affilée", "Quelle régularité. +" + MILESTONES[mile] + " XP en récompense."); }
  else if (chalWon) { sparks(); alertBox(c.icon, "Défi réussi", "« " + c.name + " » validé. +" + c.xp + " XP."); }
  else if (!wasP && nowP) {
    sparks();
    alertBox("gem", "Journée parfaite",
      "Toutes tes habitudes sont cochées. +" + PERFECT + " XP" + (gotFreeze ? " et un gel de série en réserve." : "."));
  }
  else if (f) {
    sparks();
    Sfx.play("find");
    if (f.kind === "chest") {
      alertBox("gem", "Coffre oublié",
        "Personne ne l'avait ouvert depuis longtemps. +" + CHEST_GOLD + " or.");
    } else {
      alertBox(f.icon, f.name,
        "Tu ne l'avais encore jamais croisé. " + f.label +
        " — ajouté à ton carnet de voyage.");
    }
  }
}

/* ---------- messages différés ---------- */
function renderNotices(st) {
  if (S.notice > 0) {
    const n = S.notice; S.notice = 0; save();
    alertBox("shield", "Ta série est protégée",
      (n > 1 ? n + " gels ont" : "Un gel a") + " couvert ton absence. Ta série de " + st +
      " jours continue — il te reste " + S.freeze + " gel" + (S.freeze > 1 ? "s" : "") + ".");
  } else if (S.softReset) {
    S.softReset = false; save();
    alertBox("seed", "Nouvelle page",
      "Tu as fait une pause, et c'est très bien. Ton XP et tes progrès sont intacts — chaque journée parfaite te redonne un gel de série.");
  }
}


/* =========================================================
   Écran Héros — création et garde-robe
   ========================================================= */
const WARDROBE = [
  { key:"body",   label:"Ton héros" },
  { key:"hair",   label:"Coiffure" },
  { key:"outfit", label:"Tenue" },
  { key:"cape",   label:"Cape" },
  { key:"pack",   label:"Sac" },
  { key:"pet",    label:"Compagnon" },
  { key:"mount",  label:"Monture" },
];
const SWATCHES = [
  { key:"skin",        label:"Peau",     list:() => Hero.SKINS },
  { key:"hairColor",   label:"Cheveux",  list:() => Hero.HAIRS },
  { key:"outfitColor", label:"Vêtement", list:() => Hero.CLOTH },
  { key:"capeColor",   label:"Cape",     list:() => Hero.CAPES },
];
let heroPreview = null;

/* Cartes de choix du personnage — partagées par l'écran Héros et le
   premier lancement, pour que le choix se présente partout pareil. */
function heroCardsHTML(sel) {
  return Hero.CATALOG.body.map(b =>
    '<button class="card' + (b.id === sel ? " on" : "") + '" data-body="' + b.id + '">' +
    '<img src="assets/hero/thumb_' + b.id + '.png" alt="" loading="lazy">' +
    "<span>" + b.name + "</span></button>").join("");
}
/* Une vignette absente ne doit pas laisser d'icône cassée à l'écran. */
function wireHeroCards(box, onPick) {
  box.querySelectorAll("img").forEach(im => { im.onerror = () => im.remove(); });
  box.querySelectorAll("[data-body]").forEach(el => {
    el.onclick = () => {
      box.querySelectorAll(".card").forEach(c => c.classList.toggle("on", c === el));
      onPick(el.dataset.body);
      buzz(8);
    };
  });
}

function renderHeroScreen(L, st, J) {
  const U = unlockStats(L, st, J);
  const box = $("wardrobe");
  if (!box) return;

  /* En mode sprites, on masque les emplacements sans planche : mieux vaut
     moins d'options que des options qui ne changent rien à l'écran. */
  const sprite = window.Sprites && Sprites.ready;
  const avail = sprite && Sprites.manifest ? Sprites.manifest.available || [] : null;
  const hasArt = (key, id) => !avail || avail.indexOf(key + "_" + id) !== -1;

  /* — identité et choix du personnage — */
  const cur = Hero.CATALOG.body.find(b => b.id === S.look.body) || Hero.CATALOG.body[0];
  $("heroName").textContent = cur.name;
  $("heroDesc").textContent = cur.desc || "";
  const cards = $("heroCards");
  cards.innerHTML = heroCardsHTML(S.look.body);
  wireHeroCards(cards, id => {
    S.look.body = id;
    save();
    if (scene) scene.setLook(S.look);
    render();
    if (window.Sprites) Sprites.preload(S.look).then(ok => { if (ok) render(); }).catch(() => {});
  });

  let html = "";
  for (const grp of WARDROBE) {
    const items = Hero.CATALOG[grp.key];
    if (grp.key === "capeColor") continue;
    if (grp.key === "body") continue;   /* présenté en cartes, plus haut */
    if (avail && !items.some(it => hasArt(grp.key, it.id))) continue;
    html += '<div class="fl-l">' + grp.label + "</div><div class=\"opts\">";
    for (const it of items) {
      const ok = Hero.unlocked(it.req, U);
      const on = S.look[grp.key] === it.id;
      html += '<button class="opt' + (on ? " on" : "") + (ok ? "" : " lk") + '"' +
        (ok ? ' data-k="' + grp.key + '" data-v="' + it.id + '"' : " disabled") + ">" +
        (ok ? "" : Icons.svg("shield", { size: 12 })) +
        "<span>" + it.name + "</span>" +
        (ok ? "" : '<em>' + reqText(it.req) + "</em>") + "</button>";
    }
    html += "</div>";
  }
  for (const s of SWATCHES) {
    if (avail) break;   /* les nuanciers ne pilotent que le rendu vectoriel */
    html += '<div class="fl-l">' + s.label + '</div><div class="hues">' +
      s.list().map(c => '<div class="hue' + (S.look[s.key] === c ? " on" : "") +
        '" data-k="' + s.key + '" data-v="' + c + '" style="background:' + c + '"></div>').join("") +
      "</div>";
  }
  box.innerHTML = html;
  /* Pas d'illustration pour l'équipement : on masque la section plutôt que
     d'afficher des options sans effet. Elle revient d'elle-même le jour où
     les planches arrivent. */
  const wardEmpty = !html.trim();
  box.hidden = wardEmpty;
  $("heroWardSec").hidden = wardEmpty;
  $("heroH1").textContent = wardEmpty ? "Ton personnage" : "Garde-robe";
  box.querySelectorAll("[data-k]").forEach(el => {
    el.onclick = () => {
      S.look[el.dataset.k] = el.dataset.v;
      save();
      if (scene) scene.setLook(S.look);
      render();
      if (window.Sprites) Sprites.preload(S.look).then(ok => { if (ok) render(); }).catch(() => {});
      buzz(8);
    };
  });

  /* aperçu animé */
  if (!heroPreview) {
    const cv = $("heroCanvas");
    if (cv) {
      const cx = cv.getContext("2d");
      heroPreview = { cv, cx, t: 0, ph: 0 };
      const loop = () => {
        const p = heroPreview;
        if (!document.hidden && $("sc-hero").classList.contains("on")) {
          const r = p.cv.getBoundingClientRect();
          /* écran encore replié : dessiner dans un canvas de taille nulle
             lève une erreur au lieu de ne rien faire */
          if (r.width < 8 || r.height < 8) { requestAnimationFrame(loop); return; }
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (p.cv.width !== Math.round(r.width * dpr)) {
            p.cv.width = Math.round(r.width * dpr);
            p.cv.height = Math.round(r.height * dpr);
          }
          p.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
          p.t += .016; p.ph += .10;
          p.cx.clearRect(0, 0, r.width, r.height);
          const mounted = S.look.mount && S.look.mount !== "none";
          const spriteMode = window.Sprites && Sprites.ready;
          /* même arbitrage que le monde : les sprites priment, le vectoriel
             ne sert que de secours. La pose au repos se prête mieux à
             l'essayage qu'une marche figée. */
          const hh = r.height * (mounted ? .62 : (spriteMode ? .90 : .74));
          const st = { t: p.t, walk: 0, run: false, phase: p.ph, jump: 0, cheer: 0,
                       resting: false, sleeping: false, anim: p.anim };
          const env = { sun: [255, 240, 214], amb: [1, 1, 1], night: 0, wind: .7 };
          const done = spriteMode
            && Sprites.draw(p.cx, r.width * .5, r.height * .92, hh, S.look, st, env, .016);
          p.anim = st.anim;
          if (!done) Hero.draw(p.cx, r.width * .5, r.height * .92, hh, S.look,
            { t: p.t, walk: 1, phase: p.ph, jump: 0, cheer: 0 }, env);
        }
        requestAnimationFrame(loop);
      };
      loop();
    }
  }

  /* Prochains déblocages — uniquement ce qui a une illustration. Promettre
     une récompense invisible serait de la fausse progression. */
  const pend = [];
  for (const grp of WARDROBE) {
    if (grp.key === "body") continue;
    for (const it of Hero.CATALOG[grp.key]) {
      if (!hasArt(grp.key, it.id)) continue;
      if (!Hero.unlocked(it.req, U)) pend.push({ it, grp, cur: U[it.req.t] || 0 });
    }
  }
  pend.sort((a, b) => (b.cur / b.it.req.n) - (a.cur / a.it.req.n));
  const nx = $("heroNext");
  if (nx) {
    const noNext = wardEmpty && pend.length === 0;
    nx.hidden = noNext;
    $("heroNextSec").hidden = noNext;
    nx.innerHTML = pend.length === 0
      ? '<div class="next-i">' + Icons.svg("trophy", { size: 22 }) + '</div><div class="next-b">' +
        '<div class="next-n">Garde-robe complète</div><div class="next-s">Tu as tout débloqué.</div></div>'
      : pend.slice(0, 1).map(p =>
        '<div class="next-i">' + Icons.svg("spark", { size: 22 }) + '</div><div class="next-b">' +
        '<div class="next-n">' + p.it.name + '</div>' +
        '<div class="next-s">' + reqText(p.it.req) + " · " + p.cur + " / " + p.it.req.n + "</div>" +
        '<div class="bar"><i style="width:' + Math.round(Math.min(1, p.cur / p.it.req.n) * 100) + '%"></i></div></div>').join("");
  }
}

function reqText(r) {
  if (!r) return "";
  return { level: "Niveau " + r.n, steps: r.n + " pas", streak: "Série de " + r.n + " j",
           perfect: r.n + " jours parfaits", obstacles: r.n + " obstacles",
           biomes: r.n + " paysages" }[r.t] || "";
}

/* =========================================================
   Feuille de création / édition
   ========================================================= */
let editing = null;
let form = { icon: "water", hue: HUES[0], diff: 2, days: [0,1,2,3,4,5,6] };

function openSheet(h) {
  editing = h;
  form = h ? { icon: h.icon, hue: h.hue, diff: h.diff, days: [...h.days] }
           : { icon: "water", hue: HUES[S.habits.length % HUES.length], diff: 2, days: [0,1,2,3,4,5,6] };
  $("shTitle").textContent = h ? "Modifier l'habitude" : "Nouvelle habitude";
  $("fName").value = h ? h.name : "";
  $("fDel").style.display = h ? "" : "none";
  drawSheet();
  $("sheetBg").classList.add("on");
}
const closeSheet = () => $("sheetBg").classList.remove("on");

function drawSheet() {
  $("fIcon").innerHTML = ICON_SET.map(n =>
    '<div class="' + (form.icon === n ? "on" : "") + '" data-n="' + n + '">' + ic(n, { size: 22 }) + "</div>").join("");
  $("fIcon").querySelectorAll("[data-n]").forEach(e => e.onclick = () => { form.icon = e.dataset.n; drawSheet(); });
  /* Le matériau se déduit de l'icône. Le montrer ici évite d'avoir à
     l'expliquer ailleurs : on voit la règle au moment où on choisit. */
  const r = RES.find(q => q.k === resOf(form));
  $("fRes").innerHTML = '<span class="res-i ' + r.k + '">' + ic(r.icon, { size: 15 }) + "</span>" +
    "<span>Cette habitude rapportera <b>1 " + r.label.toLowerCase() +
    "</b> pour ton campement.</span>";
  $("fHue").innerHTML = HUES.map(c =>
    '<div class="hue' + (form.hue === c ? " on" : "") + '" data-c="' + c + '" style="background:' + c + '"></div>').join("");
  $("fHue").querySelectorAll("[data-c]").forEach(e => e.onclick = () => { form.hue = e.dataset.c; drawSheet(); });
  $("fDiff").querySelectorAll("button").forEach(b => {
    b.classList.toggle("on", +b.dataset.v === form.diff);
    b.onclick = () => { form.diff = +b.dataset.v; drawSheet(); };
  });
  $("fDays").innerHTML = DAYS.map((l, i) =>
    '<button class="' + (form.days.includes(i) ? "on" : "") + '" data-d="' + i + '">' + l + "</button>").join("");
  $("fDays").querySelectorAll("button").forEach(b => b.onclick = () => {
    const d = +b.dataset.d, i = form.days.indexOf(d);
    if (i >= 0) { if (form.days.length > 1) form.days.splice(i, 1); } else form.days.push(d);
    drawSheet();
  });
}

$("fSave").onclick = () => {
  const name = $("fName").value.trim();
  if (!name) { $("fName").focus(); return; }
  const days = [...form.days].sort((a, b) => a - b);
  if (editing) Object.assign(editing, { name, icon: form.icon, hue: form.hue, diff: form.diff, days });
  else S.habits.push({ id: uid(), name, icon: form.icon, hue: form.hue, diff: form.diff, days });
  save(); closeSheet(); render();
};
$("fDel").onclick = () => {
  if (!editing || !confirm("Supprimer « " + editing.name + " » ? Son historique sera aussi effacé.")) return;
  S.habits = S.habits.filter(h => h.id !== editing.id);
  Object.keys(S.log).forEach(k => {
    S.log[k] = S.log[k].filter(id => id !== editing.id);
    if (!S.log[k].length) delete S.log[k];
  });
  S.perf = countPerfect();
  save(); closeSheet(); render();
};
$("sheetBg").onclick = e => { if (e.target === $("sheetBg")) closeSheet(); };
$("addBtn").innerHTML = ic("plus", { size: 22 });
$("addBtn").onclick = () => openSheet(null);

/* =========================================================
   Alerte + particules
   ========================================================= */
function alertBox(icon, t, txt) {
  $("alIcon").innerHTML = ic(icon, { size: 32 });
  $("alTitle").textContent = t;
  $("alText").textContent = txt;
  $("alertBg").classList.add("on");
}
$("alBtn").onclick = () => $("alertBg").classList.remove("on");

/* =========================================================
   Récompense — le retour immédiat du geste
   Cocher une habitude doit se voir, se sentir et s'entendre.
   Sans ce retour, le geste n'est qu'une case cochée.
   ========================================================= */

/* Crochet sonore. Aucun fichier n'est encore livré : la fonction reste
   silencieuse mais l'appel est déjà en place partout, il n'y aura qu'à
   déposer les sons. */
const Sfx = (function () {
  let on = true;
  const bank = {};   /* nom -> HTMLAudioElement, à remplir à la livraison */
  return {
    play(name) {
      if (!on || !bank[name]) return;
      try { const a = bank[name].cloneNode(); a.volume = .35; a.play(); } catch (e) {}
    },
    get enabled() { return on; },
    set enabled(v) { on = !!v; },
    bank,
  };
})();

/* Le réglage de l'application s'ajoute à celui du système, il ne l'annule
   jamais : quelqu'un qui a demandé moins de mouvement à son téléphone ne
   doit pas se le voir réimposer ici. */
const reduceMotion = () =>
  (S.prefs && S.prefs.motion) ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Vibration passée par les préférences, plutôt qu'appelée directement
   partout : un seul endroit à respecter. */
function buzz(ms) {
  if (S.prefs && S.prefs.haptics === false) return;
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* Applique les préférences au document. Appelé au démarrage et à chaque
   changement, jamais dispersé dans les gestionnaires. */
function applyPrefs() {
  const p = S.prefs || {};
  const root = document.documentElement;
  if (p.appearance === "light" || p.appearance === "dark") root.dataset.theme = p.appearance;
  else delete root.dataset.theme;
  root.classList.toggle("reduce-motion", !!p.motion);
  Sfx.enabled = p.sound !== false;
  /* la couleur de la barre système suit le thème réellement affiché */
  const dark = p.appearance === "dark" ||
    (p.appearance !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const m = document.createElement("meta");
  m.name = "theme-color";
  m.content = dark ? "#14100e" : "#f7f2ed";
  document.head.appendChild(m);
}

/* Compteur qui monte au lieu de sauter. Un chiffre qui saute informe ;
   un chiffre qui monte récompense. */
function roll(el, to, dur) {
  if (!el) return;
  const from = parseInt(el.dataset.v || el.textContent.replace(/\D/g, ""), 10) || 0;
  el.dataset.v = to;
  if (from === to || reduceMotion()) { el.textContent = to; return; }
  el.classList.add("bump");
  setTimeout(() => el.classList.remove("bump"), 520);
  const t0 = performance.now(), d = dur || 620;
  (function step(now) {
    const k = Math.min(1, (now - t0) / d);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

/* Gain qui s'échappe du point touché et monte. Le regard suit la
   récompense jusqu'à la barre : le lien de cause à effet devient visible. */
function floatGain(x, y, text, kind, icon) {
  if (reduceMotion()) return;
  const d = document.createElement("div");
  d.className = "float-gain " + kind;
  /* la coche est près du bord droit : sans cette marge, la moitié du gain
     sort de l'écran et la récompense passe inaperçue */
  d.style.left = Math.min(Math.max(x, 62), window.innerWidth - 62) + "px";
  d.style.top = y + "px";
  d.innerHTML = ic(icon, { size: 15 }) + "<span>" + text + "</span>";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1200);
}

/* Éclat court au point du doigt, distinct des confettis des grands paliers. */
function burst(x, y, colors) {
  if (reduceMotion()) return;
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("div");
    s.className = "burst";
    const a = (i / 12) * Math.PI * 2 + Math.random() * .5;
    const r = 26 + Math.random() * 42;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.background = colors[i % colors.length];
    s.style.setProperty("--dx", (Math.cos(a) * r).toFixed(1) + "px");
    s.style.setProperty("--dy", (Math.sin(a) * r - 14).toFixed(1) + "px");
    s.style.animationDelay = (Math.random() * .06) + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

function sparks() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const t = THEMES[S.theme] || THEMES[0];
  const cols = [t.a1, t.a2, "#ffd98a", "#ffffff"];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("div");
    s.className = "spark";
    s.style.left = (12 + Math.random() * 76) + "vw";
    s.style.top = (-4 - Math.random() * 8) + "vh";
    s.style.background = cols[i % cols.length];
    s.style.setProperty("--dx", ((Math.random() - .5) * 120) + "px");
    s.style.animationDuration = (1.7 + Math.random() * 1.5) + "s";
    s.style.animationDelay = (Math.random() * .35) + "s";
    s.style.opacity = .55 + Math.random() * .45;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3600);
  }
}

/* =========================================================
   Écran du campement
   ========================================================= */
function costLine(c) {
  return RES.filter(r => c[r.k]).map(r => {
    const have = S.res[r.k] || 0;
    return '<span class="cost' + (have >= c[r.k] ? " ok" : "") + '">' +
      ic(r.icon, { size: 13 }) + c[r.k] + "</span>";
  }).join("");
}

function renderCamp() {
  const rr = $("resRow");
  if (!rr) return;
  rr.innerHTML = RES.map(r =>
    '<div class="res-c"><span class="res-i ' + r.k + '">' + ic(r.icon, { size: 18 }) + "</span>" +
    '<b class="roll">0</b><span class="res-l">' + r.label + "</span></div>").join("");
  const rolls = rr.querySelectorAll(".roll");
  RES.forEach((r, i) => roll(rolls[i], S.res[r.k] || 0));

  const lvls = baseLevels();
  $("campTier").textContent = baseTier();
  const maxed = PARTS.filter(p => S.base[p.k] >= 3).length;
  $("campSub").textContent = lvls === 0
    ? "Rien n'est encore bâti"
    : lvls + (lvls > 1 ? " aménagements" : " aménagement") +
      (maxed ? " · " + maxed + " au maximum" : "");

  $("partRows").innerHTML = PARTS.map(p => {
    const lv = S.base[p.k] || 0;
    const max = lv >= 3;
    const c = max ? null : p.cost[lv];
    const ok = c && canAfford(c);
    return '<div class="row part' + (max ? " max" : "") + '" data-p="' + p.k + '">' +
      '<div class="row-i" style="background:var(--fill);color:var(--ink-2)">' +
        ic(p.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + p.name + "</div>" +
      '<div class="row-m"><span>' + (lv ? p.lv[lv - 1] : "Rien de bâti") + "</span>" +
      '<span class="lvdots">' + [0, 1, 2].map(i =>
        '<i' + (i < lv ? ' class="on"' : "") + "></i>").join("") + "</span></div></div>" +
      (max
        ? '<span class="part-max">' + ic("check", { size: 15 }) + "</span>"
        : '<button class="part-go' + (ok ? " ok" : "") + '"' + (ok ? "" : " disabled") + ">" +
          costLine(c) + "</button>") +
      "</div>";
  }).join("");

  $("partRows").querySelectorAll(".part-go:not([disabled])").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const k = btn.closest(".part").dataset.p;
      const p = PARTS.find(q => q.k === k);
      const lv = S.base[k] || 0;
      const c = p.cost[lv];
      if (!canAfford(c)) return;
      const before = baseTier();
      Object.keys(c).forEach(r => S.res[r] -= c[r]);
      S.base[k] = lv + 1;
      save();
      buzz(14);
      Sfx.play("build");
      sparks();
      const after = baseTier();
      render();
      if (after !== before) {
        alertBox("home", after,
          "Ton campement change de visage. " + p.lv[lv] + " vient d'être bâti.");
      } else {
        alertBox(p.icon, p.lv[lv],
          "Construit. Ton campement compte maintenant " + baseLevels() +
          (baseLevels() > 1 ? " aménagements." : " aménagement."));
      }
    };
  });
}

/* Le camp est rendu dans le même monde que le voyage : même ciel, même
   heure, mêmes arbres quand les planches sont là. Un écran de menu aurait
   coupé le campement de l'aventure. */
let campView = null;
function startCamp() {
  const cv = $("campCanvas");
  if (!cv || campView) return;
  const cx = cv.getContext("2d");
  campView = { cv, cx, t: 0, anim: null };
  const loop = () => {
    const v = campView;
    if (!document.hidden && $("sc-camp").classList.contains("on")) {
      const r = v.cv.getBoundingClientRect();
      /* Le panneau peut être encore replié au premier tour : dessiner dans
         un canvas de taille nulle jette une erreur au lieu de ne rien faire. */
      if (r.width < 8 || r.height < 8) { requestAnimationFrame(loop); return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (v.cv.width !== Math.round(r.width * dpr)) {
        v.cv.width = Math.round(r.width * dpr);
        v.cv.height = Math.round(r.height * dpr);
      }
      v.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      v.t += .016;
      drawCampScene(v.cx, r.width, r.height, v.t, v);
    }
    requestAnimationFrame(loop);
  };
  loop();
}

function drawCampScene(x, W, H, t, v) {
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  const g = Odyssey.gradeAt(hour);
  const J = journey();
  const B = Odyssey.BIOMES[Math.floor(J.pos / SEG) % Odyssey.BIOMES.length];
  const gy = H * .82;

  /* ciel */
  const sky = x.createLinearGradient(0, 0, 0, gy);
  const top = B.sky[0], bot = B.sky[1];
  const gc = h => {
    const c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    return "rgb(" + (c[0] * g.amb[0] | 0) + "," + (c[1] * g.amb[1] | 0) + "," + (c[2] * g.amb[2] | 0) + ")";
  };
  sky.addColorStop(0, gc(top)); sky.addColorStop(1, gc(bot));
  x.fillStyle = sky; x.fillRect(0, 0, W, H);

  /* arbres illustrés en fond, quand ils existent */
  const SC = window.Scenery;
  const trees = SC && SC.ready ? SC.props("round") : null;
  if (trees) {
    /* Ils encadrent le camp sans lui voler la vedette : plus de brume et
       une taille contenue, sinon le décor mange la scène. */
    const fog = [230, 220, 205];
    [[.06, .58, .46], [.94, .52, .44], [.76, .43, .52]].forEach(([px, sc, f], i) => {
      const im = trees[i % trees.length];
      const th = H * sc, tw = im.width * (th / im.height);
      x.drawImage(SC.tinted(im, g.amb, fog, f), W * px - tw / 2, gy - th, tw, th);
    });
  }

  /* sol */
  const gr2 = x.createLinearGradient(0, gy - 4, 0, H);
  gr2.addColorStop(0, gc(B.ground));
  gr2.addColorStop(1, gc(B.path));
  x.fillStyle = gr2; x.fillRect(0, gy - 2, W, H - gy + 2);

  /* le campement */
  /* L'unité du camp est calée sur la taille du héros : au-delà, une simple
     bâche le dépassait d'une tête et la scène perdait toute échelle. */
  if (window.Camp) Camp.draw(x, W * .46, gy, Math.min(W * .30, H * .42), S.base, g, t);

  /* le héros, près du feu */
  if (window.Sprites && Sprites.ready && S.base.fire > 0) {
    const st = { t, walk: 0, run: false, phase: 0, jump: 0, cheer: 0,
                 resting: false, sleeping: false, anim: v.anim };
    Sprites.draw(x, W * .76, gy + H * .01, H * .30, S.look, st,
      { sun: g.sun, amb: g.amb, night: g.star, wind: .4 }, .016);
    v.anim = st.anim;
  }
}

/* =========================================================
   Premier lancement
   Deux usages : la découverte complète au tout premier
   démarrage, et la seule étape « objectifs » quand on revient
   les modifier depuis l'écran Habitudes.
   ========================================================= */
const Onb = (function () {
  let step = 0, steps = [0, 1, 2, 3], sel = [], body = null, mode = "full";

  const el = () => $("onb");
  const $$ = s => document.querySelectorAll(s);

  function paint() {
    $$(".onb-step").forEach(s => s.classList.toggle("on", +s.dataset.step === steps[step]));
    $("onbDots").innerHTML = steps.map((_, i) =>
      '<i class="' + (i <= step ? "on" : "") + '"></i>').join("");
    el().scrollTop = 0;
  }

  /* Les habitudes des objectifs cochés, sans doublon avec l'existant. */
  function picked() {
    const out = [], seen = new Set(S.habits.map(h => h.name));
    for (const id of sel) {
      const g = goalById(id);
      if (!g) continue;
      for (const h of g.habits) {
        if (seen.has(h.name)) continue;
        seen.add(h.name);
        out.push(h);
      }
    }
    return out;
  }

  function renderGoals() {
    const box = $("onbGoals");
    box.innerHTML = GOALS.map(g =>
      '<button class="goal' + (sel.indexOf(g.id) !== -1 ? " on" : "") + '" data-g="' + g.id + '">' +
      '<span class="goal-i">' + ic(g.icon, { size: 18 }) + "</span>" +
      "<b>" + g.name + "</b><em>" + g.line + "</em></button>").join("");
    box.querySelectorAll("[data-g]").forEach(b => {
      b.onclick = () => {
        const i = sel.indexOf(b.dataset.g);
        if (i === -1) sel.push(b.dataset.g); else sel.splice(i, 1);
        b.classList.toggle("on", i === -1);
        $("onbGoalsNext").disabled = sel.length === 0;
        buzz(8);
      };
    });
    $("onbGoalsNext").disabled = sel.length === 0;
  }

  function renderHeroes() {
    const box = $("onbHeroes");
    box.innerHTML = heroCardsHTML(body);
    wireHeroCards(box, id => {
      body = id;
      /* on précharge dès le choix : la planche est prête à l'arrivée */
      if (window.Sprites) Sprites.preload(Object.assign({}, S.look, { body: id })).catch(() => {});
    });
  }

  function renderSummary() {
    const list = picked();
    const box = $("onbSummary");
    $("onbSumLead").textContent = list.length
      ? "Voici tes premières habitudes. Tu pourras les modifier, en ajouter ou en retirer à tout moment."
      : "Tu démarres avec une page blanche. Ajoute tes habitudes quand tu veux depuis l'onglet Habitudes.";
    box.hidden = !list.length;
    box.innerHTML = list.map((h, i) =>
      '<div class="row" style="cursor:default;animation-delay:' + (i * 35) + 'ms">' +
      '<div class="row-i" style="background:' + HUES[i % HUES.length] + '1f;color:' + HUES[i % HUES.length] + '">' +
      ic(h.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + h.name + "</div>" +
      '<div class="row-m"><span>+' + XP[h.diff] + " XP · tous les jours</span>" + resTag(h) +
      "</div></div></div>").join("");
  }

  /* Aperçu animé de l'accueil : le même moteur que le voyage, en vitrine. */
  let art = null;
  function startArt() {
    if (art || !window.Odyssey) return;
    const host = $("onbArt");
    if (!host) return;
    const cv = document.createElement("canvas");
    host.appendChild(cv);
    art = Odyssey.createScene(cv, { look: S.look });
    art.setSteps(6, true);
    art.start();
  }
  function stopArt() { if (art) { art.stop(); art = null; $("onbArt").innerHTML = ""; } }

  function next() {
    if (step >= steps.length - 1) return finish();
    step++;
    if (steps[step] === 1) renderGoals();
    if (steps[step] === 2) renderHeroes();
    if (steps[step] === 3) renderSummary();
    paint();
  }

  function finish() {
    const list = picked();
    list.forEach((h, i) => S.habits.push({
      id: uid(), name: h.name, icon: h.icon,
      hue: HUES[(S.habits.length + i) % HUES.length],
      diff: h.diff, days: [0, 1, 2, 3, 4, 5, 6],
    }));
    S.goals = sel.slice();
    if (body) S.look.body = body;
    S.onboarded = true;
    save();
    stopArt();
    el().hidden = true;
    if (scene) scene.setLook(S.look);
    if (window.Sprites) Sprites.preload(S.look).then(ok => { if (ok) render(); }).catch(() => {});
    render();
  }

  function open(m) {
    mode = m || "full";
    sel = S.goals.slice();
    body = S.look.body;
    steps = mode === "goals" ? [1, 3] : [0, 1, 2, 3];
    step = 0;
    $("onbSkip").hidden = mode !== "full";
    el().hidden = false;
    if (steps[0] === 0) startArt();
    if (steps[0] === 1) renderGoals();
    paint();
  }

  $$("[data-next]").forEach(b => { b.onclick = next; });
  $("onbDone").onclick = finish;
  /* « partir de zéro » : on n'amorce aucune habitude, sans pour autant
     effacer les objectifs déjà choisis lors d'une modification. */
  $("onbSkip").onclick = () => { if (mode === "full") sel = []; next(); };

  return { open };
})();

function renderGoalTags() {
  const box = $("goalTags");
  if (!box) return;
  const tags = S.goals.map(id => goalById(id)).filter(Boolean);
  box.innerHTML =
    (tags.length
      ? tags.map(g => '<span class="tag">' + ic(g.icon, { size: 14 }) + g.name + "</span>").join("")
      : '<span class="tag">' + ic("compass", { size: 14 }) + "Aucun objectif défini</span>") +
    '<button class="tag add" id="goalEdit">' + ic("plus", { size: 14 }) +
    (tags.length ? "Modifier" : "En choisir") + "</button>";
  $("goalEdit").onclick = () => Onb.open("goals");
}

/* =========================================================
   Profil, préférences et données
   ========================================================= */
function firstDay() {
  const ks = Object.keys(S.log).filter(k => (S.log[k] || []).length).sort();
  return ks.length ? ks[0] : null;
}

function renderProfile(L, J) {
  const av = $("pAvatar");
  if (av) {
    const src = "assets/hero/thumb_" + S.look.body + ".png";
    if (av.getAttribute("src") !== src) av.src = src;
    av.onerror = () => { av.style.display = "none"; };
  }
  const nm = $("pName");
  /* on ne réécrit pas le champ pendant la frappe, sinon le curseur saute */
  if (nm && document.activeElement !== nm) nm.value = S.name;

  const f = firstDay();
  $("pSince").textContent = f
    ? "En route depuis le " + fromK(f).toLocaleDateString("fr-FR",
        { day: "numeric", month: "long", year: "numeric" })
    : "Le voyage commence aujourd'hui";
  roll($("pLvl"), L.l);
  roll($("pGold"), S.gold);
  roll($("pSteps"), J.pos);

  /* apparence */
  const ap = S.prefs.appearance || "auto";
  $("prefAppearance").querySelectorAll("button").forEach(b =>
    b.classList.toggle("on", b.dataset.v === ap));

  /* interrupteurs */
  document.querySelectorAll(".pref.sw").forEach(el => {
    const k = el.dataset.k;
    el.querySelector(".switch").classList.toggle("on", !!S.prefs[k]);
  });
}

function wireProfile() {
  const nm = $("pName");
  if (nm) nm.oninput = () => { S.name = nm.value.trim().slice(0, 24); save(); };

  $("prefAppearance").querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      S.prefs.appearance = b.dataset.v;
      save(); applyPrefs(); render(); buzz(8);
    };
  });

  document.querySelectorAll(".pref.sw").forEach(el => {
    el.onclick = () => {
      const k = el.dataset.k;
      S.prefs[k] = !S.prefs[k];
      save(); applyPrefs(); render();
      if (k !== "haptics" || S.prefs[k]) buzz(8);
    };
  });

  $("expIc").innerHTML = ic("boot", { size: 18 });
  $("impIc").innerHTML = ic("flag", { size: 18 });

  /* Export : un fichier daté que l'on peut ranger ou transférer. C'est la
     seule sortie possible pour des données qui ne quittent pas l'appareil. */
  $("expBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "odyssee-" + key() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    buzz(10);
    alertBox("boot", "Sauvegarde exportée",
      "Le fichier « " + a.download + " » contient tes habitudes, ton XP et ton voyage.");
  };

  $("impBtn").onclick = () => $("impFile").click();
  $("impFile").onchange = e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let data = null;
      try { data = JSON.parse(r.result); } catch (err) {}
      /* On refuse un fichier qui ne ressemble pas à une sauvegarde plutôt
         que d'écraser des données réelles avec n'importe quoi. */
      if (!data || !Array.isArray(data.habits)) {
        alertBox("shield", "Fichier illisible",
          "Ce fichier n'est pas une sauvegarde d'Odyssée. Tes données n'ont pas été touchées.");
        return;
      }
      const n = data.habits.length;
      if (!confirm("Remplacer tes données actuelles par cette sauvegarde ?\n\n" +
          n + " habitude" + (n > 1 ? "s" : "") + " · " + (data.xp || 0) + " XP\n\n" +
          "Cette action est définitive.")) return;
      localStorage.setItem(KEY, JSON.stringify(data));
      location.reload();
    };
    r.readAsText(f);
  };
}

/* =========================================================
   Navigation & démarrage
   ========================================================= */
function go(name) {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.sc === name));
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $("sc-" + name).classList.add("on");
  /* l'observateur ne se déclenche qu'au défilement : on masque nous-mêmes
     en quittant l'onglet, sinon le bandeau survit sur les autres écrans */
  if (name !== "today") $("miniBar").hidden = true;
  /* la scène du camp ne tourne que lorsqu'on la regarde */
  if (name === "camp") startCamp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("nav button").forEach((b, i) => {
  b.querySelector(".ic").innerHTML = ic(["compass", "heart", "home", "list", "chart", "shield"][i], { size: 23 });
  b.onclick = () => go(b.dataset.sc);
});

$("resetBtn").innerHTML = ic("trash", { size: 17 }) + "<span>Réinitialiser toutes les données</span>";
$("resetBtn").onclick = () => {
  if (confirm("Effacer les habitudes, l'XP, les trophées et le voyage ? Cette action est définitive.")) {
    localStorage.removeItem(KEY);
    localStorage.removeItem("rituels.v1");
    location.reload();
  }
};

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

/* Le bandeau n'apparaît que lorsque la scène a quitté l'écran, et
   uniquement sur l'onglet Voyage : ailleurs, il n'aurait rien à dire. */
(function () {
  const bar = $("miniBar"), world = document.querySelector(".world");
  if (!bar || !world || !window.IntersectionObserver) return;
  new IntersectionObserver(es => {
    const hidden = !es[0].isIntersecting;
    bar.hidden = !(hidden && $("sc-today").classList.contains("on"));
  }, { rootMargin: "-64px 0px 0px 0px", threshold: 0 }).observe(world);
  /* on y touche pour remonter voir le voyageur en grand */
  bar.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
})();

applyPrefs();
wireProfile();
boot3D();
render();
booted = true;
if (!S.onboarded) Onb.open("full");
/* la citation change chaque jour, en pied de page de la scène */
setInterval(() => { if (!document.hidden) $("phaseLine").innerHTML =
  ic("clock", { size: 15 }) + "<span>" + scene.phaseLabel() + "</span>"; }, 60000);

})();
