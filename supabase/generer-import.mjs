// Fabrique un script d'import des contenus (donnees/initiales/*.json), à coller dans l'éditeur SQL de Supabase.
// - node supabase/generer-import.mjs              → import/0002_donnees_initiales.sql : ajoute les lignes absentes, n'écrase rien
// - node supabase/generer-import.mjs --remplacer  → import/0008_synchronisation.sql : remplace chaque ligne par la version
//   des fichiers. À n'utiliser qu'avant que l'administration serve vraiment : il écrase ce qui a été modifié dans l'admin.
//   Les lignes présentes en base mais absentes des fichiers ne sont jamais supprimées : elles sont listées en fin de script.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

// Ordre d'import (le menu avant ses sous-entrées : géré par l'ordre des lignes du fichier)
const TABLES = ['medias', 'reglages', 'menu', 'numeros_utiles', 'services', 'sections', 'chiffres', 'graphiques', 'temoignages',
  'pages', 'equipe', 'galerie', 'reperes', 'valeurs', 'partenaires', 'projet', 'articles', 'lieux_aide', 'formulaires_champs'];

const remplacer = process.argv.includes('--remplacer');
const texte = (v) => `'${String(v).replace(/'/g, "''")}'`;
// Colonnes de type date : une valeur vide devient « null »
const DATES = ['date_publication', 'date_verification'];
const valeur = (v, col = '') => {
  if (v === null || v === undefined || (DATES.includes(col) && v === '')) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (typeof v === 'object') return `${texte(JSON.stringify(v))}::jsonb`;
  return texte(v);
};

const fichier = remplacer ? 'supabase/import/0008_synchronisation.sql' : 'supabase/import/0002_donnees_initiales.sql';
const date = new Date().toISOString().slice(0, 10);
let sortie = remplacer
  ? `-- Synchronisation (générée le ${date} depuis donnees/initiales/) : chaque ligne est remplacée par la version des fichiers.\n`
    + `-- À exécuter après les migrations 0006 et 0007. Aucune ligne n'est supprimée (contrôle en fin de script).\nbegin;\n`
  : `-- Import des contenus existants (généré le ${date} depuis donnees/initiales/)\n`
    + `-- À exécuter après 0001_schema.sql. Relançable : les lignes déjà présentes sont ignorées.\nbegin;\n`;
const absentes = [];
let total = 0;
for (const t of TABLES) {
  const f = `donnees/initiales/${t}.json`;
  if (!existsSync(f)) continue;
  const lignes = JSON.parse(readFileSync(f, 'utf8'));
  if (!lignes.length) continue;
  sortie += `\n-- ${t} (${lignes.length})\n`;
  for (const l of lignes) {
    const cols = Object.keys(l);
    const conflit = remplacer ? `do update set ${cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ')}` : 'do nothing';
    sortie += `insert into public.${t} (${cols.join(', ')}) values (${cols.map((c) => valeur(l[c], c)).join(', ')}) on conflict (id) ${conflit};\n`;
  }
  absentes.push(`select '${t}' as table_nom, id from public.${t} where id not in (${lignes.map((l) => texte(l.id)).join(', ')})`);
  total += lignes.length;
}
sortie += '\ncommit;\n';
if (remplacer) sortie += `\n-- Contrôle : lignes présentes en base mais absentes des fichiers (à examiner ; rien n'est supprimé)\n${absentes.join('\nunion all ')};\n`;
mkdirSync('supabase/import', { recursive: true });
writeFileSync(fichier, sortie);
console.log(`${total} lignes écrites dans ${fichier}`);
