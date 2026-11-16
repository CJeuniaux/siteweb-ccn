// Pages et blocs : chaque page est une suite de blocs (sections) dont la mise en page est dans le code
// et le contenu ici. Tout le contenu d'un bloc est modifiable, champ par champ.
import { useEffect, useState } from 'preact/hooks';
import type { Ligne } from './donnees';
import { TYPES_BLOCS, COULEURS } from './rubriques';
import { EditeurObjet, useCtx, estAdmin, videDe } from './champs';
import { Etat, Versions } from './rubrique';

export function ListePages({ derniere }: { derniere: string | null }) {
  const { source, services } = useCtx();
  const [pages, setPages] = useState<Ligne[] | null>(null);
  const [sections, setSections] = useState<Ligne[]>([]);
  useEffect(() => { source.lister('pages').then(setPages); source.lister('sections', { ordre: 'page' }).then(setSections); }, []);
  const modifiees = (adresse: string) => sections.some((s) => s.page === adresse && derniere && s.modifie_le > derniere);
  const nb = (adresse: string) => sections.filter((s) => s.page === adresse).length;
  return (
    <section>
      <header class="entete-ecran"><div><h1>Pages</h1><p class="intro">Choisissez une page pour modifier ses blocs : textes, photos, boutons, ordre.</p></div></header>
      {!pages ? <p class="chargement">Chargement…</p> : <>
        <h2 class="h-liste">Pages du site</h2>
        <ul class="liste-fiches">
          {[...pages].sort((a, b) => a.adresse.localeCompare(b.adresse)).map((p) => (
            <li><a href={`#/pages/${encodeURIComponent(p.adresse)}`}>
              <span class="fiche-titre">{p.titre || (p.adresse === '/' ? 'Accueil' : p.adresse)}</span><span class="fiche-sous">{p.adresse} · {nb(p.adresse)} blocs</span>
              {modifiees(p.adresse) && <span class="pastille">À publier</span>}<Etat publie={p.publie} />
            </a></li>
          ))}
        </ul>
        <h2 class="h-liste">Pages des services</h2>
        <ul class="liste-fiches">
          {services.map((s) => (
            <li><a href={`#/pages/${encodeURIComponent('/services/' + s.slug)}`}>
              <span class="fiche-titre">{s.nom}</span><span class="fiche-sous">/services/{s.slug} · {nb('/services/' + s.slug)} blocs</span>
              {modifiees('/services/' + s.slug) && <span class="pastille">À publier</span>}<Etat publie={s.publie} />
            </a></li>
          ))}
        </ul>
      </>}
    </section>
  );
}

export function FichePage({ adresse, derniere }: { adresse: string; derniere: string | null }) {
  const { source, profil, services } = useCtx();
  const admin = estAdmin(profil);
  const service = services.find((s) => '/services/' + s.slug === adresse);
  const [page, setPage] = useState<Ligne | null>(null);
  const [blocs, setBlocs] = useState<Ligne[] | null>(null);
  const [modeles, setModeles] = useState<Ligne[]>([]);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const charger = async () => {
    if (!service) setPage((await source.lister('pages', { egal: { adresse }, ordre: '' }))[0] ?? null);
    setBlocs(await source.lister('sections', { egal: { page: adresse } }));
  };
  useEffect(() => { charger(); source.lister('sections', { ordre: 'type' }).then(setModeles); }, [adresse]);
  const dire = (type: 'ok' | 'erreur', texte: string) => setMessage({ type, texte });

  const enregistrerPage = async () => {
    try { const r = await source.modifier('pages', page!.id, page!); setPage(r); dire('ok', 'Page enregistrée.'); } catch (e: any) { dire('erreur', e.message); }
  };
  const deplacer = async (i: number, d: number) => {
    const l = [...blocs!]; [l[i], l[i + d]] = [l[i + d], l[i]];
    const renum = l.map((b, k) => ({ ...b, ordre: k + 1 }));
    setBlocs(renum);
    try { for (const b of renum.filter((b, k) => blocs![k]?.id !== b.id || blocs![k]?.ordre !== b.ordre)) await source.modifier('sections', b.id, { ordre: b.ordre }); dire('ok', 'Ordre enregistré.'); }
    catch (e: any) { dire('erreur', e.message); charger(); }
  };
  const ajouter = async (type: string) => {
    const modele = modeles.find((m) => m.type === type);
    try {
      const n = await source.creer('sections', { page: adresse, type, contenu: modele ? videDe(modele.contenu) : {}, ordre: (blocs?.length ?? 0) + 1, publie: false });
      setBlocs([...(blocs ?? []), n]); dire('ok', `Bloc « ${TYPES_BLOCS[type] ?? type} » ajouté en brouillon, en bas de la page.`);
    } catch (e: any) { dire('erreur', e.message); }
  };
  const nomPage = service?.nom || page?.titre || (adresse === '/' ? 'Accueil' : adresse);
  const types = [...new Set(modeles.map((m) => m.type))].sort((a, b) => (TYPES_BLOCS[a] ?? a).localeCompare(TYPES_BLOCS[b] ?? b));
  return (
    <section>
      <p class="ariane"><a href="#/pages">Pages</a> › {nomPage}</p>
      <header class="entete-ecran">
        <div><h1>{nomPage}</h1><p class="intro">{adresse}{service && <> · Le nom, la couleur, l’accroche et la photo d’en-tête se modifient dans <a href={`#/services/${service.id}`}>Services</a>.</>}</p></div>
      </header>
      {page && (
        <details class="bloc-admin" open={false}>
          <summary><b>Réglages de la page</b> : titre, description pour les moteurs de recherche, couleur</summary>
          <fieldset class="formulaire-fiche">
            <div class="champ"><label for="p-titre">Titre (onglet du navigateur)</label><input id="p-titre" value={page.titre} onInput={(e) => setPage({ ...page, titre: (e.target as HTMLInputElement).value })} /></div>
            <div class="champ"><label for="p-desc">Description pour les moteurs de recherche</label><textarea id="p-desc" rows={3} value={page.description} onInput={(e) => setPage({ ...page, description: (e.target as HTMLTextAreaElement).value })} /><small class="aide">{page.description.length} caractères (idéal : environ 150).</small></div>
            <div class="champ demi"><label for="p-theme">Couleur</label><select id="p-theme" value={page.theme} onChange={(e) => setPage({ ...page, theme: (e.target as HTMLSelectElement).value })}>{COULEURS.map(([v, l]) => <option value={v}>{l}</option>)}</select></div>
          </fieldset>
          <div class="barre-actions"><button class="btn plein" onClick={enregistrerPage}>Enregistrer la page</button></div>
        </details>
      )}
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
      {!blocs ? <p class="chargement">Chargement…</p> : (
        <ol class="liste-blocs">
          {blocs.map((b, i) => (
            <li key={b.id}><Bloc bloc={b} derniere={derniere} premier={i === 0} dernier={i === blocs.length - 1} onDeplacer={(d) => deplacer(i, d)}
              onChange={(n) => setBlocs(blocs.map((x) => (x.id === b.id ? n : x)))} onSupprime={() => setBlocs(blocs.filter((x) => x.id !== b.id))} admin={admin} /></li>
          ))}
        </ol>
      )}
      <div class="ajout-bloc">
        <label for="nouveau-bloc">Ajouter un bloc</label>
        <select id="nouveau-bloc" onChange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v) { ajouter(v); (e.target as HTMLSelectElement).value = ''; } }}>
          <option value="">— Choisir un type de bloc —</option>
          {types.map((t) => <option value={t}>{TYPES_BLOCS[t] ?? t}</option>)}
        </select>
      </div>
    </section>
  );
}

