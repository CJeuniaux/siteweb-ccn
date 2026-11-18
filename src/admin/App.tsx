// Administration du site Comme Chez Nous : connexion, navigation par rubriques, écrans.
import { useEffect, useState } from 'preact/hooks';
import { ouvrirSource, BASE_RELIEE, type Source, type Profil, type Ligne } from './donnees';
import { RUBRIQUES } from './rubriques';
import { Contexte, type Ctx, estAdmin } from './champs';
import { ListeRubrique, FicheRubrique } from './rubrique';
import { ListePages, FichePage } from './pages';
import { Mediatheque } from './mediatheque';
import { TableauDeBord, Messages, Comptes } from './suivi';
import { Seo } from './seo';

// #/rubrique/identifiant : chaque partie est encodée séparément (une adresse de page contient des « / »)
const lireRoute = () => location.hash.replace(/^#\/?/, '').split('/').map((x) => decodeURIComponent(x));

export default function App() {
  const [source, setSource] = useState<Source | null | undefined>(undefined);
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const [connecte, setConnecte] = useState(false);
  const [recuperation, setRecuperation] = useState(false);
  const [route, setRoute] = useState(lireRoute());
  const [donnees, setDonnees] = useState<{ medias: Ligne[]; services: Ligne[]; menu: Ligne[]; derniere: string | null }>({ medias: [], services: [], menu: [], derniere: null });

  const verifier = async (s: Source) => {
    const u = await s.utilisateur(); setConnecte(!!u);
    setProfil(u ? await s.profil() : null);
  };
  useEffect(() => {
    ouvrirSource().then((s) => {
      setSource(s);
      if (!s) return;
      if (/type=recovery/.test(location.hash)) setRecuperation(true);
      s.surChangement((ev) => { if (ev === 'PASSWORD_RECOVERY') setRecuperation(true); verifier(s); });
      verifier(s);
    });
    const surHash = () => { if (!/access_token|type=recovery/.test(location.hash)) setRoute(lireRoute()); };
    addEventListener('hashchange', surHash); return () => removeEventListener('hashchange', surHash);
  }, []);
  const charger = async () => {
    if (!source || !profil) return;
    const [medias, services, menu, pubs] = await Promise.all([
      source.lister('medias'), source.lister('services'), source.lister('menu'),
      source.lister('publications', { ordre: 'le', desc: true }).catch(() => []),
    ]);
    setDonnees({ medias, services, menu, derniere: pubs.find((p) => p.resultat === 'réussi')?.le ?? null });
  };
  useEffect(() => { charger(); }, [source, profil]);

  if (source === undefined) return <p class="chargement">Chargement…</p>;
  if (source === null) return <NonRelie />;
  if (recuperation) return <NouveauMotDePasse source={source} onFini={() => { setRecuperation(false); location.hash = '#/'; }} />;
  if (!connecte) return <Connexion source={source} />;
  if (profil === undefined) return <p class="chargement">Chargement…</p>;
  if (profil === null) return <SansProfil source={source} />;

  const ctx: Ctx = { source, profil, medias: donnees.medias, services: donnees.services, menu: donnees.menu, rechargerMedias: charger };
  const [ecran, id] = route;
  const r = RUBRIQUES.find((x) => x.cle === ecran);
  let contenu;
  if (!ecran) contenu = <TableauDeBord derniere={donnees.derniere} rafraichir={charger} />;
  else if (ecran === 'pages') contenu = id ? <FichePage key={id} adresse={id} derniere={donnees.derniere} /> : <ListePages derniere={donnees.derniere} />;
  else if (ecran === 'medias') contenu = <Mediatheque />;
  else if (ecran === 'seo') contenu = <Seo />;
  else if (ecran === 'messages' && estAdmin(profil)) contenu = <Messages />;
  else if (ecran === 'comptes' && estAdmin(profil)) contenu = <Comptes />;
  else if (r) contenu = r.unique || r.cle === 'formulaires_champs' ? <><OngletsReglages actif={r.cle} />{id || r.unique ? <FicheRubrique key={`${r.cle}-${id ?? r.unique}`} r={r} id={id ?? r.unique!} /> : <ListeRubrique key={r.cle} r={r} derniere={donnees.derniere} />}</> : id ? <FicheRubrique key={`${r.cle}-${id}`} r={r} id={id} /> : <ListeRubrique key={r.cle} r={r} derniere={donnees.derniere} />;
  else contenu = <p>Page introuvable. <a href="#/">Retour au tableau de bord</a></p>;

  // Menu sur le modèle de WordPress : peu d'entrées, les données du site regroupées dans un sous-menu repliable
  const actif = (cles: string[]) => cles.includes(ecran ?? '');
  const lien = (cle: string, titre: string, cles: string[] = [cle]) => <li><a href={`#/${cle}`} aria-current={actif(cles) || (!ecran && cle === '') ? 'page' : undefined}>{titre}</a></li>;
  const donneesSite = RUBRIQUES.filter((x) => x.groupe === 'Données' || x.cle === 'services' || x.cle === 'numeros_utiles');
  const dansDonnees = actif(donneesSite.map((x) => x.cle));
  return (
    <Contexte.Provider value={ctx}>
      <div class="admin">
        <a class="evitement" href="#ecran">Aller au contenu</a>
        <nav class="barre-laterale" aria-label="Administration">
          <a class="marque" href="#/"><img src="/favicon.svg" alt="" width="40" height="40" /><span>Comme Chez Nous<small>Administration du site</small></span></a>
          {source.mode === 'demo' && <p class="demo">Démonstration — rien n’est enregistré</p>}
          <ul class="menu-principal">
            {lien('', 'Tableau de bord')}
            {lien('articles', 'Articles')}
            {lien('pages', 'Pages')}
            {lien('medias', 'Médias')}
            <li><details class="sous-menu" open={dansDonnees}>
              <summary class={dansDonnees ? 'actif' : ''}>Données du site</summary>
              <ul>{donneesSite.map((x) => lien(x.cle, x.titre + (x.admin && !estAdmin(profil) ? ' (lecture)' : '')))}</ul>
            </details></li>
            {lien('menu', 'Menus')}
            {lien('seo', 'SEO')}
            {estAdmin(profil) && lien('messages', 'Messages')}
            {estAdmin(profil) && lien('comptes', 'Utilisateurs')}
            {lien('reglages', 'Réglages', ['reglages', 'formulaires_champs'])}
          </ul>
          <div class="compte">
            <span>{profil.email}<small>{estAdmin(profil) ? 'Administration' : 'Rédaction'}</small></span>
            <a class="lien-discret" href="/accueil" target="_blank" rel="noopener">Voir le site</a>
            <button type="button" class="lien-discret" onClick={() => source.deconnexion()}>Se déconnecter</button>
          </div>
        </nav>
        <main id="ecran" class="ecran" tabIndex={-1}>{contenu}</main>
      </div>
    </Contexte.Provider>
  );
}

function Cadre({ children }: { children: any }) {
  return <div class="cadre-connexion"><div class="boite-connexion"><img src="/favicon.svg" alt="" width="56" height="56" /><p class="sur">Comme Chez Nous</p>{children}</div></div>;
}

function NonRelie() {
  return <Cadre><h1>Administration du site</h1><p>L’administration n’est pas encore reliée à la base de contenus.</p><p class="aide">À faire par l’administratrice : saisir l’adresse et la clé publique Supabase dans Vercel (variables <code>PUBLIC_SUPABASE_URL</code> et <code>PUBLIC_SUPABASE_ANON_KEY</code>), puis republier le site.</p></Cadre>;
}

function Connexion({ source }: { source: Source }) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [encours, setEncours] = useState(false);
  const envoyer = async (e: Event) => {
    e.preventDefault(); setEncours(true); setMessage(null);
    const err = await source.connexion(email.trim(), mdp);
    if (err) setMessage({ type: 'erreur', texte: err });
    setEncours(false);
  };
  const oublie = async () => {
    if (!email.trim()) { setMessage({ type: 'erreur', texte: 'Indiquez d’abord votre e-mail.' }); return; }
    const err = await source.motDePasseOublie(email.trim());
    setMessage(err ? { type: 'erreur', texte: err } : { type: 'ok', texte: 'Si ce compte existe, un e-mail vient d’être envoyé pour choisir un nouveau mot de passe.' });
  };
  return (
    <Cadre>
      <h1>Connexion</h1>
      {source.mode === 'demo' && <p class="demo">Démonstration : n’importe quel e-mail et mot de passe.</p>}
      <form onSubmit={envoyer} class="formulaire-fiche">
        <div class="champ"><label for="email">E-mail</label><input id="email" type="email" autoComplete="username" required value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} /></div>
        <div class="champ"><label for="mdp">Mot de passe</label><input id="mdp" type="password" autoComplete="current-password" required value={mdp} onInput={(e) => setMdp((e.target as HTMLInputElement).value)} /></div>
        <button class="btn plein" type="submit" disabled={encours}>{encours ? 'Connexion…' : 'Se connecter'}</button>
        <button type="button" class="lien-discret" onClick={oublie}>Mot de passe oublié ?</button>
      </form>
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
      <p class="aide">Pas de compte ? Demandez une invitation à l’administration de l’association.</p>
    </Cadre>
  );
}

