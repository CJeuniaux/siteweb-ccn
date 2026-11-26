// Génère toute l'identité visuelle à partir des pictos validés par Charlotte
// (A-INTEGRER/logos-definitifs/validated/*_white.svg) : pastilles carrées à coins
// arrondis (picto blanc sur fond couleur), plus l'emblème = grille 2×2 des 4 axes.
// Usage : node scripts/identite.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'A-INTEGRER/logos-definitifs/validated';
const AXES_DIR = 'A-INTEGRER/logos-definitifs';
const DEST = 'src/identite';
mkdirSync(DEST, { recursive: true });

const ENCRE = '#0B203F';
const SIZE = 500, PAD = 46, RX = 92;

// Mapping service → couleur, picto source, nom de fichier AXE
const SERVICES = [
  { slug: 'le-rebond',       nom: 'LE-REBOND',       color: '#D4705C', picto: 'LR_white.svg',   w: 796,  h: 770  },
  { slug: 'chez-toit',       nom: 'CHEZ-TOIT',       color: '#5B8DB1', picto: 'CT_white.svg',   w: 504,  h: 804  },
  { slug: 'toudi-boudji',    nom: 'TOUDI-BOUDJI',    color: '#94B88D', picto: 'TB_white.svg',   w: 831,  h: 527  },
  { slug: 'parent-elle',     nom: 'PARENT-ELLE',     color: '#9A80B9', picto: 'PPE_white.svg',  w: 678,  h: 741  },
  { slug: 'promotion-sante', nom: 'PROMOTION-SANTE', color: '#F9C74F', picto: 'PDLS_white.svg', w: 886,  h: 855  },
];

// Les quatre axes du logo général (dans l'ordre 2×2 : haut-gauche, haut-droite, bas-gauche, bas-droite)
const GRILLE = ['le-rebond', 'chez-toit', 'toudi-boudji', 'parent-elle'];

function extractPathD(svgText) {
  const m = svgText.match(/<path[^>]*\sd="([^"]+)"/);
  if (!m) throw new Error('Aucun <path d="..."> trouvé');
  return m[1];
}

function pastilleSvg(fond, picto, s) {
  const inner = SIZE - 2 * PAD;
  const scale = inner / Math.max(s.w, s.h);
  const d = extractPathD(readFileSync(`${SRC}/${s.picto}`, 'utf8'));
  const tx = SIZE / 2, ty = SIZE / 2, dx = -s.w / 2, dy = -s.h / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${RX}" ry="${RX}" fill="${fond}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale.toFixed(5)}) translate(${dx} ${dy})"><path fill="${picto}" d="${d}"/></g>
</svg>
`;
}

// 1. Fichiers sources AXE-* (3 variantes × 5 services) : COULEURS / BLANC / NOIR
for (const s of SERVICES) {
  writeFileSync(`${AXES_DIR}/AXE-${s.nom}-COULEURS.svg`, pastilleSvg(s.color, '#FFFFFF', s));
  writeFileSync(`${AXES_DIR}/AXE-${s.nom}-BLANC.svg`,    pastilleSvg('#FFFFFF', ENCRE, s));
  writeFileSync(`${AXES_DIR}/AXE-${s.nom}-NOIR.svg`,     pastilleSvg(ENCRE, '#FFFFFF', s));
  console.log('AXE', s.nom);
}

// 2. Pastilles livrées au site (= variante COULEURS)
for (const s of SERVICES) {
  writeFileSync(`${DEST}/pastille-${s.slug}.svg`, pastilleSvg(s.color, '#FFFFFF', s));
  console.log('pastille', s.slug);
}

// 3. Emblème : grille 2×2 des 4 axes (Le Rebond, Chez Toît, Toudi Boudji, Parent'Elle).
// Promotion de la santé reste hors emblème (consigne planche). Dimensions totales 500×500
// avec une gouttière de 20px entre pastilles. Chaque pastille occupe 240×240.
function emblemeSvg(variante /* 'couleurs' | 'blanc' | 'noir' */) {
  const G = 20, E = (SIZE - G) / 2; // 240
  const cases = GRILLE.map((slug, i) => {
    const s = SERVICES.find(x => x.slug === slug);
    const x = (i % 2) * (E + G);
    const y = Math.floor(i / 2) * (E + G);
    const { fond, picto } = variante === 'couleurs' ? { fond: s.color, picto: '#FFFFFF' }
                          : variante === 'blanc'    ? { fond: '#FFFFFF', picto: ENCRE }
                          :                            { fond: ENCRE, picto: '#FFFFFF' };
    const inner = E - 2 * (PAD * E / SIZE);
    const scale = inner / Math.max(s.w, s.h);
    const d = extractPathD(readFileSync(`${SRC}/${s.picto}`, 'utf8'));
    const cx = x + E / 2, cy = y + E / 2, rx = RX * E / SIZE;
    return `  <rect x="${x}" y="${y}" width="${E}" height="${E}" rx="${rx}" ry="${rx}" fill="${fond}"/>
  <g transform="translate(${cx} ${cy}) scale(${scale.toFixed(5)}) translate(${-s.w/2} ${-s.h/2})"><path fill="${picto}" d="${d}"/></g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
${cases}
</svg>
`;
}

writeFileSync(`${DEST}/embleme.svg`,       emblemeSvg('couleurs'));
writeFileSync(`${DEST}/embleme-blanc.svg`, emblemeSvg('blanc'));
writeFileSync(`${DEST}/embleme-noir.svg`,  emblemeSvg('noir'));
console.log('embleme (3 variantes)');
