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
const THEMES = [
  { a1:"#4f7df3", a2:"#7fb0ff" },
  { a1:"#9b6ce0", a2:"#c49bff" },
  { a1:"#e0628a", a2:"#ff9dba" },
  { a1:"#e08a3d", a2:"#ffc07a" },
  { a1:"#3dbe7c", a2:"#7fe0ab" },
  { a1:"#2fa6b8", a2:"#6fd8e4" },
];
/* teinte de cape assortie au thème */
const CLOAKS = [
  ["#5b7fd4","#39548f","#e8836b"], ["#8b6cd0","#584596","#f0a05e"],
  ["#d4628a","#8f3f5e","#f0c25e"], ["#d4894a","#8f5528","#5fa8c0"],
  ["#4aa87a","#2c6b4c","#e8a04a"], ["#3f9cb0","#256a7c","#f0a86e"],
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
];

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
      const o = { id: "o" + s + "_" + j, pos: base + off, xp: 15 + Math.floor(i / 5) * 5,
                  scene: P.scene, icon: P.icon, name: P.name, reqs: [] };
      const mode = i < 2 ? 0 : i % 3;
      if (mode !== 1) o.task = TASKS[i % TASKS.length];
      if (mode !== 0) {
        o.reqs.push(i % 2
          ? { t: "streak", n: Math.min(2 + Math.floor(s / 2), 10) }
          : { t: "done",   n: 20 + s * 12 });
      }
      out.push(o);
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
function blank() {
  return {
    xp: 0, done: 0, perf: 0, best: 0,
    steps: 0, passed: [],
    freeze: 1, frozenDays: [], processed: null,
    milestones: [], challenges: {},
    theme: 0,
    notice: 0, softReset: false,
    look: Hero.defaultLook(),
    habits: [], log: {},
  };
}
let S = load();
const taskDone = new Set();   /* défis physiques validés, session courante */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(Object.assign(blank(), JSON.parse(raw)));
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

function boot3D() {
  scene = Odyssey.createScene($("stage"), { look: S.look });
  if (window.Sprites) Sprites.preload(S.look).catch(() => {});
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
    scene.setBlocked(J.blocked, J.blocked && J.next ? J.next.scene : null);
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
  $("wPills").innerHTML =
    '<span class="w-pill">' + ic("flame", { size: 13 }) + st + "</span>" +
    '<span class="w-pill">' + ic("snowflake", { size: 13 }) + S.freeze + "</span>";

  const todays = forDay(today);
  const doneN = todays.filter(h => isDone(h, k)).length;
  $("wOrb").textContent = L.l;
  $("wTitle").textContent = title(L.l);
  $("wMeta").textContent = L.into + " / " + L.need + " XP";
  $("wRing").textContent = doneN + "/" + todays.length;
  $("wXp").style.width = Math.round(L.into / L.need * 100) + "%";

  renderHeroScreen(L, st, J);
  renderObstacle(J);
  renderChallenge();
  renderToday(todays, k);
  renderHabits();
  renderProgress(L, st, J);
  renderNotices(st);
}