function NouveauMotDePasse({ source, onFini }: { source: Source; onFini: () => void }) {
  const [mdp, setMdp] = useState('');
  const [message, setMessage] = useState('');
  const envoyer = async (e: Event) => {
    e.preventDefault();
    if (mdp.length < 10) { setMessage('Choisissez au moins 10 caractères.'); return; }
    const err = await source.changerMotDePasse(mdp);
    if (err) setMessage(err); else onFini();
  };
  return (
    <Cadre><h1>Choisir un mot de passe</h1>
      <form onSubmit={envoyer} class="formulaire-fiche">
        <div class="champ"><label for="nmdp">Nouveau mot de passe (10 caractères minimum)</label><input id="nmdp" type="password" autoComplete="new-password" required value={mdp} onInput={(e) => setMdp((e.target as HTMLInputElement).value)} /></div>
        <button class="btn plein" type="submit">Enregistrer</button>
      </form>
      {message && <p class="erreur" role="alert">{message}</p>}
    </Cadre>
  );
}

function SansProfil({ source }: { source: Source }) {
  return <Cadre><h1>Accès non attribué</h1><p>Votre compte existe, mais aucun rôle ne lui a encore été donné. Demandez à l’administration de l’association de vous attribuer un rôle.</p><button class="btn contour" onClick={() => source.deconnexion()}>Se déconnecter</button></Cadre>;
}

export { BASE_RELIEE };

/** Onglets de l'écran Réglages : réglages généraux, champs des formulaires */
function OngletsReglages({ actif }: { actif: string }) {
  return (
    <nav class="onglets" aria-label="Réglages">
      <a href="#/reglages" aria-current={actif === 'reglages' ? 'page' : undefined}>Général et coordonnées</a>
      <a href="#/formulaires_champs" aria-current={actif === 'formulaires_champs' ? 'page' : undefined}>Formulaires</a>
    </nav>
  );
}
