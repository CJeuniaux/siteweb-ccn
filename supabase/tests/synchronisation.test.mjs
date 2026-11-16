// Vérifie dans un Postgres en mémoire que 0001 → 0004 → 0006 → 0007 → 0008 s'enchaînent sans erreur.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
await db.exec(`create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid'; create table auth.users (id uuid primary key, email text);
  create role anon; create role authenticated; create table auth.users_tmp (x int); create schema cron; create function cron.schedule(a text, b text, c text) returns int language sql as 'select 1';
  create schema storage; create table storage.buckets (id text primary key, name text, public boolean); create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;`);
let schema = readFileSync('supabase/migrations/0001_schema.sql', 'utf8').replace('create extension if not exists pg_cron;', '');
const fichiers = [['0001', schema], ...['supabase/migrations/0004_reglages_articles.sql', 'supabase/migrations/0006_lieux_verification.sql', 'supabase/migrations/0007_cms_complements.sql', 'supabase/import/0008_synchronisation.sql'].map((f) => [f, readFileSync(f, 'utf8')])];
for (const [nom, sql] of fichiers) {
  try { await db.exec(sql); console.log('OK', nom); } catch (e) { console.log('ÉCHEC', nom, e.message); process.exit(1); }
}
for (const t of ['sections', 'medias', 'lieux_aide', 'services', 'pages', 'articles']) console.log(t, (await db.query(`select count(*)::int n from public.${t}`)).rows[0].n);
console.log((await db.query(`select statut_verification, coordonnees_ccn from public.lieux_aide where id='l-rebond'`)).rows[0]);
console.log((await db.query(`select type_visuel from public.medias where id='m-tasse-partagee-detoure'`)).rows[0]);
