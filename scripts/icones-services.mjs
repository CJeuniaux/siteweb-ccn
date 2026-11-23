// Prépare les cinq icônes de service fournies par Charlotte (A-INTEGRER/icones-services/*.svg, tracés VTracer)
// pour le site : cadrage serré sur le dessin, couleur reliée au thème du service (currentColor), blancs
// intérieurs remplacés par la couleur de fond de la page. Aucun tracé n'est modifié.
// Usage : node scripts/icones-services.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FICHIERS = { 'le-rebond': 'LE-REBOND', 'chez-toit': 'CHEZ-TOIT', 'parent-elle': 'PARENT-ELLE', 'toudi-boudji': 'TOUDI-BOUDJI', 'promotion-sante': 'PROMOTION-SANTE' };
mkdirSync('src/identite', { recursive: true });
const clair = (hex) => { const n = parseInt(hex.slice(1), 16); return (n >> 16) > 235 && ((n >> 8) & 255) > 235 && (n & 255) > 225; };
for (const [slug, nom] of Object.entries(FICHIERS)) {
  const src = `A-INTEGRER/icones-services/${nom}.svg`;
  const svg = readFileSync(src, 'utf8');
  const chemins = [...svg.matchAll(/<path d="([^"]+)" fill="(#[0-9A-Fa-f]{6})" transform="([^"]+)"\/>/g)].map((m) => ({ d: m[1], fill: m[2], transform: m[3] }));
  const utiles = chemins.filter((c) => c.d.length > 500);   // les éclats de tracé (quelques pixels) sont écartés
  const couleurs = [...new Set(utiles.filter((c) => !clair(c.fill)).map((c) => c.fill))];
  // cadrage : on mesure le dessin coloré sur un rendu, puis on ajoute une petite marge
  const propre = `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254">${utiles.filter((c) => !clair(c.fill)).map((c) => `<path d="${c.d}" fill="#000" transform="${c.transform}"/>`).join('')}</svg>`;
  const { info } = await sharp(Buffer.from(propre)).trim().toBuffer({ resolveWithObject: true });
  const m = 14, x = -info.trimOffsetLeft - m, y = -info.trimOffsetTop - m, w = info.width + 2 * m, h = info.height + 2 * m;
  const corps = utiles.map((c) => `<path d="${c.d}" style="fill:${clair(c.fill) ? 'var(--fond,#F9F7F3)' : 'currentColor'}" transform="${c.transform}"/>`).join('');
  writeFileSync(`src/identite/icone-${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">${corps}</svg>\n`);
  console.log(slug, `${chemins.length} tracés (${utiles.length} gardés)`, 'couleurs', couleurs.join(' '), 'cadre', w, h);
}
