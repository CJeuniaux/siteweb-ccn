// Manifeste pour l'ajout à l'écran d'accueil des téléphones. Le nom vient des réglages du CMS.
import { reglages } from '../lib/contenu';

export async function GET() {
  const r = await reglages();
  const manifeste = {
    name: r.nom,
    short_name: r.nom,
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#0B203F',
    background_color: '#FBF7F2',
    display: 'browser',
  };
  return new Response(JSON.stringify(manifeste), { headers: { 'Content-Type': 'application/manifest+json' } });
}
