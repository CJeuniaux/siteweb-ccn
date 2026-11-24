// Formes organiques des photos (planche « Photographies des services ») : silhouettes arrondies,
// asymétriques, toutes différentes. Chaque forme est une suite de points dans un carré 0–1, lissée
// en courbe fermée. Elle sert de masque à la photo (clip-path), d'aplat décalé derrière elle, et de
// guide au trait fin qui la longe en partie.
import type { P } from './stylo';
import { hasard } from './pinceau';

// Points dans le sens des aiguilles d'une montre, en partant du flanc gauche.
const FORMES: P[][] = [
  [[0.03, 0.50], [0.09, 0.20], [0.29, 0.07], [0.50, 0.13], [0.72, 0.04], [0.93, 0.16], [0.98, 0.48], [0.93, 0.80], [0.75, 0.96], [0.54, 0.90], [0.33, 0.97], [0.11, 0.86]],
  [[0.02, 0.44], [0.13, 0.13], [0.36, 0.05], [0.60, 0.10], [0.84, 0.05], [0.97, 0.30], [0.95, 0.62], [0.99, 0.84], [0.80, 0.95], [0.56, 0.97], [0.30, 0.91], [0.09, 0.93]],
  [[0.04, 0.56], [0.06, 0.26], [0.22, 0.08], [0.44, 0.04], [0.63, 0.12], [0.83, 0.07], [0.97, 0.26], [0.96, 0.58], [0.88, 0.88], [0.66, 0.97], [0.42, 0.92], [0.18, 0.97]],
  [[0.03, 0.40], [0.16, 0.10], [0.40, 0.09], [0.58, 0.03], [0.80, 0.10], [0.96, 0.22], [0.99, 0.54], [0.90, 0.78], [0.94, 0.94], [0.68, 0.93], [0.44, 0.98], [0.20, 0.90], [0.05, 0.74]],
  [[0.02, 0.52], [0.08, 0.24], [0.26, 0.05], [0.48, 0.10], [0.70, 0.03], [0.90, 0.11], [0.98, 0.38], [0.94, 0.66], [0.97, 0.88], [0.76, 0.97], [0.50, 0.93], [0.26, 0.98], [0.07, 0.84]],
  [[0.05, 0.46], [0.04, 0.22], [0.20, 0.06], [0.42, 0.11], [0.66, 0.05], [0.88, 0.09], [0.98, 0.34], [0.95, 0.60], [0.86, 0.90], [0.62, 0.95], [0.40, 0.90], [0.16, 0.96], [0.03, 0.76]],
];
export const NB_FORMES_PHOTO = FORMES.length;

const f = (v: number) => Math.round(v * 1000) / 1000;

/** Courbe lisse passant par tous les points (Catmull-Rom), fermée ou ouverte. */
export function courbe(pts: P[], fermee = true): string {
  const n = pts.length;
  const a = (i: number) => (fermee ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (fermee ? n : n - 1); i++) {
    const p0 = a(i - 1), p1 = a(i), p2 = a(i + 1), p3 = a(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)},${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)},${f(p2[0])} ${f(p2[1])}`;
  }
  return fermee ? d + 'Z' : d;
}

const autour = (pts: P[], k: number, dx = 0, dy = 0): P[] => pts.map(([x, y]) => [0.5 + (x - 0.5) * k + dx, 0.5 + (y - 0.5) * k + dy]);

/**
 * Une forme de photo : masque, aplat décalé, trait partiel.
 * - numero : choix explicite (les cinq services d'une même page reçoivent 0, 1, 2…) ; sinon tiré de la graine
 * - miroir : la forme est retournée (image à gauche), l'aplat et le trait suivent
 * - lx, ly : taille du repère du trait (il est dessiné à l'échelle de l'écran, pour un tracé régulier)
 */
export function formePhoto(graine: string, numero?: number, miroir = false, lx = 1, ly = 1) {
  const h = hasard(`forme:${graine}`).n;
  const i = ((numero ?? Math.floor(h() * FORMES.length)) % FORMES.length + FORMES.length) % FORMES.length;
  const retourne = (pts: P[]): P[] => (miroir ? pts.map(([x, y]) => [1 - x, y] as P).reverse() : pts);
  const base = retourne(FORMES[i]);
  // L'aplat : une autre silhouette, un peu plus grande, glissée vers le bas et l'extérieur
  const fond = autour(retourne(FORMES[(i + 2) % FORMES.length]), 1.03, miroir ? -0.045 : 0.045, 0.06);
  // Le trait : il longe le haut de la forme à distance, sur un peu moins de la moitié du tour, puis s'en écarte
  const n = base.length;
  const depart = base.reduce((m, p, k) => (p[0] + p[1] * 0.6 < base[m][0] + base[m][1] * 0.6 ? k : m), 0); // le point le plus en haut à gauche
  const pas = 1, debut = depart - 2, combien = Math.round(n * 0.62);
  const large = autour(base, 1.07, 0, -0.012);
  const trait: P[] = [];
  for (let k = 0; k < combien; k++) {
    const [x, y] = large[(((debut + k * pas) % n) + n) % n];
    const t = k / (combien - 1), ecart = 0.03 * Math.sin(t * Math.PI * 2.2 + h() * 2);
    trait.push([(x + ecart * 0.6) * lx, (y + ecart) * ly]);
  }
  return { numero: i, masque: courbe(base), aplat: courbe(fond), trait: courbe(trait, false) };
}
