// robots.txt : tout est bloqué tant que le site est en version de travail.
import { VERSION_TRAVAIL } from '../lib/etat';

export function GET() {
  const contenu = VERSION_TRAVAIL ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n';
  return new Response(contenu, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
