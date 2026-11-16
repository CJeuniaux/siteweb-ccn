// Bibliothèque de fils — les gestes du fil de Comme Chez Nous, et leurs règles d'emploi.
// Chaque geste rend la ligne centrale du trait (le rendu stylo est fait ailleurs) dans le repère
// de la page, en pixels. Les règles comptent autant que les formes : un support ne porte jamais
// deux fois le même geste, et le Nœud reste exceptionnel.
import { boucle, type P } from './stylo';

/** Petite ondulation régulière entre deux points, pour que rien ne soit jamais une droite parfaite. */
function onduler(ax: number, ay: number, bx: number, by: number, amplitude: number, pas = 7): P[] {
  const out: P[] = [];
  for (let i = 1; i < pas; i++) {
    const t = i / pas, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    const k = Math.sin(t * Math.PI) * Math.sin(t * Math.PI * 2.1) * amplitude;
    out.push([x + (-dy / l) * k, y + (dx / l) * k]);
  }
  return out;
}

/**
 * Adoucit un tracé en rognant ses angles (Chaikin) : une main ne fait pas de coin,
 * elle arrondit. Les deux extrémités ne bougent pas.
 */
export function adoucir(pts: P[], tours = 2): P[] {
  let p = pts;
  for (let t = 0; t < tours; t++) {
    const out: P[] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      out.push([ax + (bx - ax) * 0.25, ay + (by - ay) * 0.25], [ax + (bx - ax) * 0.75, ay + (by - ay) * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

/**
 * Entourer — on cerne quelque chose d'un trait, comme on entoure une silhouette sur une photo.
 * Le tour est ovale, un peu penché, jamais refermé exactement : il dépasse son point de départ.
 * depart / fin en radians : par où la main entre et ressort.
 */
export function entourer(cx: number, cy: number, rx: number, ry: number, graine: number[], depart = -2.2, tours = 1.12): P[] {
  const out: P[] = [];
  const pente = (graine[0] - 0.5) * 0.22;
  for (let t = 0; t <= tours; t += 0.022) {
    const a = depart + t * Math.PI * 2;
    const souffle = 1 + 0.045 * Math.sin(a * 2 + graine[1] * 6) + 0.025 * Math.sin(a * 3.3 + graine[2] * 6);
    // la main serre un peu en fin de tour, et s'écarte en sortant
    const sortie = t > tours - 0.18 ? (t - (tours - 0.18)) / 0.18 : 0;
    const x = Math.cos(a) * rx * souffle * (1 + sortie * 0.1);
    const y = Math.sin(a) * ry * souffle * (1 + sortie * 0.12);
    out.push([cx + x - y * pente, cy + y + x * pente]);
  }
  return out;
}

/**
 * Souligner — on passe un trait sous un mot. Il déborde des deux côtés, ondule légèrement,
 * et s'achève par un petit relevé, comme quand on lève le stylo.
 */
export function souligner(x0: number, x1: number, y: number, graine: number[], epaisseurTrait = 7): P[] {
  const a = x0 - 14 - graine[0] * 10, b = x1 + 16 + graine[1] * 14, l = b - a;
  const out: P[] = [];
  for (let t = 0; t <= 1.001; t += 0.05) {
    const x = a + l * t;
    const creux = Math.sin(t * Math.PI) * epaisseurTrait * 0.5;
    out.push([x, y + creux + Math.sin(t * 7 + graine[2] * 6) * 1.6]);
  }
  out.push([b + 14, y - epaisseurTrait * 0.9]);
  return out;
}

/** 1 · Chute — le fil tombe et se retourne. Pour une descente depuis le haut. */
export function chute(x: number, y0: number, y1: number, r = 26, sens: 1 | -1 = 1): P[] {
  const yb = y0 + (y1 - y0) * 0.42;
  return [
    [x, y0],
    ...onduler(x, y0, x, yb - r, r * 0.5),
    [x, yb - r],
    ...boucle(x + r * sens * 0.75, yb, r, sens, -Math.PI / 2),
    [x, yb + r * 0.9],
    ...onduler(x, yb + r, x, y1, r * 0.6),
    [x, y1],
  ];
}

/** 2 · Ruban — petite boucle penchée sur une montée. Pour relier deux éléments. */
export function ruban(ax: number, ay: number, bx: number, by: number, r = 20): P[] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2 - Math.abs(bx - ax) * 0.12;
  return [[ax, ay], ...onduler(ax, ay, mx - r, my, r * 0.8), ...boucle(mx, my + r * 0.6, r, -1, Math.PI * 0.9), ...onduler(mx + r, my, bx, by, r * 0.8), [bx, by]];
}

/** 3 · Retour — boucle haute, ouverte. Pour passer au-dessus de têtes. */
export function retour(ax: number, ay: number, bx: number, by: number, r = 30): P[] {
  const mx = (ax + bx) / 2, haut = Math.min(ay, by) - r * 2.2;
  return [[ax, ay], ...onduler(ax, ay, mx - r * 1.6, haut + r, r), ...boucle(mx, haut, r, 1, Math.PI * 0.55), ...onduler(mx + r * 1.6, haut + r, bx, by, r), [bx, by]];
}

/** 4 · Souffle — boucle basse après une longue ondulation. Pour une bannière. */
export function souffle(ax: number, ay: number, bx: number, by: number, r = 24): P[] {
  const nx = ax + (bx - ax) * 0.74, ny = ay + (by - ay) * 0.74;
  return [[ax, ay], ...onduler(ax, ay, nx - r, ny, r * 1.5, 11), ...boucle(nx, ny + r * 0.7, r, 1, -Math.PI / 2), ...onduler(nx + r, ny, bx, by, r * 0.7), [bx, by]];
}

/** 5 · Nœud — deux boucles inégales. Rare : une fois par support au plus. */
export function noeud(ax: number, ay: number, bx: number, by: number, r = 26): P[] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  return [
    [ax, ay], ...onduler(ax, ay, mx - r * 2, my, r),
    ...boucle(mx - r, my, r, 1, Math.PI * 0.6), ...boucle(mx + r * 0.9, my - r * 0.3, r * 0.6, -1, Math.PI * 0.4),
    ...onduler(mx + r * 2, my, bx, by, r), [bx, by],
  ];
}

/** 6 · Ligne — sans boucle. Pour les petits formats et les transitions. */
export function ligne(ax: number, ay: number, bx: number, by: number, amplitude = 16): P[] {
  return [[ax, ay], ...onduler(ax, ay, bx, by, amplitude, 9), [bx, by]];
}
