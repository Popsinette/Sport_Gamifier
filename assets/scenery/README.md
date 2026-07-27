# Décors illustrés

Dossier de destination des paysages. Vide tant qu'aucune planche n'a été
livrée : le moteur dessine alors ses silhouettes procédurales, comme
aujourd'hui.

## Livraison

Déposer la planche générée dans `raw-paysages/`, puis :

```bash
node tools/build-scenery.js raw-paysages/vallee.png
```

Le script segmente automatiquement la planche — pas besoin d'un fichier par
élément, ni d'une disposition particulière :

1. détourage du fond s'il n'est pas déjà transparent, avec la tolérance
   adaptative des personnages ;
2. recherche des groupes de pixels opaques connexes (8-connexité, pour ne pas
   émietter un feuillage peint) ;
3. fusion des groupes voisins, pour qu'un tronc peint en deux masses ne
   donne pas deux fichiers ;
4. recadrage serré, marge de 6 px ;
5. classement : plus large que 45 % de la planche → **bande** de décor,
   sinon → **objet** isolé.

Il écrit `piece_00.png`, `piece_01.png`… dans l'ordre de lecture, plus
`contact.png` : une planche de contrôle sur damier qui montre chaque
découpe numérotée. C'est elle qu'on regarde pour vérifier le détourage
avant de nommer les pièces.

## Nommage final

Une fois les découpes validées, les pièces sont renommées selon leur rôle :

```
bande_<biome>_<plan>.png     ex. bande_vallee_montagnes.png
arbre_feuillu_1.png          objets partagés entre biomes verts
conifere.png  buisson.png  rocher.png  herbes_hautes.png
```

Les bandes sont répétées en miroir par le moteur : le raccord est donc
garanti sans couture, quelle que soit la planche livrée.
