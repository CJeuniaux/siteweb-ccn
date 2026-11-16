// SEO : titre et description de chaque page, page de service et article, sur un seul écran,
// avec un aperçu du résultat dans Google. Les modifications sont enregistrées dans les mêmes contenus
// que les autres écrans (pages.description, services.description_seo, articles.resume).
import { useEffect, useState } from 'preact/hooks';
import type { Ligne } from './donnees';
import { useCtx } from './champs';

interface Element { table: string; id: string; adresse: string; titre: string; champTitre: string | null; description: string; champDescription: string; type: string; ligne: Ligne }

const NOM_SITE = 'Comme Chez Nous';

function jauge(n: number) {
  if (n === 0) return { classe: 'manque', texte: 'Manquante' };
  if (n < 70) return { classe: 'court', texte: `${n} caractères — un peu courte` };
  if (n > 165) return { classe: 'long', texte: `${n} caractères — sera coupée par Google` };
  return { classe: 'bon', texte: `${n} caractères — bien` };
}

export function Seo() {
  const { source } = useCtx();
  const [elements, setElements] = useState<Element[] | null>(null);
  const [filtre, setFiltre] = useState('');
  useEffect(() => {
    (async () => {
      const [pages, services, articles] = await Promise.all([source.lister('pages'), source.lister('services'), source.lister('articles', { ordre: 'date_publication', desc: true })]);
      setElements([
        ...pages.sort((a, b) => a.adresse.localeCompare(b.adresse)).map((p) => ({ table: 'pages', id: p.id, adresse: p.adresse, titre: p.titre || (p.adresse === '/' ? 'Accueil' : p.adresse), champTitre: 'titre', description: p.description ?? '', champDescription: 'description', type: 'Page', ligne: p })),
        ...services.map((s) => ({ table: 'services', id: s.id, adresse: `/services/${s.slug}`, titre: s.nom, champTitre: null, description: s.description_seo || '', champDescription: 'description_seo', type: 'Service', ligne: s })),
        ...articles.filter((a) => !a.lien_externe).map((a) => ({ table: 'articles', id: a.id, adresse: `/actualites/${a.slug}`, titre: a.titre, champTitre: null, description: a.resume ?? '', champDescription: 'resume', type: 'Article', ligne: a })),
      ]);
    })();
  }, []);
  const manquantes = (elements ?? []).filter((e) => !e.description.trim()).length;
  const visibles = (elements ?? []).filter((e) => !filtre || (filtre === 'manque' ? !e.description.trim() : e.type === filtre));
  return (
    <section>
      <header class="entete-ecran"><div><h1>SEO</h1>
        <p class="intro">Le titre et la description de chaque page, tels que Google les affiche. Une bonne description fait environ 150 caractères et dit concrètement ce qu’on trouve sur la page.</p></div></header>
      <p class="avis">Le site est encore en version de travail : il reste fermé aux moteurs de recherche jusqu’à la mise en ligne définitive.</p>
      <div class="outils-liste">
        <select aria-label="Afficher" value={filtre} onChange={(e) => setFiltre((e.target as HTMLSelectElement).value)}>
          <option value="">Tout afficher</option><option value="Page">Pages</option><option value="Service">Pages de service</option><option value="Article">Articles</option>
          <option value="manque">Sans description ({manquantes})</option>
        </select>
      </div>
      {!elements ? <p class="chargement">Chargement…</p> : <ul class="liste-seo">{visibles.map((e) => <LigneSeo key={`${e.table}-${e.id}`} e={e} />)}</ul>}
    </section>
  );
}

function LigneSeo({ e }: { e: Element }) {
  const { source } = useCtx();
  const [titre, setTitre] = useState(e.titre);
  const [description, setDescription] = useState(e.description);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const modifie = titre !== e.titre || description !== e.description;
  const j = jauge(description.trim().length);
  const enregistrer = async () => {
    try {
      const maj: Ligne = { [e.champDescription]: description };
      if (e.champTitre) maj[e.champTitre] = titre;
      await source.modifier(e.table, e.id, { ...e.ligne, ...maj });
      e.titre = titre; e.description = description; Object.assign(e.ligne, maj);
      setMessage({ type: 'ok', texte: 'Enregistré.' });
    } catch (err: any) { setMessage({ type: 'erreur', texte: err.message }); }
  };
  const id = `${e.table}-${e.id}`;
  return (
    <li class="ligne-seo">
      <div class="seo-entete"><span class="etat brouillon">{e.type}</span> <b>{titre}</b> <span class="fiche-sous">{e.adresse}</span></div>
      <div class="apercu-google" aria-label="Aperçu dans Google">
        <span class="g-adresse">asblcommecheznous.be{e.adresse === '/' ? '' : e.adresse.replace(/\//g, ' › ').replace(/^ › /, ' › ')}</span>
        <span class="g-titre">{titre ? `${titre} — ${NOM_SITE}` : NOM_SITE}</span>
        <span class="g-desc">{description.trim() ? (description.length > 160 ? description.slice(0, 157) + '…' : description) : 'Google choisira lui-même un extrait de la page.'}</span>
      </div>
      <div class="formulaire-fiche">
        {e.champTitre && <div class="champ"><label for={`t-${id}`}>Titre de la page</label><input id={`t-${id}`} value={titre} onInput={(x) => setTitre((x.target as HTMLInputElement).value)} /></div>}
        <div class="champ"><label for={`d-${id}`}>Description{e.table === 'articles' && ' (c’est aussi le résumé affiché sous le titre)'}</label>
          <textarea id={`d-${id}`} rows={2} value={description} onInput={(x) => setDescription((x.target as HTMLTextAreaElement).value)} />
          <small class={`jauge ${j.classe}`}>{j.texte}</small></div>
      </div>
      {modifie && <div class="barre-actions"><button class="btn plein" onClick={enregistrer}>Enregistrer</button><span class="non-enregistre">Modifications non enregistrées</span></div>}
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
    </li>
  );
}
