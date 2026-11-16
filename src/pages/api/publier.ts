// Bouton « Publier le site » : relance la fabrication du site sur Vercel (fonction serveur).
// - Seul un compte « administration » peut l'utiliser : le jeton de connexion est vérifié auprès de Supabase.
// - Aucune clé dans le code : VERCEL_TOKEN (jeton Vercel, secret) est saisi par Charlotte dans Vercel.
//   VERCEL_DEPLOYMENT_ID est fourni automatiquement par Vercel ; VERCEL_EQUIPE (facultatif) = identifiant de l'équipe.
// POST  /api/publier { publication }           → lance une nouvelle fabrication, renvoie { deploiement }
// GET   /api/publier?deploiement=…&publication=… → { etat: QUEUED | BUILDING | READY | ERROR | CANCELED }
import type { APIRoute } from 'astro';
export const prerender = false;

const env = (k: string) => (process.env[k] ?? (import.meta.env as any)[k]) as string | undefined;
const json = (corps: object, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Vérifie que le jeton appartient à un compte « administration » ; renvoie le jeton ou une réponse d'erreur */
async function administrateur(req: Request): Promise<string | Response> {
  const url = env('PUBLIC_SUPABASE_URL'), cle = env('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !cle) return json({ erreur: 'Le site n’est pas encore relié à Supabase.' }, 503);
  const jeton = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jeton) return json({ erreur: 'Connexion requise.' }, 401);
  const entetes = { apikey: cle, Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };
  const u = await fetch(`${url}/auth/v1/user`, { headers: entetes });
  if (!u.ok) return json({ erreur: 'Session expirée : reconnectez-vous.' }, 401);
  const a = await fetch(`${url}/rest/v1/rpc/est_admin`, { method: 'POST', headers: entetes, body: '{}' });
  if (!a.ok || (await a.json()) !== true) return json({ erreur: 'Seule l’administration peut publier le site.' }, 403);
  return jeton;
}

const vercel = (chemin: string, init: RequestInit = {}) => {
  const equipe = env('VERCEL_EQUIPE');
  const sep = chemin.includes('?') ? '&' : '?';
  return fetch(`https://api.vercel.com${chemin}${equipe ? `${sep}teamId=${encodeURIComponent(equipe)}` : ''}`, {
    ...init, headers: { Authorization: `Bearer ${env('VERCEL_TOKEN')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
};

async function terminer(jeton: string, publication: string, resultat: 'réussi' | 'échoué') {
  await fetch(`${env('PUBLIC_SUPABASE_URL')}/rest/v1/rpc/terminer_publication`, {
    method: 'POST', headers: { apikey: env('PUBLIC_SUPABASE_ANON_KEY')!, Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pub: publication, res: resultat }),
  }).catch(() => {});
}

export const POST: APIRoute = async ({ request }) => {
  const jeton = await administrateur(request);
  if (jeton instanceof Response) return jeton;
  if (!env('VERCEL_TOKEN') || !env('VERCEL_DEPLOYMENT_ID')) return json({ erreur: 'La publication automatique n’est pas encore configurée (jeton Vercel à saisir dans Vercel).' }, 503);
  const { publication } = await request.json().catch(() => ({}));
  const r = await vercel('/v13/deployments?forceNew=1', {
    method: 'POST',
    body: JSON.stringify({ name: 'comme-chez-nous', deploymentId: env('VERCEL_DEPLOYMENT_ID'), target: 'production', meta: { publication: String(publication ?? '') } }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (publication) await terminer(jeton, publication, 'échoué');
    return json({ erreur: `Vercel a refusé la publication (${d?.error?.code ?? r.status}).` }, 502);
  }
  return json({ deploiement: d.id });
};

export const GET: APIRoute = async ({ request, url }) => {
  const jeton = await administrateur(request);
  if (jeton instanceof Response) return jeton;
  const id = url.searchParams.get('deploiement'), publication = url.searchParams.get('publication');
  if (!id || !/^[\w-]+$/.test(id)) return json({ erreur: 'Déploiement inconnu.' }, 400);
  const r = await vercel(`/v13/deployments/${id}`);
  const d = await r.json().catch(() => ({}));
  const etat = d.readyState ?? d.status ?? 'inconnu';
  if (publication && (etat === 'READY' || etat === 'ERROR' || etat === 'CANCELED')) await terminer(jeton, publication, etat === 'READY' ? 'réussi' : 'échoué');
  return json({ etat });
};
