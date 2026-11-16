// Teste le script SQL du CMS dans un Postgres en mémoire, avec des imitations
// minimales de Supabase (auth.uid, rôles anon/authenticated, stockage, cron).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const sql = readFileSync(process.argv[2], 'utf8').replace('create extension if not exists pg_cron;', '');
const db = new PGlite();
const ok = [], ko = [];
const verifie = (nom, cond) => (cond ? ok : ko).push(nom);

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  create schema storage; create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id serial primary key, bucket_id text, name text); alter table storage.objects enable row level security;
  create schema cron; create function cron.schedule(a text, b text, c text) returns int language sql as $$ select 1 $$;
`);
await db.exec(sql);
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon;
  grant select, insert, update, delete on all tables in schema public to authenticated;
`);

const A = '00000000-0000-0000-0000-00000000000a', R = '00000000-0000-0000-0000-00000000000b';
// Import (éditeur SQL, pas de compte) : doit pouvoir publier
await db.exec(`
  insert into auth.users values ('${A}'), ('${R}');
  insert into public.profils (id, nom, role) values ('${A}', 'Admin', 'administration'), ('${R}', 'Rédac', 'redaction');
  insert into public.sections (id, page, type, publie) values ('pub', '/x', 'texte', true), ('brouillon', '/x', 'texte', false);
  insert into public.menu (id, emplacement, libelle, lien, publie) values ('m1', 'principal', 'Accueil', '/', true);
  insert into public.messages (formulaire, reponses) values ('contact', '{"nom":"Test"}');
  insert into public.messages (formulaire, reponses, recu_le) values ('contact', '{"nom":"Vieux"}', now() - interval '13 months');
  insert into public.messages (formulaire, reponses, recu_le) values ('benevolat', '{"nom":"B"}', now() - interval '13 months');
`);
verifie('import : contenu publié sans compte', (await db.query(`select count(*)::int n from public.sections where publie`)).rows[0].n === 1);

const en = async (role, uid, requete) => {
  await db.exec(`set role ${role}; select set_config('test.uid', '${uid ?? ''}', false);`);
  try { return { res: await db.query(requete) }; }
  catch (e) { return { err: e.message }; }
  finally { await db.exec(`reset role; select set_config('test.uid', '', false);`); }
};

// Public
let r = await en('anon', null, `select id from public.sections`);
verifie('public : ne voit que le publié', r.res?.rows.length === 1 && r.res.rows[0].id === 'pub');
r = await en('anon', null, `select * from public.messages`);
verifie('public : aucun message visible', !!r.err || r.res.rows.length === 0);
r = await en('anon', null, `insert into public.sections (page, type) values ('/x', 'texte')`);
verifie('public : ne peut rien écrire', !!r.err);

// Rédaction
r = await en('authenticated', R, `select id from public.sections`);
verifie('rédaction : voit aussi les brouillons', r.res?.rows.length === 2);
r = await en('authenticated', R, `select count(*)::int n from public.messages`);
verifie('rédaction : ne voit aucun message (ni compteur)', r.res?.rows[0].n === 0);
r = await en('authenticated', R, `insert into public.sections (id, page, type) values ('r1', '/x', 'texte')`);
verifie('rédaction : crée un brouillon', !r.err);
r = await en('authenticated', R, `insert into public.sections (id, page, type, publie) values ('r2', '/x', 'texte', true)`);
verifie('rédaction : ne peut pas créer publié', !!r.err);
r = await en('authenticated', R, `update public.sections set publie = true where id = 'brouillon'`);
verifie('rédaction : ne peut pas publier', !!r.err);
r = await en('authenticated', R, `update public.sections set contenu = '{"titre":"modifié"}' where id = 'pub' returning modifie_par`);
verifie('rédaction : modifie un contenu publié (horodaté)', r.res?.rows[0]?.modifie_par === R);
r = await en('authenticated', R, `update public.sections set publie = false where id = 'r1' returning id`);
verifie('rédaction : peut dépublier', r.res?.rows.length === 1);
r = await en('authenticated', R, `delete from public.sections where id = 'brouillon' returning id`);
verifie('rédaction : ne peut pas supprimer', !!r.err || r.res.rows.length === 0);
r = await en('authenticated', R, `update public.menu set libelle = 'X' where id = 'm1' returning id`);
verifie('rédaction : ne modifie pas le menu', !!r.err || r.res.rows.length === 0);
r = await en('authenticated', R, `update public.profils set role = 'administration' where id = '${R}' returning id`);
verifie('rédaction : ne peut pas se donner le rôle administration', !!r.err || r.res.rows.length === 0);
r = await en('authenticated', R, `select public.publier_site()`);
verifie('rédaction : ne peut pas publier le site', !!r.err);

// Administration
r = await en('authenticated', A, `select count(*)::int n from public.messages`);
verifie('administration : voit les messages', r.res?.rows[0].n === 3);
r = await en('authenticated', A, `update public.sections set publie = true where id = 'brouillon' returning id`);
verifie('administration : publie', r.res?.rows.length === 1);
r = await en('authenticated', A, `select public.publier_site() p`);
verifie('administration : publie le site', !r.err);
const nv = (await db.query(`select count(*)::int n from public.versions`)).rows[0].n;
verifie(`versions créées à la publication (${nv})`, nv >= 3);
r = await en('authenticated', A, `delete from public.sections where id = 'r1' returning id`);
verifie('administration : supprime', r.res?.rows.length === 1);

// Conservation
await db.exec(`select public.nettoyage_conservation()`);
const restants = (await db.query(`select reponses->>'nom' nom from public.messages order by 1`)).rows.map((x) => x.nom);
verifie(`conservation : contact > 12 mois supprimé, bénévolat 13 mois gardé (${restants.join(', ')})`, restants.join() === 'B,Test');

console.log('RÉUSSIS :\n  ' + ok.join('\n  '));
console.log(ko.length ? 'ÉCHECS :\n  ' + ko.join('\n  ') : 'Aucun échec.');
process.exit(ko.length ? 1 : 0);
