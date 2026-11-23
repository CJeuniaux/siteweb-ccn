// Fabrique les icônes du site (favicon, écran d'accueil des téléphones) à partir de l'emblème fourni le 23/11/2026 (A-INTEGRER/CCN_embleme_4_services.svg)
// (les quatre pastilles organiques, sans texte). Usage : node scripts/icones.mjs
import sharp from 'sharp';
import { copyFileSync, writeFileSync } from 'node:fs';

const source = 'A-INTEGRER/CCN_embleme_4_services.svg';
const creme = '#F9F7F3';

// 1. Icône vectorielle (navigateurs récents)
copyFileSync(source, 'public/favicon.svg');

// 2. Icônes carrées : le logo centré, avec une petite marge
async function carre(taille, marge, fond) {
  const interieur = Math.round(taille * (1 - 2 * marge));
  const logo = await sharp(source, { density: 600 }).resize(interieur, interieur, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: taille, height: taille, channels: 4, background: fond ?? { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
}

// 3. favicon.ico (16, 32, 48 px), au format ICO contenant des images PNG
const tailles = [16, 32, 48];
const images = await Promise.all(tailles.map((t) => carre(t, 0.02)));
const entete = Buffer.alloc(6); entete.writeUInt16LE(0, 0); entete.writeUInt16LE(1, 2); entete.writeUInt16LE(images.length, 4);
let decalage = 6 + 16 * images.length;
const repertoire = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(tailles[i], 0); e.writeUInt8(tailles[i], 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(img.length, 8); e.writeUInt32LE(decalage, 12);
  decalage += img.length; return e;
});
writeFileSync('public/favicon.ico', Buffer.concat([entete, ...repertoire, ...images]));

// 4. Écran d'accueil des téléphones (fond crème : iOS n'aime pas la transparence) et icônes d'application
writeFileSync('public/apple-touch-icon.png', await carre(180, 0.1, creme));
writeFileSync('public/icone-192.png', await carre(192, 0.1, creme));
writeFileSync('public/icone-512.png', await carre(512, 0.1, creme));
console.log('Icônes fabriquées : favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180), icone-192.png, icone-512.png');
