// Écrans génériques d'une rubrique : liste des contenus, puis fiche de modification.
// Droits : la rédaction crée, modifie et dépublie ; l'administration publie et supprime (la base l'impose aussi).
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Ligne } from './donnees';
import type { Rubrique, Champ } from './rubriques';
import { ChampSaisie, useCtx, estAdmin, slugifier, urlMedia, typeDevine } from './champs';
import { CarteLieu } from './carte';

export function Etat({ publie, modifie }: { publie?: boolean; modifie?: boolean }) {
  return <span class={`etat ${publie ? 'publie' : 'brouillon'}`}>{publie ? (modifie ? 'Publié · modifié' : 'Publié') : 'Brouillon'}</span>;
}

export function ListeRubrique({ r, derniere }: { r: Rubrique; derniere: string | null }) {
  const { source, profil } = useCtx();
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtres, setFiltres] = useState<Record<string, string>>({});
  const lectureSeule = r.admin && !estAdmin(profil);
  useEffect(() => { setLignes(null); source.lister(r.table).then(setLignes).catch((e) => setErreur(e.message)); }, [r.cle]);
  const visibles = useMemo(() => (lignes ?? []).filter((l) =>
    (!recherche || JSON.stringify(l).toLowerCase().includes(recherche.toLowerCase()))
    && Object.entries(filtres).every(([k, v]) => !v || String(l[k] ?? '') === v)), [lignes, recherche, filtres]);
  if (r.unique) { location.hash = `#/${r.cle}/${r.unique}`; return null; }
  return (
    <section>
      <header class="entete-ecran">
        <div><h1>{r.titre}</h1>{r.description && <p class="intro">{r.description}</p>}</div>
        {!lectureSeule && <a class="btn plein" href={`#/${r.cle}/nouveau`}>+ Ajouter</a>}
      </header>
      {lectureSeule && <p class="avis">Rubrique réservée à l’administration : vous pouvez la consulter, pas la modifier.</p>}
      <div class="outils-liste">
        <input type="search" placeholder="Rechercher…" aria-label="Rechercher" value={recherche} onInput={(e) => setRecherche((e.target as HTMLInputElement).value)} />
        {r.filtres?.map((f) => (
          <select aria-label={f.libelle} value={filtres[f.champ] ?? ''} onChange={(e) => setFiltres({ ...filtres, [f.champ]: (e.target as HTMLSelectElement).value })}>
            <option value="">{f.libelle} : tous</option>
            {[...new Set((lignes ?? []).map((l) => String(l[f.champ] ?? '')).filter(Boolean))].sort().map((v) => <option value={v}>{v}</option>)}
          </select>
        ))}
      </div>
      {erreur && <p class="erreur" role="alert">{erreur}</p>}
      {!lignes && !erreur && <p class="chargement">Chargement…</p>}
      {lignes && (
        <ul class="liste-fiches">
          {visibles.map((l) => (
            <li><a href={`#/${r.cle}/${encodeURIComponent(l.id)}`}>
              <span class="fiche-titre">{String(l[r.champTitre] ?? '') || <em>(sans titre)</em>}</span>
              {r.champSousTitre && <span class="fiche-sous">{String(l[r.champSousTitre] ?? '').slice(0, 90)}</span>}
              {r.table === 'lieux_aide' && l.statut_verification === 'a_verifier' && <span class="pastille">À vérifier</span>}
              <Etat publie={l.publie} modifie={!!derniere && l.publie && l.modifie_le > derniere} />
            </a></li>
          ))}
          {visibles.length === 0 && <li class="vide">Aucun contenu.</li>}
        </ul>
      )}
    </section>
  );
}

