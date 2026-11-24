// Identité graphique définitive (23/11/2026) : les fichiers fournis par Charlotte (A-INTEGRER/logos-definitifs),
// préparés par scripts/identite.mjs dans src/identite/. Ils sont affichés tels quels ; seules les couleurs sont
// reliées aux jetons du site (commun.css), qui portent exactement les mêmes valeurs : une seule palette à régler.
import embleme from '../identite/embleme.svg?raw';
import emblemeBlanc from '../identite/embleme-blanc.svg?raw';
import rebond from '../identite/pastille-le-rebond.svg?raw';
import chezToit from '../identite/pastille-chez-toit.svg?raw';
import parentElle from '../identite/pastille-parent-elle.svg?raw';
import toudi from '../identite/pastille-toudi-boudji.svg?raw';
import sante from '../identite/pastille-promotion-sante.svg?raw';

// Couleurs écrites dans les fichiers → jetons du site
const JETONS: Record<string, string> = {
  '#D4705C': '--rouge', '#5B8DB1': '--bleu', '#F9C74F': '--jaune', '#94B88D': '--vert', '#9A80B9': '--mauve',
};

/** Prépare un SVG fourni pour l'afficher dans la page : classe, accessibilité, couleurs reliées aux jetons. */
function enLigne(svg: string, classe: string, titre?: string): string {
  let s = svg.trim().replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const reste = attrs.replace(/s(width|height)="[^"]*"/g, '');
    const a11y = titre ? ` role="img" aria-label="${titre.replace(/"/g, '&quot;')}"` : ' aria-hidden="true"';
    return `<svg${reste} class="${classe}"${a11y} focusable="false">`;
  });
  for (const [hex, jeton] of Object.entries(JETONS)) {
    s = s.split(`fill="${hex}"`).join(`style="fill:var(${jeton})"`);
  }
  return s;
}

const PASTILLES: Record<string, string> = {
  'le-rebond': rebond, 'chez-toit': chezToit, 'parent-elle': parentElle, 'toudi-boudji': toudi, 'promotion-sante': sante,
};

/** Pastille organique d'un service (forme colorée + pictogramme blanc), ou undefined si le service n'en a pas. */
export const pastille = (service: string, classe = 'picto-service', titre?: string): string | undefined =>
  PASTILLES[service] ? enLigne(PASTILLES[service], classe, titre) : undefined;

/** Emblème du logo général : les quatre formes organiques (Le Rebond, Chez Toît, Toudi Boudji, Parent'Elle).
 *  variante : 'couleurs' (défaut) ou 'blanc' (formes blanches, pictogrammes bleu marine, pour le pied de page). */
export const emblemeLogo = (classe = 'logo-embleme', variante: 'couleurs' | 'blanc' = 'couleurs'): string =>
  enLigne(variante === 'blanc' ? emblemeBlanc : embleme, classe);
