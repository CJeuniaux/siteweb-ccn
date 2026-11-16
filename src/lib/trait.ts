// Contours griffonnés autour des photos (charte : intervention au stylo sur la photo).
// contourGriffonne() suit la silhouette d'une image détourée (canal alpha) ; cadreGriffonne() entoure une photo
// non détourée. Les deux renvoient la ligne centrale ; le rendu stylo est fait par traitStylo() (lib/stylo.ts).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { hasard } from './pinceau';

import type { P } from './stylo';

export type Griffon = { largeur: number; hauteur: number; traits: P[][] };
const cache = new Map<string, Promise<Griffon | null>>();

/**
 * Contour griffonné autour du sujet d'une image détourée : de l'épaule gauche à l'épaule droite
 * en passant au-dessus de la tête, un peu décollé de la silhouette, avec une petite boucle à la fin. Coordonnées dans un repère 1000 × (1000·h/l).
 */
export function contourGriffonne(src: string, graine: string) {
  if (!cache.has(src + graine)) cache.set(src + graine, calculer(src, graine).catch((e) => { console.warn("[contour]", src, e?.message); return null; }));
  return cache.get(src + graine)!;
}

async function calculer(src: string, graine: string) {
  const tampon = /^https?:\/\//.test(src)
    ? Buffer.from(await (await fetch(src)).arrayBuffer())
    : await readFile(join(process.cwd(), 'public', src));
  const W = 200;
  const { data, info } = await sharp(tampon).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const H = info.height, opaque = (x: number, y: number) => data[(y * W + x) * 4 + 3] > 60;

  // Centre de la silhouette, remonté vers le haut (tête / épaules)
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (opaque(x, y)) { sx += x; sy += y; n++; }
  if (!n) return null;
  const cx = sx / n, cy = sy / n + H * 0.08;

  // Balayage : pour chaque angle, le point opaque le plus éloigné du centre
  const angles: number[] = [], rayons: number[] = [];
  for (let a = 188; a <= 352; a += 4) {
    const r = (a * Math.PI) / 180;
    let loin = 0;
    for (let t = 0; t < Math.max(W, H) * 1.5; t += 1) {
      const x = Math.round(cx + Math.cos(r) * t), y = Math.round(cy + Math.sin(r) * t);
      if (x < 0 || y < 0 || x >= W || y >= H) break;
      if (opaque(x, y)) loin = t;
    }
    angles.push(r); rayons.push(loin);
  }
  // Lissage : le trait suit la forme générale, pas chaque mèche de cheveux
  const lisses = rayons.map((_, i) => {
    let s = 0, k = 0;
    for (let j = i - 3; j <= i + 3; j++) if (rayons[j] !== undefined) { s += rayons[j]; k++; }
    return s / k;
  });

  const echelle = 1000 / W, hauteur = Math.round(H * echelle);
  const traits: P[][] = [];
  for (let p = 0; p < 1; p++) {
    const h = hasard(`${graine}:contour:${p}`).n;
    const marge = W * (0.022 + p * 0.014);
    const pts: P[] = [];
    for (let i = 0; i < angles.length; i += 3) {
      const r = lisses[i] + marge + (h() - 0.5) * W * 0.02;
      pts.push([(cx + Math.cos(angles[i]) * r) * echelle, (cy + Math.sin(angles[i]) * r) * echelle]);
    }
    if (p === 0) {
      // Petite boucle griffonnée en fin de trait
      const [x, y] = pts[pts.length - 1];
      pts.push([x - 10, y + 45], [x - 55, y + 60], [x - 70, y + 20], [x - 35, y + 5], [x - 30, y + 55], [x - 60, y + 110]);
    } else {
      pts.splice(0, 2); pts.splice(-1);
    }
    traits.push(pts);
  }
  return { largeur: 1000, hauteur, traits };
}

/**
 * Cadre griffonné autour d'une photo non détourée (moodboard : cadre tracé à la main autour du sujet) :
 * un tour un peu de travers qui déborde de la photo et dépasse son point de départ.
 * Coordonnées dans un repère 1000 × (1000·h/l).
 */
export function cadreGriffonne(largeur: number, hauteur: number, graine: string): Griffon {
  const H = Math.round((1000 * hauteur) / largeur), m = 22;
  const traits: P[][] = [];
  for (let p = 0; p < 1; p++) {
    const h = hasard(`${graine}:cadre:${p}`).n, j = (a: number) => (h() - 0.5) * a;
    const coins: P[] = [[-m + j(20), -m + j(20)], [1000 + m + j(20), -m + j(24)], [1000 + m + j(24), H + m + j(20)], [-m + j(24), H + m + j(20)]];
    const pts: P[] = [];
    const tour = p === 0 ? [0, 1, 2, 3, 0] : [2, 3, 0];
    for (let k = 0; k < tour.length - 1; k++) {
      const a = coins[tour[k]], b = coins[tour[k + 1]];
      pts.push([a[0] + j(10), a[1] + j(10)], [a[0] + (b[0] - a[0]) * 0.5 + j(26), a[1] + (b[1] - a[1]) * 0.5 + j(26)]);
    }
    const fin = coins[tour[tour.length - 1]];
    if (p === 0) pts.push(fin, [fin[0] + (coins[1][0] - fin[0]) * 0.22, fin[1] + 14 + j(10)]);
    else pts.push(fin, [fin[0] + 10, fin[1] - 60]);
    traits.push(pts);
  }
  return { largeur: 1000, hauteur: H, traits };
}

const cacheBords = new Map<string, Promise<{ haut: boolean; bas: boolean; gauche: boolean; droite: boolean } | null>>();
/**
 * Bords « coupés net » d'une image détourée : un côté où le sujet touche le bord du fichier
 * (au moins 12 % de ce bord est opaque). Ces côtés reçoivent un fondu (Visuel.astro), sans recadrage.
 */
export function bordsCoupes(src: string) {
  if (!cacheBords.has(src)) cacheBords.set(src, (async () => {
    const tampon = /^https?:\/\//.test(src) ? Buffer.from(await (await fetch(src)).arrayBuffer()) : await readFile(join(process.cwd(), 'public', src));
    const W = 300;
    const { data, info } = await sharp(tampon).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const H = info.height, a = (x: number, y: number) => data[(y * W + x) * 4 + 3] > 128;
    const part = (n: number, f: (i: number) => boolean) => { let k = 0; for (let i = 0; i < n; i++) if (f(i)) k++; return k / n; };
    const bord = (f: (i: number, p: number) => boolean, n: number) => Math.max(part(n, (i) => f(i, 0)), part(n, (i) => f(i, 1)));
    return {
      haut: bord((i, p) => a(i, p), W) > 0.12,
      bas: bord((i, p) => a(i, H - 1 - p), W) > 0.12,
      gauche: bord((i, p) => a(p, i), H) > 0.12,
      droite: bord((i, p) => a(W - 1 - p, i), H) > 0.12,
    };
  })().catch(() => null));
  return cacheBords.get(src)!;
}
