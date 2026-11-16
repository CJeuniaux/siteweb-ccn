// Champs de saisie de l'administration. EditeurValeur affiche n'importe quel contenu (texte, liste, objet)
// en devinant le bon champ : c'est ce qui rend tous les blocs de page modifiables sans écran dédié.
import { createContext } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import type { Source, Ligne, Profil } from './donnees';
import { type Champ, COULEURS, LIBELLES, CLES_MEDIA, CLES_COULEUR } from './rubriques';

export interface Ctx { source: Source; profil: Profil; medias: Ligne[]; services: Ligne[]; menu: Ligne[]; rechargerMedias: () => Promise<void> }
export const Contexte = createContext<Ctx>(null as any);
export const useCtx = () => useContext(Contexte);
export const estAdmin = (p: Profil) => p.role === 'administration';

export const libelleDe = (cle: string) => LIBELLES[cle] ?? (cle.charAt(0).toUpperCase() + cle.slice(1)).replace(/_/g, ' ');
export const slugifier = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

/** Adresse d'aperçu d'une fiche de la médiathèque */
export function urlMedia(ctx: Ctx, ref: string): string {
  if (!ref) return '';
  if (/^(https?:)?\//.test(ref)) return ref;
  const m = ctx.medias.find((x) => x.id === ref);
  return m ? ctx.source.urlFichier(m.fichier) : '';
}

export function ChoixMedia({ valeur, onChange, id }: { valeur: string; onChange: (v: string) => void; id?: string }) {
  const ctx = useCtx();
  const url = urlMedia(ctx, valeur);
  return (
    <div class="choix-media">
      {url ? <img src={url} alt="" /> : <span class="vignette-vide" aria-hidden="true">Aucune</span>}
      <select id={id} value={valeur ?? ''} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
        <option value="">— Aucune image —</option>
        {ctx.medias.map((m) => <option value={m.id}>{m.alt || m.fichier} ({m.fichier})</option>)}
        {valeur && !ctx.medias.some((m) => m.id === valeur) && <option value={valeur}>{valeur}</option>}
      </select>
      <a class="lien-discret" href="#/medias">Ajouter une image</a>
    </div>
  );
}

/** Éditeur de texte riche minimal : produit du HTML simple (intertitres, gras, italique, liens, listes) */
function EditeurHtml({ valeur, onChange, id }: { valeur: string; onChange: (v: string) => void; id?: string }) {
  const zone = useRef<HTMLTextAreaElement>(null);
  const entourer = (avant: string, apres: string, defaut = '') => {
    const t = zone.current!; const a = t.selectionStart, b = t.selectionEnd;
    const choisi = t.value.slice(a, b) || defaut;
    onChange(t.value.slice(0, a) + avant + choisi + apres + t.value.slice(b));
    setTimeout(() => { t.focus(); t.setSelectionRange(a + avant.length, a + avant.length + choisi.length); });
  };
  const lien = () => { const u = prompt('Adresse du lien (https://…)'); if (u) entourer(`<a href="${u.replace(/"/g, '')}">`, '</a>', 'texte du lien'); };
  return (
    <div class="editeur-html">
      <div class="barre-outils" role="toolbar" aria-label="Mise en forme">
        <button type="button" onClick={() => entourer('<p>', '</p>')}>Paragraphe</button>
        <button type="button" onClick={() => entourer('<h2>', '</h2>')}>Intertitre</button>
        <button type="button" onClick={() => entourer('<strong>', '</strong>')}><b>Gras</b></button>
        <button type="button" onClick={() => entourer('<em>', '</em>')}><i>Italique</i></button>
        <button type="button" onClick={lien}>Lien</button>
        <button type="button" onClick={() => entourer('<ul>\n<li>', '</li>\n</ul>')}>Liste</button>
      </div>
      <textarea id={id} ref={zone} rows={14} value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />
      <details class="apercu"><summary>Aperçu</summary><div class="apercu-html" dangerouslySetInnerHTML={{ __html: (valeur ?? '').replace(/<script[\s\S]*?<\/script>/gi, '') }} /></details>
    </div>
  );
}

/** Un champ décrit dans rubriques.ts */
export function ChampSaisie({ champ, valeur, onChange, ligne }: { champ: Champ; valeur: any; onChange: (v: any) => void; ligne?: Ligne }) {
  const ctx = useCtx();
  const id = `ch-${champ.nom}`;
  const type = champ.type ?? typeDevine(champ.nom, valeur);
  const etiquette = <label for={id}>{champ.libelle ?? libelleDe(champ.nom)}{champ.obligatoire && <span class="requis" aria-hidden="true"> *</span>}</label>;
  const aide = champ.aide && <small class="aide">{champ.aide}</small>;
  let saisie;
  switch (type) {
    case 'lecture': return null;
    case 'booleen':
      return <div class={`champ case ${champ.largeur ?? ''}`}><label><input type="checkbox" checked={!!valeur} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} /> {champ.libelle ?? libelleDe(champ.nom)}</label>{aide}</div>;
    case 'texte_long': saisie = <textarea id={id} rows={4} value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />; break;
    case 'html': saisie = <EditeurHtml id={id} valeur={valeur} onChange={onChange} />; break;
    case 'nombre': saisie = <input id={id} type="number" step="any" value={valeur ?? ''} onInput={(e) => { const v = (e.target as HTMLInputElement).value; onChange(v === '' ? null : Number(v)); }} />; break;
    case 'date': saisie = <input id={id} type="date" value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLInputElement).value || null)} />; break;
    case 'lien': saisie = <input id={id} type="text" inputMode="url" placeholder="https://… ou /page" value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />; break;
    case 'media': saisie = <ChoixMedia id={id} valeur={valeur ?? ''} onChange={onChange} />; break;
    case 'couleur': saisie = <select id={id} value={valeur ?? ''} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}><option value="">—</option>{COULEURS.map(([v, l]) => <option value={v}>{l}</option>)}</select>; break;
    case 'service': saisie = <select id={id} value={valeur ?? ''} onChange={(e) => onChange((e.target as HTMLSelectElement).value || null)}><option value="">— Aucun —</option>{ctx.services.map((s) => <option value={s.slug}>{s.nom}</option>)}</select>; break;
    case 'menu_parent': saisie = <select id={id} value={valeur ?? ''} onChange={(e) => onChange((e.target as HTMLSelectElement).value || null)}><option value="">— Premier niveau —</option>{ctx.menu.filter((m) => !m.parent && m.id !== ligne?.id && m.emplacement === ligne?.emplacement).map((m) => <option value={m.id}>{m.libelle}</option>)}</select>; break;
    case 'choix': {
      const options = (champ.choix ?? []).map((c) => (Array.isArray(c) ? c : [c, c]));
      saisie = <select id={id} value={valeur ?? ''} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>{!options.some(([v]) => v === (valeur ?? '')) && <option value={valeur ?? ''}>{valeur || '—'}</option>}{options.map(([v, l]) => <option value={v}>{l}</option>)}</select>;
      break;
    }
    case 'liste_textes': case 'liste_objets': case 'contenu':
      return <fieldset class="champ groupe-champ"><legend>{champ.libelle ?? libelleDe(champ.nom)}</legend>{aide}<EditeurValeur cle={champ.nom} valeur={valeur ?? (type === 'contenu' ? {} : [])} onChange={onChange} modele={champ.sousChamps} /></fieldset>;
    default: saisie = <input id={id} type="text" value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />;
  }
  return <div class={`champ ${champ.largeur ?? ''}`}>{etiquette}{saisie}{aide}</div>;
}

