// Reporte les formes de référence du logo général (A-INTEGRER/logos-definitifs/FORMES-LOGO-GENERAL.svg,
// fourni par Charlotte le 24/11/2026) dans les fichiers sources : le logo général (trois versions) et les
// pastilles des quatre services qui le composent. Chaque service garde ainsi partout la forme qu'il a dans
// le logo. Les pictogrammes ne sont pas redessinés : ils sont seulement replacés au centre de leur forme.
// Promotion de la santé ne figure pas dans le logo : sa pastille n'est pas touchée.
// Usage : node scripts/formes.mjs   puis   node scripts/identite.mjs && node scripts/icones.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'A-INTEGRER/logos-definitifs';
const T = 1254;
// Couleur de chaque forme dans le fichier de référence (ordre du logo : haut gauche, haut droite, bas gauche, bas droite)
const AXES = [
  { nom: 'LE-REBOND', teinte: [0xf3, 0x64, 0x4c], picto: 0.32953 },
  { nom: 'CHEZ-TOIT', teinte: [0x48, 0x9e, 0xc7], picto: 0.31941 },
  { nom: 'TOUDI-BOUDJI', teinte: [0x83, 0xb8, 0x67], picto: 0.26749 },
  { nom: 'PARENT-ELLE', teinte: [0xa5, 0x76, 0xba], picto: 0.28698 },
];

const { data } = await sharp(`${SRC}/FORMES-LOGO-GENERAL.svg`).resize(T, T).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const ecart = (i, c) => Math.hypot(data[i] - c[0], data[i + 1] - c[1], data[i + 2] - c[2]);
const classe = (x, y) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= T || y >= T) return -1;
  const i = (y * T + x) * 3;
  if (ecart(i, [255, 255, 255]) < 70) return -1;
  let m = 0;
  for (let k = 1; k < AXES.length; k++) if (ecart(i, AXES[k].teinte) < ecart(i, AXES[m].teinte)) m = k;
  // les pixels de bord (mélange avec le blanc) n'appartiennent à aucune forme
  return ecart(i, AXES[m].teinte) < 40 ? m : -1;
};

// Contour de chaque forme : centre de gravité, puis le bord relevé tout autour (les formes sont pleines et
// arrondies), très légèrement lissé pour gommer les dents du tracé automatique.
const N = 80;
for (const [k, a] of AXES.entries()) {
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < T; y += 2) for (let x = 0; x < T; x += 2) if (classe(x, y) === k) { sx += x; sy += y; n++; }
  a.cx = sx / n; a.cy = sy / n;
  let r = Array.from({ length: N }, (_, j) => {
    const t = (j / N) * 2 * Math.PI; let dernier = 0;
    // on s'arrête à la sortie de la forme (une fine couture du tracé automatique ne compte pas)
    for (let d = 0; d < 900 && d - dernier < 8; d += 0.5) if (classe(a.cx + d * Math.cos(t), a.cy + d * Math.sin(t)) === k) dernier = d;
    return dernier + 1;
  });
  r = r.map((v, j) => (r[(j + N - 1) % N] + 2 * v + r[(j + 1) % N]) / 4);
  a.pts = r.map((v, j) => { const t = (j / N) * 2 * Math.PI; return [a.cx + v * Math.cos(t), a.cy + v * Math.sin(t)]; });
  const xs = a.pts.map((p) => p[0]), ys = a.pts.map((p) => p[1]);
  a.boite = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

const f = (v) => String(Math.round(v * 10) / 10);
const courbe = (p) => {
  const n = p.length; let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += ` C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)},${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`;
  }
  return d + ' Z';
};

// 1. Pastilles : la forme du logo, agrandie pour remplir le carré de 500, son centre de gravité sous le pictogramme
for (const a of AXES) {
  const [x0, y0, x1, y1] = a.boite, l = x1 - x0, h = y1 - y0;
  let e = 460 / Math.max(l, h);
  // la forme ne doit pas sortir du carré une fois centrée sur son centre de gravité
  e = Math.min(e, 242 / (a.cx - x0), 242 / (x1 - a.cx), 247 / (a.cy - y0), 237 / (y1 - a.cy));
  a.echelle = e;
  // pictogramme un peu réduit dans les formes plus plates, pour garder de l'air autour
  a.reduction = Math.max(0.8, Math.min(1, (Math.min(l, h) * e) / 420));
  const d = courbe(a.pts.map(([x, y]) => [250 + (x - a.cx) * e, 255 + (y - a.cy) * e]));
  for (const version of ['COULEURS', 'NOIR', 'BLANC']) {
    const p = `${SRC}/AXE-${a.nom}-${version}.svg`;
    let s = readFileSync(p, 'utf8');
    s = s.replace(/(<svg[^>]*>\s*<path d=")[^"]+(")/, `$1${d}$2`);
    s = s.replace(/(<g transform="translate\(250,255\) scale\()[\d.]+(\))/, `$1${(a.picto * a.reduction).toFixed(5)}$2`);
    writeFileSync(p, s);
  }
  console.log(a.nom, 'forme', Math.round(l * e), 'x', Math.round(h * e), 'picto x', a.reduction.toFixed(2));
}

// 2. Logo général : les quatre formes à leur place, sans liseré (elles sont séparées par un intervalle),
//    chaque pictogramme au centre de gravité de sa forme, à la même proportion que dans sa pastille
const E = 0.4, DX = 60, DY = 24;
for (const version of ['COULEURS', 'NOIR', 'BLANC']) {
  const p = `${SRC}/LOGO-GENERAL-${version}.svg`;
  let s = readFileSync(p, 'utf8'), i = 0, j = 0;
  s = s.replace(/<path d="[^"]*"( fill="[^"]*")( stroke="[^"]*" stroke-width="[^"]*")?\/>/g, (tout, fond, lisere) => {
    if (i >= AXES.length) return tout;
    const a = AXES[i++];
    const garde = version === 'BLANC' && lisere ? lisere : '';   // la version blanche garde son contour
    return `<path d="${courbe(a.pts.map(([x, y]) => [DX + x * E, DY + y * E]))}"${fond}${garde}/>`;
  });
  s = s.replace(/<g transform="translate\([\d.]+,[\d.]+\) scale\([\d.]+\) (translate\([^)]*\))">/g, (tout, centre) => {
    if (j >= AXES.length) return tout;
    const a = AXES[j++];
    return `<g transform="translate(${f(DX + a.cx * E)},${f(DY + (a.cy + 4) * E)}) scale(${((a.picto * a.reduction * E) / a.echelle).toFixed(5)}) ${centre}">`;
  });
  if (i !== 4 || j !== 4) throw new Error(`${p} : ${i} formes et ${j} pictogrammes remplacés au lieu de 4`);
  writeFileSync(p, s);
}
console.log('Logo général : quatre formes et quatre pictogrammes replacés (trois versions)');
