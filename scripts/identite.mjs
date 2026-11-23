// Prépare l'identité définitive pour le site à partir des fichiers fournis par Charlotte
// (A-INTEGRER/logos-definitifs) : l'emblème seul (logo général sans le texte, cadré serré) dans ses trois
// versions, et les cinq pastilles de service. Aucun tracé n'est modifié. Usage : node scripts/identite.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const SRC = 'A-INTEGRER/logos-definitifs', DEST = 'src/identite';
mkdirSync(DEST, { recursive: true });

// 1. Emblème : tout le logo général sauf le bloc de texte (le nom est écrit par le site, dans sa police)
for (const [version, nom] of [['COULEURS', 'embleme'], ['BLANC', 'embleme-blanc'], ['NOIR', 'embleme-noir']]) {
  const svg = readFileSync(`${SRC}/LOGO-GENERAL-${version}.svg`, 'utf8');
  const debut = svg.indexOf('>', svg.indexOf('<svg')) + 1;
  const texte = svg.indexOf('<g font-family');
  const fin = svg.indexOf('</g>', texte) + 4;
  if (texte < 0) throw new Error(`bloc de texte introuvable dans ${version}`);
  let corps = (svg.slice(debut, texte) + svg.slice(fin, svg.lastIndexOf('</svg>'))).trim();
  // un éventuel filet de séparation resté après le texte n'appartient pas à l'emblème
  corps = corps.replace(/<(line|rect)[^>]*\/>/g, '');
  const mesure = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1550 550" width="1550" height="550">${corps.replace(/fill="#(FFFFFF|ffffff)"/g, 'fill="#000"').replace(/stroke="#(FFFFFF|ffffff)"/g, 'stroke="#000"')}</svg>`;
  const { info } = await sharp(Buffer.from(mesure)).trim().toBuffer({ resolveWithObject: true });
  const m = 4, x = -info.trimOffsetLeft - m, y = -info.trimOffsetTop - m, w = info.width + 2 * m, h = info.height + 2 * m;
  writeFileSync(`${DEST}/${nom}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">${corps}</svg>\n`);
  console.log(nom, 'cadre', x, y, w, h);
}

// 2. Pastilles des services (version couleurs), telles quelles
for (const [slug, f] of Object.entries({ 'le-rebond': 'LE-REBOND', 'chez-toit': 'CHEZ-TOIT', 'parent-elle': 'PARENT-ELLE', 'toudi-boudji': 'TOUDI-BOUDJI', 'promotion-sante': 'PROMOTION-SANTE' })) {
  copyFileSync(`${SRC}/AXE-${f}-COULEURS.svg`, `${DEST}/pastille-${slug}.svg`);
  console.log('pastille', slug);
}
