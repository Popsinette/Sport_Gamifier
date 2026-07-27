/* Service worker : rend l'application utilisable hors-ligne. */
const CACHE = "odyssee-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./icons.js",
  "./hero.js",
  "./sprites.js",
  "./scenery.js",
  "./world.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-512.png",
  "./assets/hero/manifest.json",
  /* vignettes de choix du personnage : légères, et nécessaires dès le
     premier lancement */
  "./assets/hero/thumb_explorateur.png",
  "./assets/hero/thumb_brumes.png",
  "./assets/hero/thumb_gardienne.png",
  "./assets/hero/thumb_saisons.png",
  "./assets/hero/thumb_reveur.png"
];
/* Les planches de héros pèsent ~1,8 Mo pièce : on ne les précharge pas
   toutes. Le cache d'exécution ci-dessous garde celle du personnage
   réellement utilisé, ce qui suffit pour le mode hors-ligne. */

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord, cache en secours : les mises à jour arrivent quand on est en ligne,
// et l'app continue de fonctionner sans connexion.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        /* On ne met en cache QUE les réponses valides et de même origine.
           Un 404 mis en cache est un poison : il survit à la mise en ligne
           du fichier manquant et fige l'application sur un état obsolète. */
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
