// Identité graphique du 23/11/2026 : les fichiers fournis par Charlotte (src/identite/, copies de A-INTEGRER/CCN_*.svg),
// affichés tels quels. Seule la couleur des pastilles est reliée aux jetons du site (commun.css), pour qu'il n'y ait
// qu'une palette à régler. Aucun tracé n'est redessiné ici.
import embleme from '../identite/embleme.svg?raw';
// Icônes de service : fichiers fournis le 23/11 (A-INTEGRER/icones-services), préparés par scripts/icones-services.mjs
import rebond from '../identite/icone-le-rebond.svg?raw';
import chezToit from '../identite/icone-chez-toit.svg?raw';
import parentElle from '../identite/icone-parent-elle.svg?raw';
import toudi from '../identite/icone-toudi-boudji.svg?raw';
import sante from '../identite/icone-promotion-sante.svg?raw';

// Couleurs écrites dans les fichiers → jetons du site
const JETONS: Record<string, string> = {
  '#D4705C': '--rouge', '#5B8DB1': '--bleu', '#EFC25E': '--jaune', '#86A873': '--vert', '#9A80B9': '--mauve',
};

/** Prépare un SVG fourni pour l'afficher dans la page : classe, accessibilité, couleurs reliées aux jetons. */
function enLigne(svg: string, classe: string, titre?: string): string {
  let s = svg.trim().replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const reste = attrs.replace(/\s(width|height)="[^"]*"/g, '');
    const a11y = titre ? ` role="img" aria-label="${titre.replace(/"/g, '&quot;')}"` : ' aria-hidden="true"';
    return `<svg${reste} class="${classe}"${a11y} focusable="false">`;
  });
  for (const [hex, jeton] of Object.entries(JETONS)) {
    s = s.split(`fill="${hex}"`).join(`style="fill:var(${jeton})"`).split(`stroke="${hex}"`).join(`style="stroke:var(${jeton})"`);
  }
  return s;
}

const PASTILLES: Record<string, string> = {
  'le-rebond': rebond, 'chez-toit': chezToit, 'parent-elle': parentElle, 'toudi-boudji': toudi, 'promotion-sante': sante,
};

/** Icône d'un service (dessin au trait dans la couleur du service), ou undefined si le service n'en a pas. */
export const pastille = (service: string, classe = 'picto-service', titre?: string): string | undefined =>
  PASTILLES[service] ? enLigne(PASTILLES[service], classe, titre) : undefined;

/** Emblème du logo général : les quatre pastilles en carré 2 × 2. */
export const emblemeLogo = (classe = 'logo-embleme'): string => enLigne(embleme, classe);
