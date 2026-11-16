// Source de démonstration (développement local uniquement) : les contenus actuels du site, en mémoire.
// Rien n'est enregistré. Le rôle se choisit avec ?demo=redaction ou ?demo=administration (par défaut).
import type { Source, Ligne, Role } from './donnees';

const fichiers = import.meta.glob('/donnees/initiales/*.json', { eager: true, import: 'default' }) as Record<string, Ligne[]>;

export function sourceDemo(): Source {
  const role = (new URLSearchParams(location.search).get('demo') === 'redaction' ? 'redaction' : 'administration') as Role;
  const tables: Record<string, Ligne[]> = {};
  for (const [f, lignes] of Object.entries(fichiers)) tables[f.split('/').pop()!.replace('.json', '')] = structuredClone(lignes);
  const maintenant = new Date().toISOString();
  for (const t of Object.values(tables)) for (const l of t) { l.modifie_le ??= '2026-11-15T12:00:00Z'; l.publie ??= true; l.ordre ??= 0; }
  tables.publications = [{ id: 'p1', le: '2026-11-15T13:00:00Z', resultat: 'réussi' }];
  tables.versions = [];
  tables.messages = [{ id: 'msg1', formulaire: 'contact', reponses: { name: 'Exemple (démo)', email: 'exemple@exemple.be', message: 'Message de démonstration.' }, recu_le: maintenant, lu: false }];
  tables.profils = [{ id: 'demo', nom: 'Compte de démonstration', role }];
  let connecte = false;
  const ecouteurs: (() => void)[] = [];
  const admin = role === 'administration';
  const RESERVEES = ['menu', 'reglages', 'numeros_utiles', 'formulaires_champs', 'messages', 'profils'];
  const peutEcrire = (t: string) => admin || !RESERVEES.includes(t);
  const refuser = () => { throw new Error('Votre rôle ne permet pas cette action.'); };
  return {
    mode: 'demo',
    async utilisateur() { return connecte ? { id: 'demo', email: 'demo@exemple.be' } : null; },
    async connexion() { connecte = true; ecouteurs.forEach((f) => f()); return null; },
    async motDePasseOublie() { return null; },
    async deconnexion() { connecte = false; ecouteurs.forEach((f) => f()); },
    surChangement(f) { ecouteurs.push(f); },
    async changerMotDePasse() { return null; },
    async profil() { return connecte ? { id: 'demo', nom: 'Compte de démonstration', role, email: 'demo@exemple.be' } : null; },
    async lister(table, o = {}) {
      let l = [...(tables[table] ?? [])].filter((x) => Object.entries(o.egal ?? {}).every(([k, v]) => x[k] === v));
      const c = o.ordre ?? 'ordre';
      if (c) l.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (o.desc ? -1 : 1));
      return structuredClone(l);
    },
    async creer(table, ligne) {
      if (!peutEcrire(table)) refuser();
      if (!admin && ligne.publie) throw new Error('Seule l’administration peut publier un contenu.');
      const n = { id: ligne.id || `${table}-${Date.now()}`, ...ligne, modifie_le: new Date().toISOString() };
      (tables[table] ??= []).push(n); return structuredClone(n);
    },
    async modifier(table, id, ligne) {
      if (!peutEcrire(table)) refuser();
      const t = tables[table]; const i = t.findIndex((x) => x.id === id);
      if (!admin && ligne.publie && !t[i].publie) throw new Error('Seule l’administration peut publier un contenu.');
      t[i] = { ...t[i], ...ligne, id, modifie_le: new Date().toISOString() }; return structuredClone(t[i]);
    },
    async supprimer(table, id) { if (!admin) refuser(); tables[table] = tables[table].filter((x) => x.id !== id); },
    async rpc(nom) {
      if (nom === 'publier_site') { if (!admin) throw new Error('Seule l’administration peut publier le site.'); const p = { id: `p${Date.now()}`, le: new Date().toISOString(), resultat: 'en cours' }; tables.publications.push(p); return p.id; }
      if (nom === 'terminer_publication') return null;
      return null;
    },
    async envoyerFichier() { /* rien n'est envoyé en démonstration */ },
    urlFichier(chemin) { return `/img/${chemin}`; },
    async jeton() { return null; },
  };
}
