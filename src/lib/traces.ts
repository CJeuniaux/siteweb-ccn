// Bibliothèque des tracés manuscrits de la charte (composant Trait.astro).
// Chaque tracé = une ligne centrale dessinée à la main dans son propre repère (proportions conservées à
// toutes les largeurs) ; le rendu « stylo » (épaisseur variable, tremblé) est fait par traitStylo().
// Une graine stable fait varier légèrement chaque occurrence : deux tracés voisins ne sont jamais identiques.
import { boucle, type P } from './stylo';
// Les gestes dessinés par Charlotte (A-INTEGRER), extraits en lignes par scripts/vectoriser.mjs
import dessins from './dessins.json';
const dessin = (nom: keyof typeof dessins): Trace => ({ largeur: dessins[nom].largeur, hauteur: dessins[nom].hauteur, epaisseur: 5, tremble: 0, traits: dessins[nom].traits as P[][] });

export interface Trace { largeur: number; hauteur: number; epaisseur: number; traits: P[][]; tremble?: number; pression?: number }

const miroir = (t: Trace): Trace => ({ ...t, traits: t.traits.map((tr) => tr.map(([x, y]) => [t.largeur - x, y] as P).reverse()) });

const boucleGauche: Trace = {
  largeur: 700, hauteur: 150, epaisseur: 5,
  traits: [[[6, 112], [70, 104], [140, 96], ...boucle(196, 72, 30, -1), [236, 104], [330, 112], [450, 104], [570, 92], [694, 98]]],
};

export const TRACES = {
  /** ligne libre, presque droite */
  libre: { largeur: 600, hauteur: 80, epaisseur: 4.5, traits: [[[6, 50], [90, 40], [180, 52], [290, 42], [400, 48], [500, 32], [594, 38]]] },
  /** grande courbe ample */
  ample: { largeur: 900, hauteur: 260, epaisseur: 6, traits: [[[10, 236], [150, 200], [320, 108], [500, 52], [690, 58], [890, 22]]] },
  /** trait qui traverse une composition (photo comprise) */
  traversant: { largeur: 1000, hauteur: 200, epaisseur: 6, traits: [[[0, 166], [170, 128], [400, 146], [590, 76], [800, 92], [1000, 30]]] },
  /** ligne avec une boucle à gauche */
  'boucle-gauche': boucleGauche,
  /** ligne avec une boucle à droite */
  'boucle-droite': miroir(boucleGauche),
  /** double vague */
  'double-vague': { largeur: 700, hauteur: 110, epaisseur: 4.5, traits: [[[6, 62], [92, 30], [182, 72], [272, 34], [362, 72], [452, 32], [542, 70], [632, 40], [694, 56]]] },
  /** courbe sans boucle */
  'sans-boucle': { largeur: 700, hauteur: 100, epaisseur: 5, traits: [[[6, 82], [200, 72], [352, 30], [500, 20], [694, 44]]] },
  /** nœud discret au milieu d'une ligne */
  noeud: {
    largeur: 460, hauteur: 140, epaisseur: 4.5,
    traits: [[[6, 96], [90, 92], [170, 84], [214, 62], [232, 34], [214, 20], [194, 34], [206, 66], [244, 96], [272, 88], [262, 66], [236, 76], [270, 100], [360, 98], [454, 86]]],
  },
  /** petite ligne souple terminée par une bouclette : sous les pictogrammes de service uniquement */
  bouclette: {
    largeur: 330, hauteur: 100, epaisseur: 9, tremble: 0.25,
    traits: [[[8, 72], [60, 60], [124, 66], [184, 76], [226, 70], ...boucle(258, 44, 24, -1), [292, 76], [324, 68]]],
  },
  /** trois petits traits droits d'accent, façon annotation (une seule fois par page au plus) */
  eclat: { largeur: 90, hauteur: 80, epaisseur: 5, tremble: 0, pression: 0.08, traits: [[[18, 56], [12, 26]], [[36, 48], [48, 16]], [[54, 64], [82, 54]]] },
  /** court trait sous un mot choisi (jamais automatique) — geste « Souligner » */
  souligne: { largeur: 320, hauteur: 30, epaisseur: 5, traits: [[[4, 20], [100, 13], [210, 17], [316, 10]]] },
  /** geste « Relier » : une ligne qui va d'une idée à l'autre en se nouant au passage */
  relier: {
    largeur: 360, hauteur: 120, epaisseur: 5, tremble: 0.4,
    traits: [[[6, 92], [66, 84], [128, 72], ...boucle(176, 48, 26, 1, Math.PI * 0.75), [232, 70], [292, 82], [354, 74]]],
  },
  /** geste « Orienter » : une flèche tracée à la main, qui montre la suite */
  fleche: {
    largeur: 240, hauteur: 110, epaisseur: 5, tremble: 0.5,
    traits: [
      [[8, 86], [62, 62], [128, 44], [196, 34], [228, 32]],
      [[188, 10], [230, 32], [190, 58]],
    ],
  },
} satisfies Record<string, Trace>;

// Les gestes de la charte remplacent les tracés calculés : ce sont les dessins de Charlotte, tels quels.
Object.assign(TRACES, {
  bouclette: dessin('relier'), relier: dessin('relier'), eclat: dessin('accentuer'),
  souligne: dessin('souligner'), fleche: dessin('orienter'), entourer: dessin('entourer'),
});

export type VarianteTrace = keyof typeof TRACES;