/** Fiche de modification d'un contenu (toutes rubriques) */
export function FicheRubrique({ r, id }: { r: Rubrique; id: string }) {
  const { source, profil } = useCtx();
  const nouveau = id === 'nouveau';
  const [ligne, setLigne] = useState<Ligne | null>(nouveau ? { publie: false, ordre: 0 } : null);
  const [origine, setOrigine] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [encours, setEncours] = useState(false);
  const admin = estAdmin(profil);
  const lectureSeule = r.admin && !admin;
  useEffect(() => {
    if (nouveau) { setOrigine(JSON.stringify({ publie: false, ordre: 0 })); return; }
    source.lister(r.table, { egal: { id }, ordre: '' }).then((l) => { if (!l[0]) { setMessage({ type: 'erreur', texte: 'Contenu introuvable.' }); return; } setLigne(l[0]); setOrigine(JSON.stringify(l[0])); })
      .catch((e) => setMessage({ type: 'erreur', texte: e.message }));
  }, [r.cle, id]);
  const modifie = ligne && JSON.stringify(ligne) !== origine;
  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => { if (modifie) e.preventDefault(); };
    addEventListener('beforeunload', avant); return () => removeEventListener('beforeunload', avant);
  }, [modifie]);
  if (!ligne) return message ? <p class="erreur" role="alert">{message.texte}</p> : <p class="chargement">Chargement…</p>;

  // Champs décrits + champs présents dans le contenu mais pas encore décrits (rien n'est caché)
  const techniques = ['id', 'publie', 'ordre', 'cree_le', 'modifie_le', 'modifie_par'];
  const champs: Champ[] = [...r.champs, ...Object.keys(ligne).filter((k) => !techniques.includes(k) && !r.champs.some((c) => c.nom === k)).map((k) => ({ nom: k }))];
  const maj = (k: string, v: any) => {
    const n = { ...ligne, [k]: v };
    if (r.table === 'articles' && k === 'titre' && (nouveau || !ligne.slug)) n.slug = slugifier(String(v));
    setLigne(n);
  };
  const enregistrer = async (publier?: boolean) => {
    const manque = r.champs.filter((c) => c.obligatoire && !String(ligne[c.nom] ?? '').trim());
    if (manque.length) { setMessage({ type: 'erreur', texte: `À remplir : ${manque.map((c) => c.libelle ?? c.nom).join(', ')}.` }); return; }
    setEncours(true); setMessage(null);
    try {
      const donnees = publier === undefined ? ligne : { ...ligne, publie: publier };
      const res = nouveau ? await source.creer(r.table, donnees) : await source.modifier(r.table, id, donnees);
      setLigne(res); setOrigine(JSON.stringify(res));
      setMessage({ type: 'ok', texte: publier === true ? 'Enregistré et marqué « publié ». Il sera en ligne à la prochaine publication du site.' : publier === false ? 'Dépublié : il disparaîtra du site à la prochaine publication.' : 'Enregistré.' });
      if (nouveau) location.hash = `#/${r.cle}/${encodeURIComponent(res.id)}`;
    } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
    setEncours(false);
  };
  const supprimer = async () => {
    if (!confirm(`Supprimer définitivement « ${ligne[r.champTitre] ?? id} » ? Cette action ne peut pas être annulée.`)) return;
    try { await source.supprimer(r.table, id); location.hash = `#/${r.cle}`; } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  return (
    <section>
      <p class="ariane"><a href={`#/${r.cle}`}>{r.titre}</a> › {nouveau ? 'Nouveau' : String(ligne[r.champTitre] ?? id)}</p>
      <header class="entete-ecran">
        <h1>{nouveau ? 'Nouveau contenu' : String(ligne[r.champTitre] ?? '') || '(sans titre)'}</h1>
        {!nouveau && !r.unique && <Etat publie={ligne.publie} />}
      </header>
      {lectureSeule && <p class="avis">Rubrique réservée à l’administration : lecture seule.</p>}
      <fieldset class="formulaire-fiche" disabled={lectureSeule || encours}>
        {champs.map((c) => {
          if (r.table === 'lieux_aide' && c.nom === 'longitude') return null;
          if (r.table === 'lieux_aide' && c.nom === 'latitude') return <CarteLieu ligne={ligne} onChange={(lat, lng) => setLigne({ ...ligne, latitude: lat, longitude: lng })} />;
          return <ChampSaisie champ={c.type ? c : { ...c, type: typeDevine(c.nom, ligne[c.nom]) }} valeur={ligne[c.nom]} onChange={(v) => maj(c.nom, v)} ligne={ligne} />;
        })}
      </fieldset>
      {!lectureSeule && (
        <div class="barre-actions">
          <button class="btn plein" disabled={encours} onClick={() => enregistrer()}>Enregistrer</button>
          {!r.unique && admin && !ligne.publie && <button class="btn contour" disabled={encours} onClick={() => enregistrer(true)}>Enregistrer et publier</button>}
          {!r.unique && ligne.publie && <button class="btn contour" disabled={encours} onClick={() => enregistrer(false)}>Dépublier</button>}
          {!r.unique && !admin && !ligne.publie && <span class="aide">La publication est faite par l’administration.</span>}
          {modifie && <span class="non-enregistre">Modifications non enregistrées</span>}
          {!nouveau && !r.unique && admin && <button class="btn danger" onClick={supprimer}>Supprimer</button>}
        </div>
      )}
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
      {!nouveau && <Versions table={r.table} id={id} onReprendre={(d) => setLigne({ ...d, id: ligne.id })} />}
    </section>
  );
}

/** Versions publiées d'un contenu : « revenir à la version publiée du … » */
export function Versions({ table, id, onReprendre }: { table: string; id: string; onReprendre: (d: Ligne) => void }) {
  const { source } = useCtx();
  const [versions, setVersions] = useState<Ligne[] | null>(null);
  const charger = () => source.lister('versions', { egal: { table_nom: table, ligne_id: id }, ordre: 'publie_le', desc: true }).then(setVersions).catch(() => setVersions([]));
  return (
    <details class="versions" onToggle={(e) => (e.target as HTMLDetailsElement).open && !versions && charger()}>
      <summary>Versions publiées précédemment</summary>
      {!versions ? <p class="chargement">Chargement…</p> : versions.length === 0 ? <p>Aucune version publiée enregistrée pour l’instant.</p> : (
        <ul>{versions.map((v) => (
          <li>Publiée le {new Date(v.publie_le).toLocaleString('fr-BE')}{' '}
            <button type="button" class="mini" onClick={() => { if (confirm('Reprendre cette version dans le formulaire ? (Il faudra ensuite enregistrer.)')) onReprendre(v.donnees); }}>Reprendre cette version</button></li>
        ))}</ul>
      )}
    </details>
  );
}

export { urlMedia };