/* ---------- obstacle ---------- */
function renderObstacle(J) {
  const slot = $("obSlot");
  if (!J.blocked || !J.next) {
    const left = J.next ? J.next.pos - J.pos : 0;
    slot.innerHTML = '<div class="glass ob"><div class="hint">' +
      (J.next
        ? "Prochain obstacle dans <b>" + left + (left > 1 ? " pas" : " pas") + "</b>. Chaque habitude cochée fait avancer le voyageur."
        : "La route est libre à perte de vue. Continue d'avancer.") +
      "</div></div>";
    return;
  }
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
        (can ? "Franchir l'obstacle" : "Il te manque encore un peu") + "</button>" +
    "</div>";

  const tb = $("obTask");
  if (tb) tb.onclick = () => {
    taskDone.has(o.id) ? taskDone.delete(o.id) : taskDone.add(o.id);
    if (navigator.vibrate) navigator.vibrate(10);
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
  box.innerHTML = todays.map((h, i) => {
    const d = isDone(h, k), s = hStreak(h);
    return '<div class="row' + (d ? " done" : "") + '" data-id="' + h.id + '" style="animation-delay:' + (i * 40) + 'ms">' +
      '<div class="row-i" style="background:' + h.hue + '1f;color:' + h.hue + '">' + ic(h.icon, { size: 21 }) + "</div>" +
      '<div class="row-b"><div class="row-n">' + esc(h.name) + "</div>" +
      '<div class="row-m"><span>+' + XP[h.diff] + " XP</span>" +
      (s > 1 ? '<span class="fl">' + ic("flame", { size: 12 }) + s + "</span>" : "") + "</div></div>" +
      '<div class="tick">' + ic("check", { size: 14 }) + "</div></div>";
  }).join("");
  box.querySelectorAll(".row").forEach(el => {
    el.onclick = () => toggle(S.habits.find(h => h.id === el.dataset.id));
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
      '<div class="row-m"><span>' + fmtDays(h.days) + " · +" + XP[h.diff] + " XP</span>" +
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
      '<div class="row-m"><span>+' + XP[s.diff] + " XP · tous les jours</span></div></div>" +
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

  $("stDone").textContent = S.done;
  $("stXp").textContent = S.xp;
  $("stBest").textContent = S.best;
  $("stPerf").textContent = S.perf;

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
function toggle(h) {
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
    on = false;
  } else {
    list.push(h.id);
    S.xp += xp; S.done++; S.steps++;
    on = true;
    if (navigator.vibrate) navigator.vibrate(11);
    if (scene) scene.celebrate();
  }

  const nowP = perfect(today);
  let gotFreeze = false;
  if (!wasP && nowP) {
    S.xp += PERFECT;
    if (S.freeze < MAX_FREEZE) { S.freeze++; gotFreeze = true; }
  }
  if (wasP && !nowP) { S.xp = Math.max(0, S.xp - PERFECT); if (S.freeze > 0) S.freeze--; }

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

  const newL = level(S.xp).l;
  if (newL > prevL) { sparks(); alertBox("star", "Niveau " + newL, "Tu deviens « " + title(newL) + " ». Le voyageur avance plus loin que jamais."); }
  else if (mile) { sparks(); alertBox("flame", mile + " jours d'affilée", "Quelle régularité. +" + MILESTONES[mile] + " XP en récompense."); }
  else if (chalWon) { sparks(); alertBox(c.icon, "Défi réussi", "« " + c.name + " » validé. +" + c.xp + " XP."); }
  else if (!wasP && nowP) {
    sparks();
    alertBox("gem", "Journée parfaite",
      "Toutes tes habitudes sont cochées. +" + PERFECT + " XP" + (gotFreeze ? " et un gel de série en réserve." : "."));
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
  { key:"body",   label:"Silhouette" },
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

function renderHeroScreen(L, st, J) {
  const U = unlockStats(L, st, J);
  const box = $("wardrobe");
  if (!box) return;

  let html = "";
  for (const grp of WARDROBE) {
    const items = Hero.CATALOG[grp.key];
    if (grp.key === "capeColor") continue;
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
    html += '<div class="fl-l">' + s.label + '</div><div class="hues">' +
      s.list().map(c => '<div class="hue' + (S.look[s.key] === c ? " on" : "") +
        '" data-k="' + s.key + '" data-v="' + c + '" style="background:' + c + '"></div>').join("") +
      "</div>";
  }
  box.innerHTML = html;
  box.querySelectorAll("[data-k]").forEach(el => {
    el.onclick = () => {
      S.look[el.dataset.k] = el.dataset.v;
      save();
      if (scene) scene.setLook(S.look);
      render();
      if (navigator.vibrate) navigator.vibrate(8);
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
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (p.cv.width !== Math.round(r.width * dpr)) {
            p.cv.width = Math.round(r.width * dpr);
            p.cv.height = Math.round(r.height * dpr);
          }
          p.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
          p.t += .016; p.ph += .10;
          p.cx.clearRect(0, 0, r.width, r.height);
          const mounted = S.look.mount && S.look.mount !== "none";
          Hero.draw(p.cx, r.width * .5, r.height * .92, r.height * (mounted ? .62 : .74),
            S.look, { t: p.t, walk: 1, phase: p.ph, jump: 0, cheer: 0 },
            { sun: [255, 240, 214], amb: [1, 1, 1], night: 0, wind: .7 });
        }
        requestAnimationFrame(loop);
      };
      loop();
    }
  }

  /* prochains déblocages */
  const pend = [];
  for (const grp of WARDROBE) {
    for (const it of Hero.CATALOG[grp.key]) {
      if (!Hero.unlocked(it.req, U)) pend.push({ it, grp, cur: U[it.req.t] || 0 });
    }
  }
  pend.sort((a, b) => (b.cur / b.it.req.n) - (a.cur / a.it.req.n));
  const nx = $("heroNext");
  if (nx) {
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
   Navigation & démarrage
   ========================================================= */
function go(name) {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.sc === name));
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $("sc-" + name).classList.add("on");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("nav button").forEach((b, i) => {
  b.querySelector(".ic").innerHTML = ic(["compass", "heart", "list", "chart"][i], { size: 23 });
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

boot3D();
render();
/* la citation change chaque jour, en pied de page de la scène */
setInterval(() => { if (!document.hidden) $("phaseLine").innerHTML =
  ic("clock", { size: 15 }) + "<span>" + scene.phaseLabel() + "</span>"; }, 60000);

})();
