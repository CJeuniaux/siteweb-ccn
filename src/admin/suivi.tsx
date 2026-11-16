// Tableau de bord (à publier, à vérifier, messages), bouton « Publier le site », messages reçus, comptes.
import { useEffect, useState } from 'preact/hooks';
import type { Ligne } from './donnees';
import { RUBRIQUES, TYPES_BLOCS } from './rubriques';
import { useCtx, estAdmin } from './champs';

const TABLES_CONTENU = ['pages', 'sections', 'services', 'articles', 'medias', 'chiffres', 'graphiques', 'temoignages', 'equipe', 'reperes', 'valeurs', 'partenaires', 'projet', 'lieux_aide', 'numeros_utiles', 'menu', 'reglages', 'formulaires_champs'];
const titreTable = (t: string) => RUBRIQUES.find((r) => r.table === t)?.titre ?? ({ pages: 'Pages', sections: 'Blocs de page', medias: 'Médiathèque' } as Record<string, string>)[t] ?? t;
const lienVers = (t: string, l: Ligne) => t === 'sections' ? `#/pages/${encodeURIComponent(l.page)}` : t === 'pages' ? `#/pages/${encodeURIComponent(l.adresse)}` : t === 'medias' ? '#/medias' : `#/${RUBRIQUES.find((r) => r.table === t)?.cle ?? t}/${encodeURIComponent(l.id)}`;
const nomDe = (t: string, l: Ligne) => t === 'sections' ? `${TYPES_BLOCS[l.type] ?? l.type} — ${l.page}` : String(l.titre ?? l.nom ?? l.libelle ?? l.alt ?? l.valeur ?? l.id);

export function TableauDeBord({ derniere, rafraichir }: { derniere: string | null; rafraichir: () => void }) {
  const { source, profil } = useCtx();
  const admin = estAdmin(profil);
  const [aPublier, setAPublier] = useState<{ table: string; ligne: Ligne }[] | null>(null);
  const [aVerifier, setAVerifier] = useState<{ lieux: number; blocs: Ligne[] }>({ lieux: 0, blocs: [] });
  const [nonLus, setNonLus] = useState(0);
  const [historique, setHistorique] = useState<Ligne[]>([]);
  useEffect(() => {
    (async () => {
      const liste: { table: string; ligne: Ligne }[] = [];
      for (const t of TABLES_CONTENU) {
        try { for (const l of await source.lister(t, { ordre: '' })) if (!derniere || l.modifie_le > derniere) liste.push({ table: t, ligne: l }); } catch { /* table non lisible pour ce rôle */ }
      }
      setAPublier(liste);
      const lieux = (await source.lister('lieux_aide', { ordre: '' }).catch(() => [])).filter((l) => l.statut_verification === 'a_verifier').length;
      const blocs = (await source.lister('sections', { ordre: 'page' }).catch(() => [])).filter((s) => s.contenu?.a_valider);
      setAVerifier({ lieux, blocs });
      if (admin) setNonLus((await source.lister('messages', { egal: { lu: false }, ordre: '' }).catch(() => [])).length);
      setHistorique(await source.lister('publications', { ordre: 'le', desc: true }).catch(() => []));
    })();
  }, [derniere]);
  return (
    <section>
      <header class="entete-ecran"><div><p class="sur">Espace de travail</p><h1>Bonjour{profil.nom ? ` ${profil.nom}` : ''}</h1>
        <p class="intro">Vous êtes connecté·e en <b>{admin ? 'administration' : 'rédaction'}</b>. {admin ? 'Vous pouvez tout modifier, publier et supprimer.' : 'Vous pouvez créer et modifier les contenus ; l’administration les publie.'}</p></div></header>
      <div class="cartes-tableau">
        <a class="carte-tableau" href="#/pages"><b>{aPublier?.length ?? '…'}</b><span>contenu{(aPublier?.length ?? 0) > 1 ? 's' : ''} modifié{(aPublier?.length ?? 0) > 1 ? 's' : ''} depuis la dernière publication</span></a>
        <a class="carte-tableau" href="#/lieux_aide"><b>{aVerifier.lieux}</b><span>lieu{aVerifier.lieux > 1 ? 'x' : ''} d’aide à vérifier</span></a>
        <a class="carte-tableau" href="#/pages"><b>{aVerifier.blocs.length}</b><span>bloc{aVerifier.blocs.length > 1 ? 's' : ''} à faire valider</span></a>
        {admin && <a class="carte-tableau" href="#/messages"><b>{nonLus}</b><span>message{nonLus > 1 ? 's' : ''} non lu{nonLus > 1 ? 's' : ''}</span></a>}
      </div>
      {admin && <Publier nbModifs={aPublier?.length ?? 0} onFini={rafraichir} />}
      <h2 class="h-liste">Modifié depuis la dernière publication</h2>
      {!aPublier ? <p class="chargement">Chargement…</p> : aPublier.length === 0 ? <p>Rien à publier : le site est à jour.</p> : (
        <ul class="liste-fiches">{aPublier.slice(0, 60).map(({ table, ligne }) => (
          <li><a href={lienVers(table, ligne)}><span class="fiche-titre">{nomDe(table, ligne)}</span><span class="fiche-sous">{titreTable(table)} · {new Date(ligne.modifie_le).toLocaleString('fr-BE')}</span>{!ligne.publie && <span class="etat brouillon">Brouillon</span>}</a></li>
        ))}</ul>
      )}
      {aVerifier.blocs.length > 0 && <>
        <h2 class="h-liste">Blocs à faire valider</h2>
        <ul class="liste-fiches">{aVerifier.blocs.map((b) => <li><a href={`#/pages/${encodeURIComponent(b.page)}`}><span class="fiche-titre">{TYPES_BLOCS[b.type] ?? b.type} — {b.contenu?.titre ?? ''}</span><span class="fiche-sous">{b.page}{b.contenu?.note_interne ? ` · ${b.contenu.note_interne}` : ''}</span></a></li>)}</ul>
      </>}
      {historique.length > 0 && <>
        <h2 class="h-liste">Dernières publications</h2>
        <ul class="liste-simple">{historique.slice(0, 8).map((p) => <li>{new Date(p.le).toLocaleString('fr-BE')} — {p.resultat}</li>)}</ul>
      </>}
    </section>
  );
}

