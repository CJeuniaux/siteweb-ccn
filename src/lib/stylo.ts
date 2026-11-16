// Trait « stylo / feutre » de la charte : une forme pleine dont l'épaisseur varie finement le long du geste
// (pression), avec de petites irrégularités de direction et des extrémités rondes. Aucun filtre SVG :
// le tremblé est dans la géométrie, calculé une fois au build, stable pour une même graine.
import { hasard } from './pinceau';

export type P = [number, number];

/** Points denses le long d'une courbe Catmull-Rom passant par les points donnés. */
export function echantillonner(pts: P[], pas = 5): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / pas));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export interface OptionsStylo { epaisseur?: number; graine?: string; tremble?: number; pression?: number }

/** Contour plein d'un trait de stylo suivant les points (repère du SVG appelant). */
export function traitStylo(pts: P[], { epaisseur = 4, graine = '', tremble = 1, pression = 0.3 }: OptionsStylo = {}): string {
  const h = hasard(`stylo:${graine}`).n;
  const s = echantillonner(pts, Math.max(2, epaisseur * 1.2));
  const n = s.length;
  if (n < 2) return '';
  // longueur cumulée
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const tot = L[n - 1] || 1;
  // ondulations lentes (tremblé) et pression : sommes de sinus à phases tirées de la graine
  const ph = [h(), h(), h(), h(), h(), h()].map((v) => v * Math.PI * 2);
  const fr = [2 + h() * 3, 7 + h() * 6, 17 + h() * 10];
  const gauche: P[] = [], droite: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, u = L[i] / tot, d = L[i];
    const decale = tremble * epaisseur * 0.35 * (Math.sin(fr[1] * u * 6.28 + ph[0]) * 0.6 + Math.sin(fr[2] * u * 6.28 + ph[1]) * 0.4);
    let w = epaisseur * (1 + pression * (Math.sin(fr[0] * u * 6.28 + ph[2]) * 0.7 + Math.sin(fr[1] * u * 6.28 + ph[3]) * 0.3));
    // pointes : le trait s'affine à l'attaque et à la levée du stylo
    const bout = Math.min(d, tot - d) / (epaisseur * 3);
    if (bout < 1) w *= 0.45 + 0.55 * bout;
    const cx = s[i][0] + nx * decale, cy = s[i][1] + ny * decale;
    gauche.push([cx + nx * w / 2, cy + ny * w / 2]);
    droite.push([cx - nx * w / 2, cy - ny * w / 2]);
  }
  const f = (v: number) => Math.round(v * 10) / 10;
  const r0 = Math.hypot(gauche[0][0] - droite[0][0], gauche[0][1] - droite[0][1]) / 2;
  const r1 = Math.hypot(gauche[n - 1][0] - droite[n - 1][0], gauche[n - 1][1] - droite[n - 1][1]) / 2;
  let dd = `M${f(gauche[0][0])} ${f(gauche[0][1])}`;
  for (let i = 1; i < n; i++) dd += `L${f(gauche[i][0])} ${f(gauche[i][1])}`;
  dd += `A${f(r1)} ${f(r1)} 0 0 1 ${f(droite[n - 1][0])} ${f(droite[n - 1][1])}`;
  for (let i = n - 2; i >= 0; i--) dd += `L${f(droite[i][0])} ${f(droite[i][1])}`;
  dd += `A${f(r0)} ${f(r0)} 0 0 1 ${f(gauche[0][0])} ${f(gauche[0][1])}Z`;
  return dd;
}

/** Boucle dessinée à la main autour de (cx, cy), insérée dans un tracé. sens : 1 = horaire, -1 = antihoraire. */
export function boucle(cx: number, cy: number, r: number, sens = 1, depart = Math.PI / 2): P[] {
  const pts: P[] = [];
  for (let k = 0; k <= 8; k++) {
    const a = depart + sens * (k / 8) * Math.PI * 2;
    const rr = r * (1 + 0.12 * Math.sin(k * 1.7));
    pts.push([cx + Math.cos(a) * rr * 0.9, cy + Math.sin(a) * rr]);
  }
  return pts;
}

/** Variation stable d'un tracé : léger déplacement des points intermédiaires selon la graine. */
export function varier(pts: P[], graine: string, ampleur: number): P[] {
  const h = hasard(`varier:${graine}`).n;
  return pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : [p[0] + (h() - 0.5) * ampleur, p[1] + (h() - 0.5) * ampleur]));
}
