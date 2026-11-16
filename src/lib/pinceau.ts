// Formes « coup de pinceau » dessinées par le code (aplats, masques, étiquettes).
// Aucune image : un tracé à bords souples et irréguliers, plus un filtre SVG de pinceau sec (voir filtrePinceau).
// Tout est déterminé par une graine : une même page garde les mêmes formes d'un chargement à l'autre.

/** Générateur pseudo-aléatoire stable (mulberry32) à partir d'un texte. */
export function hasard(graine: string) {
  let h = 1779033703 ^ graine.length;
  for (let i = 0; i < graine.length; i++) { h = Math.imul(h ^ graine.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const suivant = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { n: suivant, entre: (min: number, max: number) => min + suivant() * (max - min), choix: <T,>(l: T[]) => l[Math.floor(suivant() * l.length)] };
}

/**
 * Les gabarits de coup de pinceau. Un coup de pinceau = une bande pleine aux bords souples et irréguliers
 * (ondulations de fréquences différentes, jamais de pointes régulières), dont une extrémité au moins
 * s'effiloche en quelques mèches de longueurs et de largeurs inégales. Le grain de pinceau sec
 * (bords rongés, petites traînées claires) est ajouté par le filtre SVG `filtrePinceau`.
 */
const GABARITS = [
  { nom: 'large', epaisseur: 0.72, arc: 0.04, pente: -0.04, depart: 'franc', fin: 'sec' },
  { nom: 'virgule', epaisseur: 0.58, arc: 0.1, pente: 0.05, depart: 'sec', fin: 'franc' },
  { nom: 'bande', epaisseur: 0.48, arc: 0.02, pente: -0.07, depart: 'franc', fin: 'sec' },
  { nom: 'appuye', epaisseur: 0.8, arc: -0.05, pente: 0.02, depart: 'sec', fin: 'sec' },
  { nom: 'sec', epaisseur: 0.62, arc: 0.06, pente: -0.09, depart: 'franc', fin: 'tres-sec' },
  { nom: 'trapu', epaisseur: 0.86, arc: 0.03, pente: 0.04, depart: 'sec', fin: 'franc' },
  { nom: 'oblique', epaisseur: 0.66, arc: -0.08, pente: 0.11, depart: 'franc', fin: 'sec' },
] as const;
export const NB_FORMES = GABARITS.length;

const f = (v: number) => Math.round(v * 10) / 10;
type P = [number, number];

/** Contour fermé lissé : chaque sommet devient le point de contrôle d'une courbe (bords souples). */
function lisse(pts: P[]) {
  const m = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const o = m(pts[pts.length - 1], pts[0]);
  let d = `M${f(o[0])} ${f(o[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const q = m(pts[i], pts[(i + 1) % pts.length]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(q[0])} ${f(q[1])}`;
  }
  return d + 'Z';
}

/**
 * Dessine un coup de pinceau dans une boîte de 400 × 260 et rend un seul tracé.
 * À remplir d'une couleur unie ; l'opacité éventuelle se met sur le groupe pour éviter les surimpressions.
 */
export function coupDePinceau(graine: string, variante?: number) {
  const r = hasard(graine);
  const g = GABARITS[(variante ?? Math.floor(r.n() * GABARITS.length)) % GABARITS.length];
  const L = 400, H = 260, cy = H / 2;
  const demi = (H * g.epaisseur) / 2;
  const xa = 22 + r.entre(0, 18), xz = L - 22 - r.entre(0, 18);
  const centre = (x: number) => cy + (x - L / 2) * g.pente - Math.sin(((x - xa) / (xz - xa)) * Math.PI) * g.arc * H;
  // Ondulations douces et irrégulières des bords : somme de sinus de fréquences et phases tirées au hasard
  const onde = () => {
    const c = [0, 1, 2].map((k) => ({ a: r.entre(0.03, 0.08) / (k + 1), w: r.entre(1.2, 2.4) * (k * 1.7 + 1), p: r.entre(0, 6.3) }));
    return (x: number) => c.reduce((s, o) => s + o.a * Math.sin(((x - xa) / (xz - xa)) * o.w * Math.PI + o.p), 0);
  };
  const ondeHaut = onde(), ondeBas = onde();
  const haut = (x: number) => centre(x) - demi * (1 + ondeHaut(x));
  const bas = (x: number) => centre(x) + demi * (1 + ondeBas(x));

  // Extrémité : franche (bord arrondi bosselé) ou sèche (mèches inégales)
  const bout = (type: string, x: number, sens: 1 | -1): P[] => {
    const pts: P[] = [];
    const y = (u: number) => haut(x) + (bas(x) - haut(x)) * u;
    if (type === 'franc') {
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        pts.push([x + sens * (Math.sin(t * Math.PI) * r.entre(8, 20) + r.entre(-4, 4)), y(t)]);
      }
      return pts;
    }
    const tres = type === 'tres-sec';
    let t = 0;
    while (t < 1) {
      const largeur = r.entre(0.07, tres ? 0.2 : 0.26);
      const milieu = Math.min(1, t + largeur / 2);
      const longueur = r.entre(-4, tres ? 105 : 70) * (1 - 0.4 * Math.abs(milieu - 0.5) * 2);
      if (t > 0) pts.push([x - sens * r.entre(4, tres ? 34 : 22), y(t)]); // creux entre deux mèches
      pts.push([x + sens * longueur, y(milieu)]);                           // bout de la mèche
      t = Math.min(1, t + largeur);
    }
    return pts;
  };

  const n = 9, dessus: P[] = [], dessous: P[] = [];
  for (let k = 0; k <= n; k++) {
    const x = xa + ((xz - xa) * k) / n;
    dessus.push([x, haut(x)]);
    dessous.unshift([x, bas(x)]);
  }
  const fin = bout(g.fin, xz, 1);
  const depart = bout(g.depart, xa, -1).reverse();
  const d = lisse([...dessus, ...fin, ...dessous, ...depart]);
  // Zones de pinceau sec (où le filtre ajoute des traînées claires) : seulement aux extrémités sèches
  const zone = (type: string) => (type === 'franc' ? 0 : type === 'tres-sec' ? 120 : 85);
  const sec = { gauche: zone(g.depart) ? xa + zone(g.depart) : null, droite: zone(g.fin) ? xz - zone(g.fin) : null };
  return { d, sec, traines: [] as string[], nom: g.nom, largeur: L, hauteur: H };
}