function resume(b: Ligne): string {
  const c = b.contenu ?? {};
  return String(c.titre ?? c.sur ?? c.etiquette ?? c.formulaire ?? c.service ?? '').replace(/\n/g, ' ').slice(0, 80);
}

function Bloc({ bloc, derniere, premier, dernier, onDeplacer, onChange, onSupprime, admin }: {
  bloc: Ligne; derniere: string | null; premier: boolean; dernier: boolean; admin: boolean;
  onDeplacer: (d: number) => void; onChange: (b: Ligne) => void; onSupprime: () => void;
}) {
  const { source } = useCtx();
  const [ouvert, setOuvert] = useState(false);
  const [contenu, setContenu] = useState<Ligne>(bloc.contenu ?? {});
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const modifie = JSON.stringify(contenu) !== JSON.stringify(bloc.contenu ?? {});
  const enregistrer = async (publie?: boolean) => {
    try {
      const n = await source.modifier('sections', bloc.id, { ...bloc, contenu, ...(publie === undefined ? {} : { publie }) });
      onChange(n); setContenu(n.contenu ?? {}); setMessage({ type: 'ok', texte: publie === false ? 'Bloc dépublié.' : 'Bloc enregistré.' });
    } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  const supprimer = async () => {
    if (!confirm(`Supprimer définitivement ce bloc « ${TYPES_BLOCS[bloc.type] ?? bloc.type} » ? Cette action ne peut pas être annulée.`)) return;
    try { await source.supprimer('sections', bloc.id); onSupprime(); } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  return (
    <div class={`bloc-admin ${bloc.publie ? '' : 'bloc-brouillon'}`}>
      <div class="bloc-entete">
        <button type="button" class="bloc-ouvrir" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
          <span class="bloc-type">{TYPES_BLOCS[bloc.type] ?? bloc.type}</span><span class="bloc-resume">{resume(bloc)}</span>
        </button>
        {bloc.contenu?.a_valider && <span class="pastille">À valider</span>}
        <Etat publie={bloc.publie} modifie={!!derniere && bloc.publie && bloc.modifie_le > derniere} />
        <button type="button" class="mini" disabled={premier} onClick={() => onDeplacer(-1)} aria-label="Monter le bloc">↑</button>
        <button type="button" class="mini" disabled={dernier} onClick={() => onDeplacer(1)} aria-label="Descendre le bloc">↓</button>
      </div>
      {ouvert && (
        <div class="bloc-corps">
          {Object.keys(contenu).length === 0 ? <p class="aide">Ce bloc affiche des données gérées ailleurs (rubriques Données) ; il n’a pas de texte propre.</p>
            : <EditeurObjet valeur={contenu} onChange={setContenu} />}
          <div class="barre-actions">
            <button class="btn plein" onClick={() => enregistrer()}>Enregistrer le bloc</button>
            {admin && !bloc.publie && <button class="btn contour" onClick={() => enregistrer(true)}>Enregistrer et publier</button>}
            {bloc.publie && <button class="btn contour" onClick={() => enregistrer(false)}>Dépublier</button>}
            {modifie && <span class="non-enregistre">Modifications non enregistrées</span>}
            {admin && <button class="btn danger" onClick={supprimer}>Supprimer</button>}
          </div>
          {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
          <Versions table="sections" id={bloc.id} onReprendre={(d) => setContenu(d.contenu ?? {})} />
        </div>
      )}
    </div>
  );
}
