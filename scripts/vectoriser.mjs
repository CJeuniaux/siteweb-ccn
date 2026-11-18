// Transforme les tracés dessinés par Charlotte (PNG, trait noir sur fond transparent, dossier A-INTEGRER)
// en lignes : on amincit le trait jusqu'à sa ligne centrale, puis on la suit d'un bout à l'autre.
// Résultat : src/lib/dessins.json — des points, que le site retrace en trait fin d'épaisseur constante
// à n'importe quelle taille (une image étirée, elle, verrait son trait épaissir).
// Usage : node scripts/vectoriser.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const NOMS = ['fil-accueil', 'relier', 'souligner', 'entourer', 'accentuer', 'orienter'];
const V8 = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

async function vectoriser(nom) {
  const { data, info } = await sharp(`A-INTEGRER/${nom}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const img = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) img[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : img[y * W + x]);

  // ——— Amincissement de Zhang-Suen : on ronge le trait par les bords jusqu'à un pixel de large ———
  let actifs = [];
  for (let i = 0; i < W * H; i++) if (img[i]) actifs.push(i);
  for (let change = true; change;) {
    change = false;
    for (const passe of [0, 1]) {
      const retirer = [];
      for (const i of actifs) {
        if (!img[i]) continue;
        const x = i % W, y = (i / W) | 0;
        const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
        const b = p.reduce((s, v) => s + v, 0);
        if (b < 2 || b > 6) continue;
        let a = 0;
        for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
        if (a !== 1) continue;
        if (passe === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
        retirer.push(i);
      }
      if (retirer.length) { change = true; for (const i of retirer) img[i] = 0; }
    }
    actifs = actifs.filter((i) => img[i]);
  }

  // ——— Suivi de la ligne ———
  const vu = new Uint8Array(W * H);
  const voisins = (i, libre = true) => {
    const x = i % W, y = (i / W) | 0, out = [];
    for (const [dx, dy] of V8) { const nx = x + dx, ny = y + dy; if (at(nx, ny)) { const j = ny * W + nx; if (!libre || !vu[j]) out.push(j); } }
    return out;
  };
  const xy = (i) => [i % W, (i / W) | 0];
  const dir = (a, b) => { const [ax, ay] = xy(a), [bx, by] = xy(b); const l = Math.hypot(bx - ax, by - ay) || 1; return [(bx - ax) / l, (by - ay) / l]; };

  function suivre(depart) {
    const chemin = [depart]; vu[depart] = 1;
    for (;;) {
      const ici = chemin[chemin.length - 1];
      const elan = chemin.length > 6 ? dir(chemin[Math.max(0, chemin.length - 14)], ici) : null;
      let cand = voisins(ici);
      let suite = -1;
      if (cand.length === 1) suite = cand[0];
      else if (cand.length > 1) {
        // À un croisement, on continue tout droit : on regarde où mène chaque branche
        let meilleur = -2;
        for (const c of cand) {
          const local = new Set([ici, c]); let q = c;
          for (let k = 0; k < 16; k++) { const n = voisins(q).filter((j) => !local.has(j)); if (!n.length) break; q = n[0]; local.add(q); }
          const d = dir(ici, q), s = elan ? d[0] * elan[0] + d[1] * elan[1] : 0;
          if (s > meilleur) { meilleur = s; suite = c; }
        }
        if (elan && meilleur < -0.25) suite = -1; // demi-tour net : le trait s'arrête là (pointe de flèche)
      }
      if (suite < 0 && elan) {
        // Le trait recroise un passage déjà suivi : on saute de l'autre côté, dans l'élan
        const [x, y] = xy(ici); let meilleur = 0.55;
        for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
          const nx = x + dx, ny = y + dy; if (!at(nx, ny)) continue;
          const j = ny * W + nx; if (vu[j]) continue;
          const l = Math.hypot(dx, dy); if (l < 2 || l > 10) continue;
          const s = (dx * elan[0] + dy * elan[1]) / l - l * 0.01;
          if (s > meilleur) { meilleur = s; suite = j; }
        }
      }
      if (suite < 0) break;
      vu[suite] = 1; chemin.push(suite);
    }
    return chemin;
  }

  const traits = [];
  const premier = nom === 'fil-accueil' ? (a, b) => xy(a)[1] - xy(b)[1] : (a, b) => xy(a)[0] - xy(b)[0];
  for (;;) {
    const reste = actifs.filter((i) => !vu[i]);
    if (reste.length < 30) break;
    const bouts = reste.filter((i) => voisins(i, false).length === 1);
    const depart = (bouts.length ? bouts : reste).sort(premier)[0];
    const c = suivre(depart);
    if (c.length >= 30) traits.push(c.map(xy));
    else c.forEach((i) => { vu[i] = 1; });
  }

  // Le grand fil est un seul geste : si le suivi s'est interrompu à un croisement, on recoud les
  // morceaux dont les extrémités se touchent (jamais pour une flèche, dont la pointe est faite de traits distincts).
  if (nom === 'fil-accueil') {
    while (traits.length > 1) {
      const a = traits[0], fin = a[a.length - 1];
      let k = -1, inverse = false, best = 40;
      for (let i = 1; i < traits.length; i++) {
        const t = traits[i], d0 = Math.hypot(t[0][0] - fin[0], t[0][1] - fin[1]), d1 = Math.hypot(t[t.length - 1][0] - fin[0], t[t.length - 1][1] - fin[1]);
        if (d0 < best) { best = d0; k = i; inverse = false; }
        if (d1 < best) { best = d1; k = i; inverse = true; }
      }
      if (k < 0) break;
      const t = traits.splice(k, 1)[0];
      traits[0] = a.concat(inverse ? t.reverse() : t);
    }
  }

  // ——— Lissage léger (les pixels font des marches) et allègement ———
  const tous = traits.flat();
  const minX = Math.min(...tous.map((p) => p[0])), minY = Math.min(...tous.map((p) => p[1]));
  const maxX = Math.max(...tous.map((p) => p[0])), maxY = Math.max(...tous.map((p) => p[1]));
  const r = (v) => Math.round(v * 10) / 10;
  const propres = traits.map((t) => {
    const out = [];
    const pas = 6;
    for (let i = 0; i < t.length; i += pas) {
      let sx = 0, sy = 0, n = 0;
      for (let k = Math.max(0, i - 4); k <= Math.min(t.length - 1, i + 4); k++) { sx += t[k][0]; sy += t[k][1]; n++; }
      out.push([r(sx / n - minX), r(sy / n - minY)]);
    }
    const fin = t[t.length - 1];
    out.push([r(fin[0] - minX), r(fin[1] - minY)]);
    return out;
  });
  console.log(nom.padEnd(12), `${maxX - minX}×${maxY - minY}`, 'traits :', propres.map((t) => t.length).join(' + '), 'points');
  return { largeur: maxX - minX, hauteur: maxY - minY, traits: propres };
}

const dessins = {};
for (const nom of NOMS) dessins[nom] = await vectoriser(nom);
writeFileSync('src/lib/dessins.json', JSON.stringify(dessins));
console.log('→ src/lib/dessins.json');