/**
 * Filtres à placer dans le <defs> du SVG, stables pour une graine donnée :
 * - `${id}-b` : bords légèrement rongés (feDisplacementMap), pour tout le coup de pinceau ;
 * - `${id}-s` : mêmes bords + fines traînées claires dans le sens du geste, pour les extrémités sèches.
 */
export function filtrePinceau(id: string, graine: string) {
  const r = hasard('filtre:' + graine);
  const s1 = Math.floor(r.entre(1, 999)), s2 = Math.floor(r.entre(1, 999));
  const bords = `<feTurbulence type="fractalNoise" baseFrequency="0.03 0.08" numOctaves="3" seed="${s1}" result="b"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="b" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>`;
  const zone = 'x="-12%" y="-25%" width="124%" height="150%" color-interpolation-filters="sRGB"';
  return `<filter id="${id}-b" ${zone}>${bords}</filter>`
    + `<filter id="${id}-s" ${zone}>${bords}`
    + `<feTurbulence type="fractalNoise" baseFrequency="0.007 0.16" numOctaves="2" seed="${s2}" result="s"/>`
    + `<feColorMatrix in="s" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -14 0 0 0 8.6" result="t"/>`
    + `<feComposite in="d" in2="t" operator="in"/></filter>`;
}

/**
 * Un coup de pinceau complet, prêt à insérer dans un SVG de 400 × 260 : définitions (filtres, masque
 * de transition) et tracés. Utilisé par les aplats (Aplat.astro).
 * Le pinceau sec apparaît progressivement vers les extrémités sèches : la couche « traînées » est dessous,
 * la couche pleine par-dessus s'efface en douceur (masque interne, invisible en tant que tel).
 */
export function dessinPinceau(id: string, graine: string, variante: number | undefined, teinte: string, transforme = '') {
  const p = coupDePinceau(graine, variante);
  const pc = (x: number) => Math.max(0, Math.min(1, x / 400)).toFixed(3);
  const stops = [
    ...(p.sec.gauche ? [[pc(p.sec.gauche - 95), 0], [pc(p.sec.gauche + 25), 1]] : [[0, 1]]),
    ...(p.sec.droite ? [[pc(p.sec.droite - 25), 1], [pc(p.sec.droite + 95), 0]] : [[1, 1]]),
  ].map(([o, a]) => `<stop offset="${o}" stop-color="#fff" stop-opacity="${a}"/>`).join('');
  const defs = filtrePinceau(id, graine)
    + `<linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="0">${stops}</linearGradient>`
    + `<mask id="${id}-m" maskUnits="userSpaceOnUse" x="-200" y="-200" width="800" height="660"><rect x="-200" y="-200" width="800" height="660" fill="url(#${id}-g)"/></mask>`;
  const t = transforme ? ` transform="${transforme}"` : '';
  const trace = (filtre: string, masque = '') => `<path d="${p.d}" style="fill:${teinte}" filter="url(#${id}-${filtre})"${masque}/>`;
  const corps = `<g${t}>` + (p.sec.gauche || p.sec.droite ? trace('s') + trace('b', ` mask="url(#${id}-m)"`) : trace('b')) + '</g>';
  return { defs, corps };
}

export function pose(graine: string) {
  const r = hasard('pose:' + graine);
  const cotes = ['gauche', 'droite', 'haut', 'bas'] as const;
  return {
    rotation: f(r.entre(-7, 7)),
    miroirX: r.n() < 0.5,
    miroirY: r.n() < 0.3,
    echelle: f(r.entre(1.04, 1.18) * 100) / 100,
    cote: r.choix([...cotes]),
  };
}
