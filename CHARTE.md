# Charte Comme Chez Nous — ce qui est réellement en place

Document de référence pour finaliser la charte graphique (destiné à Claude Design).
Tout ce qui suit est **relevé dans le code du site**, pas une intention : les valeurs
sont celles de `src/styles/commun.css` et `src/lib/fils.ts`.

> **Attention** : le `CLAUDE.md` du projet décrit encore l'ancienne direction
> (Nunito, Caveat, crème `#FCF5F3`). Elle a été remplacée. Les valeurs ci-dessous
> font foi. Le `CLAUDE.md` doit être mis à jour ou il induira en erreur.

---

## 1. Couleurs

Une couleur par service, plus l'encre et le fond. Aucun dégradé décoratif.

| Jeton | Valeur | Emploi |
|---|---|---|
| `--rouge` | `#E47663` | Le Rebond |
| `--bleu` | `#699FBF` | Chez Toît |
| `--jaune` | `#FDCC6C` | Parent'Elle |
| `--vert` | `#94B88D` | Toudi Boudji |
| `--mauve` | `#A08DB6` | Promotion de la santé — **et le fil** |
| `--encre` | `#121B30` | textes, boutons, pied de page |
| `--fond` | `#FAF9F6` | fond de page |
| `--filet` | `rgba(18,27,48,.2)` | filets de séparation |

**Couleurs de texte.** Le jaune et le rouge ne sont pas lisibles en texte sur le fond
crème. Il existe une variante assombrie par thème, à utiliser dès qu'une couleur de
service porte du texte : rouge `#A9503E`, bleu `#3F6E92`, jaune `#8A6A12`,
vert `#55753F`, mauve `#6A5290`.

## 2. Typographie

- **Titres** : Fraunces Variable, graisse 600, réglages `'SOFT' 100, 'WONK' 0`
  (terminaisons arrondies, pas de fantaisie), interlettrage `-.018em`.
- **Textes, menus, données** : Inter, 17 px, interligne 1,6.
- **Accroches** : Fraunces **en italique**, dans la couleur du service.
  C'est la voix de la marque : « *Un endroit où souffler, se poser, et repartir.* »
  Ne jamais mettre l'accroche en Inter : elle perdrait son caractère.
- Les polices sont auto-hébergées (`@fontsource`), aucun appel externe.

Largeur de page : 1240 px, gouttière 32 px.

## 3. Le fil — le cœur de l'identité

Le fil n'est pas une décoration : c'est **le** langage graphique. Un trait libre et
continu qui relie les personnes, les services et les parcours.

### Principes non négociables

1. **Un seul fil par page.** Jamais une collection de tracés indépendants.
2. Il reste **derrière** les contenus, ne couvre jamais un texte, ne traverse jamais
   un visage.
3. Il circule dans les marges et les espaces libres, pas au milieu des paragraphes.
4. Il **annote** : il entoure, il souligne, puis il descend. Ce sont des gestes de
   lecture, pas une trajectoire décorative.
5. Il se dévoile **au rythme du défilement**, jamais en animation autonome. Sous
   `prefers-reduced-motion`, il s'affiche entier et immobile.
6. Sa couleur suit les services traversés ; par défaut, il est mauve.

### Comment il est tracé (et pourquoi ça compte)

Le trait n'est pas une courbe mathématique. Une courbe parfaite, même tremblée par
des sinusoïdes, se reconnaît immédiatement : les oscillations se répètent.

Le site simule donc **une main** (`plume()` dans `src/lib/fils.ts`) : une plume qui
*essaie* de suivre un tracé idéal, avec du retard et de l'élan. Elle dépasse dans les
virages, coupe les angles d'elle-même, et dérive lentement autour de son intention.
L'épaisseur suit la **vitesse ressentie** : le trait grossit quand la main ralentit,
s'affine quand elle file, et se pose et se lève aux extrémités.

Les irrégularités viennent d'un bruit doux à trois échelles — le geste large,
l'hésitation, le grain — et **jamais d'une fonction périodique**.

### Bibliothèque de gestes

Six gestes nommés, dans `src/lib/fils.ts`, chacun avec sa règle d'emploi :

| Geste | Forme | Emploi |
|---|---|---|
| **Chute** | tombe et se retourne | une descente depuis le haut |
| **Ruban** | petite boucle penchée sur une montée | relier deux éléments |
| **Retour** | boucle haute, ouverte | passer au-dessus de têtes |
| **Souffle** | boucle basse après une longue ondulation | une bannière |
| **Nœud** | deux boucles inégales | **rare** : une fois par support au plus |
| **Ligne** | sans boucle | petits formats, transitions |

Plus deux gestes d'annotation : **entourer** (ovale penché, jamais refermé
exactement, qui déborde son point de départ) et **souligner** (trait sous un terme,
qui déborde des deux côtés et se relève — abordé par la gauche en remontant, sinon
on dessine un crochet et non un soulignement).

**Ne pas** faire de boucles systématiques ou identiques, ni une boucle à chaque
changement de section.

## 4. Photographies

- Noir et blanc contrasté, grain d'impression léger.
- **Détourées** : fond transparent, un liseré blanc irrégulier, et un trait de stylo
  qui suit la silhouette. Le détourage cerne déjà le sujet : **ne rien ajouter
  autour** (ni cadre, ni ombre, ni second cercle).
- **Non détourées** : cadre griffonné à la main.
- Le format de fichier compte : une image détourée doit rester en PNG. Convertie en
  WebP avec perte, elle perd sa transparence et le contour échoue.

## 5. Pictogrammes

Les quatre pictos des services sont extraits du logo officiel et vivent dans une
**source unique** (`src/lib/pictos.ts`). Ne jamais les redessiner ailleurs.
Promotion de la santé n'étant pas dans le logo 2 × 2, elle utilise un picto au trait.

Des versions matricielles haute résolution (1254 px) existent dans `KIT-CRM/png/`
pour l'impression et les réseaux sociaux. Sur le site, les pictos restent vectoriels.

## 6. Ce qui est interdit

Demandes explicites de Charlotte, à respecter :

- pas de « blobs » lisses ni de formes organiques molles ;
- pas d'éclats ni de soulignés **jaunes** ;
- pas de cadres ni d'ombres autour des photos détourées ;
- pas d'effet néon, pas d'ombre portée, pas de dégradé décoratif ;
- pas de look « template SaaS » ;
- orthographe : **Chez Toît**, **Parent'Elle**.

## 7. Ton éditorial

Humain, digne, inclusif. Centré sur les personnes et les liens. Beaucoup d'espace et
de respiration. Écriture inclusive telle qu'employée par l'association
(accueilli·e, travailleur·euse). Jamais de misérabilisme.

Sur chaque page : bandeau d'urgence (DUS 071 20 23 10 · Urgence 112), bouton
« J'ai besoin d'aide », bouton « Faire un don ».

---

## 8. Ce qui reste à trancher

- Le `CLAUDE.md` décrit l'ancienne charte : à réécrire à partir de ce document.
- L'intro de l'accueil annonce « **Quatre** parcours complémentaires » alors que le
  site présente cinq services (la santé étant transversale) : à arbitrer.
- Les logos des partenaires manquent : aucun fichier fourni, ils s'affichent en texte.
