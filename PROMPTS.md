# Générer les personnages — prompts prêts à l'emploi

Le moteur attend des sprites (voir `DESIGN.md` §7 et `assets/hero/README.md`).
Ce fichier contient les prompts à coller directement dans Midjourney, DALL·E,
Leonardo ou Flux pour produire des personnages **fidèles à la planche de
référence**.

---

## Étape 1 — Fixer le style (à faire une seule fois)

Génère d'abord **un seul personnage de face**, itère jusqu'à ce qu'il te
plaise, puis **garde son URL / sa seed** : elle servira de référence pour tous
les autres.

### Prompt de base (Midjourney v6+)

```
chibi adventurer character, semi-realistic stylized game art, big head small
body proportions 2.7 heads tall, large expressive eyes with two highlights,
soft rosy cheeks, gentle subsurface skin shading, hand-painted fabric with
visible folds, worn leather straps, knitted wool texture, small metal buckles,
warm natural palette, soft ambient occlusion, no harsh outlines, front view,
full body, standing neutral pose, clean off-white background, character sheet,
Nintendo meets Ghibli meets Spiritfarer, cozy indie game key art
--ar 1:1 --style raw --s 250
```

### Réglages qui comptent

| Réglage | Valeur | Pourquoi |
|---|---|---|
| `--style raw` | toujours | évite le lissage « joli » qui écrase les matières |
| `--s 250` | 150–400 | au-delà, le modèle invente et casse la cohérence |
| `--ar 1:1` | toujours | les cases de l'atlas sont carrées |
| `--cref <url> --cw 100` | dès la 2ᵉ image | **c'est la clé de la cohérence entre poses** |

> `--cw 100` verrouille le visage **et** les vêtements. `--cw 0` ne garde que le
> visage : utile pour changer de tenue en gardant le même personnage.

---

## Étape 2 — Les cinq archétypes

Reprends le prompt de base et remplace le bloc de description.
Les codes couleur sont ceux **échantillonnés dans ta planche**.

### 1 · L'Explorateur — *curieux et courageux*
```
brown tousled hair, teal tunic #4b786a, orange-rust cape #b75a29,
dark brown leather harness #532f14, cream linen shirt #e7d3b2,
bulky travel backpack with crossed straps and bedroll, sturdy brown boots,
confident curious expression
```

### 2 · Le Voyageur des Brumes — *mystérieux et poétique*
```
white hair, deep indigo hooded cloak #201c47 with golden embroidery #e7b86c,
face partly in hood shadow, holding a small glowing brass lantern,
midnight blue layers #10152c, muted violet accents #a57aa7,
quiet mysterious expression
```

### 3 · La Gardienne de Lumière — *douce et bienveillante*
```
long white hair, cream robe #e7d6bd with golden stole #f1c26f,
soft star motifs, sage green trim #82aca2, warm peach skin tones #e49f82,
brown leather boots #7a522f, gentle kind smile, faint warm glow from garment
```

### 4 · L'Aventurière des Saisons — *libre et déterminée*
```
brown hair in high ponytail with green ribbon, olive green hooded cape #7d8b50,
tan leather tunic #cba772, rust orange accents #c16737, thigh satchel,
dark brown boots #523f2c, determined lively expression
```

### 5 · Le Petit Rêveur — *rêveur et optimiste*
```
curly grey-blue hair, midnight blue cape #788695 covered in tiny golden stars,
soft light blue wool outfit #9cafba, cream scarf #efd7ac,
dreamy optimistic expression, looking slightly upward
```

---

## Étape 3 — Les poses

Ajoute `--cref <url_du_perso> --cw 100` à **chacun** de ces prompts.

| Fichier | À ajouter au prompt |
|---|---|
| `idle` | `standing relaxed, side view facing right, arms at sides` |
| `walk` | `mid-stride walking, side view facing right, cape flowing behind, one leg forward` |
| `run` | `running fast, side view facing right, leaning forward, cape streaming` |
| `jump` | `jumping, side view facing right, knees tucked, cape lifted` |
| `cheer` | `jumping with joy, arms raised, eyes closed happy arcs, big smile` |
| `look` | `looking around curiously over the shoulder, three-quarter view` |
| `sit` | `sitting on the ground, knees up, resting, side view` |
| `sleep` | `sleeping curled up on the ground, peaceful, side view` |

**Toujours terminer par** :
`, full body, centered, clean transparent-ready flat background, no shadow on ground`

---

## Étape 4 — Le point difficile, dit franchement

Un générateur d'images ne produit **pas** 12 images cohérentes d'un cycle de
marche. Même avec `--cref`, les plis et les proportions bougent d'une image à
l'autre : au montage, ça scintille.

Trois voies réalistes, de la plus rapide à la plus belle :

### Voie A — Poses fixes *(1 heure, gros gain visuel immédiat)*
Génère **1 image par état** (idle, walk, cheer, jump…). Le moteur les affiche
en maintien, sans interpolation. Le personnage ne « marche » pas, mais il est
enfin au niveau de ta planche. **C'est ce que je recommande pour commencer.**
→ Atlas de 1 colonne × 8 lignes.

### Voie B — Animation par déformation *(1 week-end)*
Génère **une seule image nette** du personnage, découpe-la en morceaux
(tête, buste, bras, jambes, cape) dans Photoshop ou Photopea, puis anime les
morceaux dans **Rive** (gratuit, exporte en Lottie) ou **Spine**. C'est la
méthode des studios indés : une illustration, un squelette, toutes les
animations. Qualité de la référence **et** mouvement fluide.

### Voie C — Commande à un illustrateur
Envoie-lui `DESIGN.md` + `assets/hero/README.md` : la spec est complète
(proportions mesurées, palettes, format d'atlas, ancrages). Compter
150–400 € pour un personnage complet animé.

---

## Étape 5 — Intégration

Quelle que soit la voie, tu déposes les fichiers dans `assets/hero/` avec un
`manifest.json`, tu recharges : le moteur bascule automatiquement.

Pour la **voie A**, le JSON minimal d'une pièce :

```json
{
  "image": "outfit_tunic.png",
  "frameW": 512, "frameH": 512,
  "anchorX": 0.5, "anchorY": 0.94, "heightRatio": 0.86,
  "animations": {
    "idle":  { "row": 0, "frames": 1, "fps": 1, "loop": true },
    "walk":  { "row": 1, "frames": 1, "fps": 1, "loop": true },
    "cheer": { "row": 2, "frames": 1, "fps": 1, "loop": false },
    "jump":  { "row": 3, "frames": 1, "fps": 1, "loop": false }
  }
}
```

Une image par ligne, empilées verticalement dans un seul PNG. C'est tout.

> **Le plus simple pour démarrer** : un seul fichier `body_n.png` +
> `body_n.json` contenant le personnage **entier** (tenue, cape, sac compris).
> Le moteur n'exige pas les couches séparées — elles ne servent que si tu veux
> que la garde-robe change l'apparence. Avec un seul atlas, tu as déjà ton
> héros au bon niveau visuel dans l'application.
