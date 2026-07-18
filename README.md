# 🐣 Kiko Sport — Sport doux en mode jeu vidéo

Une application mobile pour faire du **sport doux quotidiennement**, présentée
comme un jeu vidéo : tu fais tes exercices, ton compagnon **Kiko** gagne de
l'expérience, monte de niveau et **évolue visuellement** au fil des jours.

## ✨ Fonctionnalités

- **Un personnage à faire évoluer** : Kiko change d'apparence en montant de
  niveau (bandeau, baskets, cape, aura d'étoile, couronne dorée…)
- **3 missions par jour**, tirées d'un catalogue de 16 exercices doux :
  marche, étirements, yoga, respiration, renforcement léger… Les missions
  changent chaque jour automatiquement.
- **Minuteur guidé** pour chaque exercice, avec vibration à la fin
- **Série de jours (🔥 streak)** : fais au moins un exercice par jour pour ne
  pas la casser
- **XP, niveaux, badges** et statistiques (semaine, record de série,
  journées parfaites)
- **Exercice bonus surprise** pour gagner un peu d'XP en plus
- Personnage **renommable**

## 📱 Installation sur ton téléphone

C'est une **PWA** (comme l'application de budget) : pas besoin d'app store.

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
| `index.html` | Toute l'application (interface + logique du jeu) |
| `manifest.webmanifest` | Métadonnées d'installation PWA |
| `sw.js` | Service worker (fonctionnement hors-ligne) |
| `icon.svg` / `icon-512.png` | Icônes de l'application |
