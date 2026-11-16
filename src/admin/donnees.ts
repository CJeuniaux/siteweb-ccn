// Accès aux données de l'administration. Deux sources possibles, même interface :
// - « supabase » : la vraie base (adresse et clé publique saisies par Charlotte dans Vercel ; aucune clé dans le code).
//   Les droits sont appliqués par la base elle-même (règles RLS) : l'écran ne fait que refléter ce que la base autorise.
// - « demo » : uniquement en développement local (npm run dev, adresse /admin?demo), contenus actuels du site en mémoire,
//   rien n'est enregistré. Sert à tester l'interface sans compte ni clé.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Role = 'redaction' | 'administration';
export interface Profil { id: string; nom: string; role: Role; email: string }
export type Ligne = Record<string, any>;

export interface Source {
  mode: 'supabase' | 'demo';
  utilisateur(): Promise<{ id: string; email: string } | null>;
  connexion(email: string, motDePasse: string): Promise<string | null>;
  motDePasseOublie(email: string): Promise<string | null>;
  deconnexion(): Promise<void>;
  surChangement(f: (evenement?: string) => void): void;
  changerMotDePasse(motDePasse: string): Promise<string | null>;
  profil(): Promise<Profil | null>;
  lister(table: string, options?: { egal?: Ligne; ordre?: string; desc?: boolean }): Promise<Ligne[]>;
  creer(table: string, ligne: Ligne): Promise<Ligne>;
  modifier(table: string, id: string, ligne: Ligne): Promise<Ligne>;
  supprimer(table: string, id: string): Promise<void>;
  rpc(nom: string, args?: Ligne): Promise<any>;
  envoyerFichier(chemin: string, fichier: File): Promise<void>;
  urlFichier(chemin: string): string;
  jeton(): Promise<string | null>;
}

const URL_SUPABASE = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const CLE_PUBLIQUE = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
export const BASE_RELIEE = Boolean(URL_SUPABASE && CLE_PUBLIQUE);

/** Message d'erreur compréhensible à partir d'une erreur de la base */
export function traduire(e: any): string {
  const m = String(e?.message ?? e ?? '');
  if (/row-level security|permission denied|violates row-level/i.test(m)) return 'Votre rôle ne permet pas cette action.';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(m)) return 'Ce compte n’a pas encore été confirmé (lien reçu par e-mail).';
  if (/duplicate key/i.test(m)) return 'Cet identifiant ou cette adresse existe déjà.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Connexion impossible. Vérifiez votre accès à Internet.';
  return m.replace(/^.*?:\s*(Seule l.administration)/, '$1') || 'Une erreur est survenue.';
}

function sourceSupabase(): Source {
  const sb: SupabaseClient = createClient(URL_SUPABASE!, CLE_PUBLIQUE!);
  const verifier = <T,>(r: { data: T; error: any }) => { if (r.error) throw new Error(traduire(r.error)); return r.data; };
  return {
    mode: 'supabase',
    async utilisateur() { const { data } = await sb.auth.getUser(); return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null; },
    async connexion(email, motDePasse) { const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse }); return error ? traduire(error) : null; },
    async motDePasseOublie(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin` });
      return error ? traduire(error) : null;
    },
    async deconnexion() { await sb.auth.signOut(); },
    surChangement(f) { sb.auth.onAuthStateChange((evenement) => f(evenement)); },
    async changerMotDePasse(motDePasse) { const { error } = await sb.auth.updateUser({ password: motDePasse }); return error ? traduire(error) : null; },
    async profil() {
      const u = await this.utilisateur(); if (!u) return null;
      const { data } = await sb.from('profils').select('*').eq('id', u.id).maybeSingle();
      return data ? { ...(data as any), email: u.email } : null;
    },
    async lister(table, o = {}) {
      let q = sb.from(table).select('*');
      for (const [k, v] of Object.entries(o.egal ?? {})) q = q.eq(k, v);
      if (o.ordre !== '') q = q.order(o.ordre ?? 'ordre', { ascending: !o.desc });
      return verifier(await q) as Ligne[];
    },
    async creer(table, ligne) { return verifier(await sb.from(table).insert(ligne).select().single()) as Ligne; },
    async modifier(table, id, ligne) {
      const { id: _i, cree_le: _c, modifie_le: _m, modifie_par: _p, ...reste } = ligne;
      return verifier(await sb.from(table).update(reste).eq('id', id).select().single()) as Ligne;
    },
    async supprimer(table, id) { verifier(await sb.from(table).delete().eq('id', id)); },
    async rpc(nom, args) { return verifier(await sb.rpc(nom, args)); },
    async envoyerFichier(chemin, fichier) { verifier(await sb.storage.from('medias').upload(chemin, fichier, { upsert: false, contentType: fichier.type })); },
    urlFichier(chemin) { return sb.storage.from('medias').getPublicUrl(chemin).data.publicUrl; },
    async jeton() { const { data } = await sb.auth.getSession(); return data.session?.access_token ?? null; },
  };
}

export async function ouvrirSource(): Promise<Source | null> {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) return (await import('./demo')).sourceDemo();
  return BASE_RELIEE ? sourceSupabase() : null;
}
