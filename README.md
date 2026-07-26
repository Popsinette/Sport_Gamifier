# ✅ Rituels — Habitudes quotidiennes gamifiées

Une application mobile au **design Apple (iOS)** pour suivre tes habitudes
quotidiennes, garder un bon rythme de vie… et gagner de l'XP comme dans un jeu.

## ✨ Fonctionnalités

### Habitudes personnalisées
- Crée tes propres habitudes : **nom, icône (24 emojis), difficulté, jours de
  la semaine** (ex. seulement lun/mer/ven)
- 10 **suggestions** prêtes à ajouter en un tap (eau, marche, lecture,
  coucher avant 23 h, pas d'écran au lit…)
- Modification et suppression à tout moment

### Progression type jeu vidéo
- **XP par coche** selon la difficulté : facile +5, moyenne +10, difficile +15
- **Bonus « journée parfaite » +25 XP** quand toutes les habitudes du jour
  sont cochées
- **Niveaux** avec titres (Débutant·e → Motivé·e → Assidu·e → Discipliné·e →
  Inarrêtable → Maître du rythme → Icône du bien-être)
- **Séries (🔥 streaks)** : série globale + série par habitude
- **14 trophées** : premiers pas, 100 coches, 7 jours de suite, 30 journées
  parfaites, niveau 20…
- Décocher retire l'XP correspondante — pas de triche 😉

### Suivi
- Écran **Aujourd'hui** : anneau de progression (façon Activité), XP du jour,
  liste à cocher
- Écran **Progrès** : niveau + barre d'XP, graphique des 7 derniers jours,
  statistiques, trophées

### Design Apple
- Grands titres iOS, cartes arrondies, séparateurs fins, contrôle segmenté,
  feuilles modales avec poignée, alertes iOS, tab bar translucide (flou)
- **Mode sombre automatique** selon le réglage du téléphone
- Légère vibration à chaque coche

## 📱 Installation sur ton téléphone

C'est une **PWA** : pas besoin d'app store.

1. Héberge les fichiers (le plus simple : **GitHub Pages** — Settings →
   Pages → déployer depuis la branche)
2. Ouvre l'adresse dans le navigateur du téléphone
3. Menu → **« Ajouter à l'écran d'accueil »** (Android/Chrome) ou
   **Partager → « Sur l'écran d'accueil »** (iPhone/Safari)
4. L'app s'ouvre en plein écran, fonctionne **hors-ligne** et garde tes
   données sur le téléphone (localStorage — rien n'est envoyé en ligne)

## 🧪 Tester en local

```bash
npx http-server .
# puis ouvrir http://localhost:8080
```

## 🗂 Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application (interface + logique) |
| `manifest.webmanifest` | Métadonnées d'installation PWA |
| `sw.js` | Service worker (fonctionnement hors-ligne) |
| `icon.svg` / `icon-512.png` | Icônes de l'application |
