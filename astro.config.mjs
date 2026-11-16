import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Site statique : les pages sont fabriquées à la publication à partir du CMS.
// Les images de la médiathèque (stockage Supabase) sont téléchargées et optimisées à ce moment-là.
// Seules les fonctions serveur (/api/…) tournent à la demande (adaptateur Vercel). L'administration (/admin)
// est une application dans le navigateur (Preact), reliée directement à Supabase.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const supabase = env.PUBLIC_SUPABASE_URL ? new URL(env.PUBLIC_SUPABASE_URL).hostname : null;

// Typographie, appliquée à toutes les pages après la fabrication (contenus présents et futurs du CMS) :
// « & » reste toujours attaché au mot qui le suit (espace insécable), il ne finit jamais seul en bout de ligne.
const typographie = {
  name: 'ccn-typographie',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const racine = fileURLToPath(dir);
      const pages = async (d) => (await Promise.all((await readdir(d, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? pages(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : []))).flat();
      for (const f of await pages(racine)) {
        const html = await readFile(f, 'utf8');
        const net = html.replace(/&amp; /g, '&amp;&nbsp;');
        if (net !== html) await writeFile(f, net);
      }
    },
  },
};

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  build: { format: 'file' },
  image: { domains: supabase ? [supabase] : [] },
  integrations: [preact(), typographie],
  // Ancienne adresse de Parent'Elle (redirection permanente, aussi déclarée dans vercel.json)
  redirects: { '/services/parent-elles': { status: 308, destination: '/services/parent-elle' } },
});