export function typeDevine(cle: string, v: any): any {
  if (typeof v === 'boolean') return 'booleen';
  if (typeof v === 'number') return 'nombre';
  if (Array.isArray(v)) return v.some((x) => x && typeof x === 'object') ? 'liste_objets' : 'liste_textes';
  if (v && typeof v === 'object') return 'contenu';
  if (CLES_MEDIA.includes(cle)) return 'media';
  if (CLES_COULEUR.includes(cle)) return 'couleur';
  if (cle === 'service') return 'service';
  if (cle === 'lien' || cle.endsWith('_lien') || cle === 'site') return 'lien';
  if (cle === 'corps') return 'html';
  if (typeof v === 'string' && (v.length > 70 || v.includes('\n'))) return 'texte_long';
  return 'texte';
}

/** Valeur vide de même forme (pour ajouter un élément à une liste) */
export function videDe(v: any): any {
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, videDe(x)]));
  if (typeof v === 'boolean') return false;
  if (typeof v === 'number') return 0;
  return '';
}

/** Éditeur générique : texte, liste de textes, liste d'objets, objet imbriqué */
export function EditeurValeur({ cle, valeur, onChange, modele }: { cle: string; valeur: any; onChange: (v: any) => void; modele?: Champ[] }) {
  if (Array.isArray(valeur)) {
    const objets = valeur.some((x) => x && typeof x === 'object') || (modele && modele.length > 0);
    const deplacer = (i: number, d: number) => { const n = [...valeur]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
    const nouveau = objets ? (valeur[0] ? videDe(valeur[0]) : Object.fromEntries((modele ?? []).map((c) => [c.nom, '']))) : '';
    return (
      <div class="liste-editeur">
        {valeur.map((x, i) => (
          <div class="element-liste">
            <div class="element-contenu">
              {objets
                ? <EditeurObjet valeur={x} onChange={(v) => onChange(valeur.map((y, j) => (j === i ? v : y)))} modele={modele} />
                : <EditeurValeur cle={cle} valeur={x} onChange={(v) => onChange(valeur.map((y, j) => (j === i ? v : y)))} />}
            </div>
            <div class="element-actions">
              <button type="button" class="mini" disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label="Monter">↑</button>
              <button type="button" class="mini" disabled={i === valeur.length - 1} onClick={() => deplacer(i, 1)} aria-label="Descendre">↓</button>
              <button type="button" class="mini danger" onClick={() => onChange(valeur.filter((_, j) => j !== i))} aria-label="Retirer">×</button>
            </div>
          </div>
        ))}
        <button type="button" class="btn-ajout" onClick={() => onChange([...valeur, nouveau])}>+ Ajouter</button>
      </div>
    );
  }
  if (valeur && typeof valeur === 'object') return <EditeurObjet valeur={valeur} onChange={onChange} modele={modele} />;
  const type = typeDevine(cle, valeur);
  if (type === 'texte_long' || cle === 'paragraphes' || cle === 'texte') return <textarea rows={3} aria-label={libelleDe(cle)} value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />;
  if (type === 'couleur') return <select aria-label={libelleDe(cle)} value={valeur} onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>{COULEURS.map(([v, l]) => <option value={v}>{l}</option>)}</select>;
  return <input type="text" aria-label={libelleDe(cle)} value={valeur ?? ''} onInput={(e) => onChange((e.target as HTMLInputElement).value)} />;
}

export function EditeurObjet({ valeur, onChange, modele }: { valeur: Ligne; onChange: (v: Ligne) => void; modele?: Champ[] }) {
  const cles = [...new Set([...(modele ?? []).map((c) => c.nom), ...Object.keys(valeur ?? {})])];
  // Les notes internes passent en dernier, dans un encadré à part
  const internes = ['a_valider', 'note_interne'];
  const normales = cles.filter((k) => !internes.includes(k));
  const champ = (k: string) => modele?.find((c) => c.nom === k) ?? { nom: k };
  const maj = (k: string, v: any) => onChange({ ...valeur, [k]: v });
  return (
    <div class="objet-editeur">
      {normales.map((k) => <ChampSaisie champ={champ(k)} valeur={valeur?.[k]} onChange={(v) => maj(k, v)} />)}
      {cles.some((k) => internes.includes(k)) && (
        <div class="interne">
          <p class="interne-titre">Interne — jamais affiché sur le site</p>
          {internes.filter((k) => k in (valeur ?? {})).map((k) => <ChampSaisie champ={{ nom: k, type: k === 'a_valider' ? 'booleen' : 'texte_long' }} valeur={valeur[k]} onChange={(v) => maj(k, v)} />)}
        </div>
      )}
    </div>
  );
}
