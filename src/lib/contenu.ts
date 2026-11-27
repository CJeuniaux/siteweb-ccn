// Accès aux contenus du CMS.
// - Si PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY sont définies (saisies dans Vercel),
//   les contenus publiés sont lus dans Supabase au moment de la fabrication du site.
// - Sinon, on lit les données initiales de donnees/initiales/ (mêmes tables, mêmes champs),
//   qui servent aussi à l'import dans Supabase.
// Aucun texte de contenu n'est écrit dans le code des pages.
import { createClient } from '@supabase/supabase-js';

type Ligne = Record<string, any> & { id: string; publie?: boolean; ordre?: number };

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const cle = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const supabase = url && cle ? createClient(url, cle) : null;

const initiales = import.meta.glob('../../donnees/initiales/*.json', { eager: true, import: 'default' }) as Record<string, Ligne[]>;

const cache = new Map<string, Promise<Ligne[]>>();

async function charger(table: string): Promise<Ligne[]> {
  if (supabase) {
    // La sécurité de la base (RLS) ne renvoie de toute façon que les lignes publiées.
    const { data, error } = await supabase.from(table).select('*').eq('publie', true);
    if (error) throw new Error(`CMS : lecture de « ${table} » impossible (${error.message})`);
    return (data ?? []) as Ligne[];
  }
  return initiales[`../../donnees/initiales/${table}.json`] ?? [];
}

/** Lignes publiées d'une table, triées par ordre, filtrées éventuellement. */
export async function lire(table: string, filtre?: (l: Ligne) => boolean): Promise<Ligne[]> {
  if (!cache.has(table)) cache.set(table, charger(table));
  const lignes = await cache.get(table)!;
  return lignes
    .filter((l) => l.publie !== false && (!filtre || filtre(l)))
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export async function reglages(): Promise<Ligne> {
  const [r] = await lire('reglages');
  return r ?? ({ id: 'general' } as Ligne);
}

export async function menu(emplacement: string) {
  const tout = await lire('menu', (l) => l.emplacement === emplacement);
  const racines = tout.filter((l) => !l.parent);
  return racines.map((r) => ({ ...r, enfants: tout.filter((e) => e.parent === r.id) }));
}

// ---------------------------------------------------------------------------
// Médiathèque : les contenus désignent une fiche (« m-service-rebond »), pas une adresse.
// Avec Supabase, le fichier vient de l'espace de stockage « medias » et il est optimisé à la
// fabrication du site (format webp, taille adaptée) ; sans Supabase, la copie locale /img/ sert d'aperçu.
// ---------------------------------------------------------------------------
import { getImage } from 'astro:assets';

/**
 * type : « photo » (traitée noir et blanc, découpée par un masque pinceau, posée sur un aplat),
 *        « detoure » (fond transparent : posée sur l'aplat, sans masque),
 *        « composite » (anciens visuels où l'aplat est déjà dans l'image : affichés tels quels),
 *        « dessin » (logo, picto, document : jamais traité ni masqué).
 */
export type Image = { src: string; alt: string; largeur?: number; hauteur?: number; type?: string; srcOriginal?: string };
let resolues: Promise<Map<string, Image>> | null = null;

async function toutesLesImages(): Promise<Map<string, Image>> {
  const fiches = await lire('medias');
  const carte = new Map<string, Image>();
  for (const m of fiches) {
    // L'espace « medias » est public : son adresse suffit (aucune clé), dès que PUBLIC_SUPABASE_URL est connue.
    const srcBrut = url ? `${url}/storage/v1/object/public/medias/${encodeURI(m.fichier)}` : `/img/${m.fichier}`;
    let src = srcBrut;
    if (url && m.largeur && m.hauteur) {
      const svg = /\.svg$/i.test(m.fichier);
      const largeur = svg ? m.largeur : Math.min(m.largeur, 1400);
      const type = m.type_visuel ?? (svg ? 'dessin' : 'composite');
      const format = svg ? 'svg' : type === 'detoure' ? 'png' : 'webp';
      const opt = await getImage({ src, width: largeur, height: Math.round((m.hauteur * largeur) / m.largeur), format, quality: 80 });
      src = opt.src;
    }
    const type = m.type_visuel ?? (/\.svg$/i.test(m.fichier) ? 'dessin' : 'composite');
    carte.set(m.id, { src, alt: m.alt ?? '', largeur: m.largeur, hauteur: m.hauteur, type, srcOriginal: type === 'detoure' ? srcBrut : undefined });
  }
  return carte;
}

/** Résout une image du CMS : référence de la médiathèque, ou adresse directe (rétrocompatibilité). */
export async function image(ref?: string | null): Promise<Image | null> {
  if (!ref) return null;
  if (ref.startsWith('/') || /^https?:\/\//.test(ref)) {
    // Un chemin direct vers une image : on infère le type depuis l'extension.
    const type = /\.png$/i.test(ref) ? 'detoure' : undefined;
    return { src: ref, alt: '', type, srcOriginal: type === 'detoure' ? ref : undefined };
  }
  resolues ??= toutesLesImages();
  return (await resolues).get(ref) ?? null;
}

export const sectionsDe =(page: string) => lire('sections', (s) => s.page === page);
export const services = () => lire('services');

/** Couleurs de la DA, par thème (le CMS stocke le nom du thème, pas la couleur). */
export const COULEURS: Record<string, string> = {
  rouge: '#D4705C', bleu: '#5B8DB1', jaune: '#F9C74F', vert: '#94B88D', encre: '#0B203F', nuit: '#0B203F', mauve: '#0B203F',
};