/** Bouton « Publier le site » : copie les versions, puis relance la fabrication du site sur Vercel (1 à 3 minutes). */
function Publier({ nbModifs, onFini }: { nbModifs: number; onFini: () => void }) {
  const { source } = useCtx();
  const [etat, setEtat] = useState<{ type: 'ok' | 'erreur' | 'encours'; texte: string } | null>(null);
  const publier = async () => {
    if (!confirm(`Publier le site maintenant ? Les contenus marqués « publiés » seront mis en ligne (${nbModifs} modification${nbModifs > 1 ? 's' : ''}).`)) return;
    setEtat({ type: 'encours', texte: 'Préparation…' });
    try {
      const pub = await source.rpc('publier_site');
      if (source.mode === 'demo') { setEtat({ type: 'ok', texte: 'Démonstration : rien n’est publié.' }); return; }
      const jeton = await source.jeton();
      const r = await fetch('/api/publier', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` }, body: JSON.stringify({ publication: pub }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erreur ?? 'La publication n’a pas pu être lancée.');
      setEtat({ type: 'encours', texte: 'Fabrication du site en cours (1 à 3 minutes)…' });
      const suivre = async () => {
        const s = await fetch(`/api/publier?deploiement=${encodeURIComponent(d.deploiement)}&publication=${encodeURIComponent(pub)}`, { headers: { Authorization: `Bearer ${await source.jeton()}` } }).then((x) => x.json()).catch(() => ({ etat: 'inconnu' }));
        if (s.etat === 'READY') { setEtat({ type: 'ok', texte: 'Le site est en ligne avec vos modifications.' }); onFini(); }
        else if (s.etat === 'ERROR' || s.etat === 'CANCELED') setEtat({ type: 'erreur', texte: 'La fabrication du site a échoué. Le site en ligne n’a pas changé. Réessayez ou prévenez Nomad Impact.' });
        else setTimeout(suivre, 8000);
      };
      setTimeout(suivre, 8000);
    } catch (e: any) { setEtat({ type: 'erreur', texte: e.message }); }
  };
  return (
    <div class="publier">
      <div><h2>Publier le site</h2><p>Met en ligne tout ce qui est marqué « publié ». Les brouillons restent invisibles.</p></div>
      <button class="btn plein" disabled={etat?.type === 'encours'} onClick={publier}>Publier le site</button>
      {etat && <p class={etat.type === 'erreur' ? 'erreur' : etat.type === 'ok' ? 'succes' : 'chargement'} role="status">{etat.texte}</p>}
    </div>
  );
}

export function Messages() {
  const { source } = useCtx();
  const [messages, setMessages] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState('');
  const charger = () => source.lister('messages', { ordre: 'recu_le', desc: true }).then(setMessages).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, []);
  const marquer = async (m: Ligne, lu: boolean) => { try { await source.modifier('messages', m.id, { lu }); charger(); } catch (e: any) { setErreur(e.message); } };
  const supprimer = async (m: Ligne) => { if (confirm('Supprimer définitivement ce message ?')) { try { await source.supprimer('messages', m.id); charger(); } catch (e: any) { setErreur(e.message); } } };
  return (
    <section>
      <header class="entete-ecran"><div><h1>Messages reçus</h1><p class="intro">Messages des formulaires du site. Ils sont supprimés automatiquement après la durée de conservation (contact : 12 mois ; bénévolat et partenariat : 24 mois).</p></div></header>
      {erreur && <p class="erreur" role="alert">{erreur}</p>}
      {!messages ? <p class="chargement">Chargement…</p> : messages.length === 0 ? <p>Aucun message.</p> : (
        <ul class="liste-messages">{messages.map((m) => (
          <li class={m.lu ? 'lu' : 'non-lu'}>
            <p class="message-entete"><b>{m.formulaire}</b> · {new Date(m.recu_le).toLocaleString('fr-BE')} {!m.lu && <span class="pastille">Nouveau</span>}</p>
            <dl>{Object.entries(m.reponses ?? {}).map(([k, v]) => <><dt>{k}</dt><dd>{Array.isArray(v) ? v.join(', ') : String(v)}</dd></>)}</dl>
            <div class="barre-actions">
              <button class="btn contour" onClick={() => marquer(m, !m.lu)}>{m.lu ? 'Marquer non lu' : 'Marquer lu'}</button>
              {m.reponses?.email && <a class="btn contour" href={`mailto:${m.reponses.email}`}>Répondre</a>}
              <button class="btn danger" onClick={() => supprimer(m)}>Supprimer</button>
            </div>
          </li>
        ))}</ul>
      )}
    </section>
  );
}

export function Comptes() {
  const { source, profil } = useCtx();
  const [comptes, setComptes] = useState<Ligne[] | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const charger = () => source.lister('profils', { ordre: 'cree_le' }).then(setComptes).catch((e) => setMessage({ type: 'erreur', texte: e.message }));
  useEffect(() => { charger(); }, []);
  const enregistrer = async (c: Ligne) => {
    if (c.id === profil.id && c.role !== 'administration' && !confirm('Vous retirez votre propre accès administration. Continuer ?')) return;
    try { await source.modifier('profils', c.id, { nom: c.nom, role: c.role }); setMessage({ type: 'ok', texte: 'Compte enregistré.' }); charger(); } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  return (
    <section>
      <header class="entete-ecran"><div><h1>Comptes</h1>
        <p class="intro">Pour ajouter une personne : dans Supabase, <b>Authentication → Users → Invite user</b>, avec son e-mail. Elle reçoit un lien pour choisir son mot de passe et apparaît ici en <b>rédaction</b>. Vous pouvez ensuite changer son rôle. Pour retirer un accès : supprimez la personne dans Supabase.</p></div></header>
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
      {!comptes ? <p class="chargement">Chargement…</p> : (
        <table class="tableau-admin">
          <thead><tr><th scope="col">E-mail</th><th scope="col">Nom</th><th scope="col">Rôle</th><th scope="col"><span class="sr">Action</span></th></tr></thead>
          <tbody>{comptes.map((c, i) => (
            <tr>
              <td>{c.email || c.id}</td>
              <td><input aria-label="Nom" value={c.nom} onInput={(e) => setComptes(comptes.map((x, j) => (j === i ? { ...x, nom: (e.target as HTMLInputElement).value } : x)))} /></td>
              <td><select aria-label="Rôle" value={c.role} onChange={(e) => setComptes(comptes.map((x, j) => (j === i ? { ...x, role: (e.target as HTMLSelectElement).value } : x)))}><option value="redaction">Rédaction</option><option value="administration">Administration</option></select></td>
              <td><button class="btn contour" onClick={() => enregistrer(c)}>Enregistrer</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
      <h2 class="h-liste">Ce que chaque rôle peut faire</h2>
      <table class="tableau-admin"><thead><tr><th scope="col">Action</th><th scope="col">Rédaction</th><th scope="col">Administration</th></tr></thead><tbody>
        {[['Créer et modifier les contenus, les pages, les images', '✔', '✔'], ['Dépublier un contenu', '✔', '✔'], ['Publier un contenu, publier le site', '—', '✔'], ['Supprimer', '—', '✔'], ['Menus, réglages, coordonnées, numéros d’urgence, formulaires', 'lecture', '✔'], ['Messages reçus, comptes', '—', '✔']].map((l) => <tr>{l.map((x, k) => k === 0 ? <th scope="row">{x}</th> : <td>{x}</td>)}</tr>)}
      </tbody></table>
    </section>
  );
}
