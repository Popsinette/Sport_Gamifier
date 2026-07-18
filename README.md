# 👑 Royaume d'Astria — Sport doux en monde fantastique

Une application mobile pour faire du **sport doux quotidiennement**, présentée
comme un jeu de rôle fantastique : chaque exercice réel est une **quête** du
Royaume Étoilé, et ton **héroïne personnalisable** gagne des talents et des
équipements magiques au fil de tes séances.

## ✨ Fonctionnalités

- **Héroïne 100 % personnalisable** : peau (5 teintes), coiffure (longs,
  couettes, chignon, tresse), couleur de cheveux (8), yeux (5), robe (6),
  et son prénom
- **Elle évolue selon TES exercices** — 4 talents nourris par 4 familles
  d'exercices :
  - ⚔️ **Force** (squats, gainage, pont fessier…) → gants, épaulières, épée de lumière → *Guerrière*
  - 🥾 **Endurance** (marche, montées de genoux…) → bottes, cape d'exploratrice, cape céleste → *Exploratrice*
  - 🦋 **Grâce** (étirements, yoga…) → rubans, ailes de fée, ailes de papillon → *Danseuse féérique*
  - ✨ **Magie** (respiration, relaxation, équilibre…) → pendentif de lune, bâton des étoiles, aura → *Enchanteresse*
- Son **titre** reflète son talent dominant et son niveau global
  (« Guerrière novice » → « Enchanteresse légendaire »), et le niveau global
  débloque diadème, couronne royale et aura légendaire
- **3 quêtes par jour** (toujours 3 familles différentes), habillées en
  aventures : « Traverser la Forêt d'Émeraude », « Bâtir le Pont de Lune »,
  « L'épreuve de la fée funambule »…
- **Minuteur guidé** pour chaque quête, vibration à la fin
- **Flamme quotidienne (🔥 streak)**, trophées, chroniques hebdomadaires,
  quête bonus surprise

## 📱 Installation sur ton téléphone

C'est une **PWA** : pas besoin d'app store.

1. Héberge les fichiers (le plus simple : **GitHub Pages** — Settings →
   Pages → déployer depuis la branche)
2. Ouvre l'adresse dans le navigateur du téléphone
3. Menu → **« Ajouter à l'écran d'accueil »** (Android/Chrome) ou
   **Partager → « Sur l'écran d'accueil »** (iPhone/Safari)
4. L'app s'ouvre en plein écran, fonctionne **hors-ligne** et garde ta
   progression sur le téléphone (localStorage — rien n'est envoyé en ligne)

## 🧪 Tester en local

```bash
npx http-server .
# puis ouvrir http://localhost:8080
```

## 🗂 Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application (interface + logique du jeu + avatar SVG) |
| `manifest.webmanifest` | Métadonnées d'installation PWA |
| `sw.js` | Service worker (fonctionnement hors-ligne) |
| `icon.svg` / `icon-512.png` | Icônes de l'application |
