-- =====================================================================
-- CMS du site Comme Chez Nous — schéma validé par Charlotte le 14/11/2026
-- À exécuter UNE fois dans le projet Supabase « CCN-SITE » (éditeur SQL).
-- Ne contient aucune clé, aucun compte, aucune donnée personnelle.
-- =====================================================================

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------
-- 1. Comptes et rôles
-- ---------------------------------------------------------------------
create type public.role_cms as enum ('redaction', 'administration');

create table public.profils (
  id        uuid primary key references auth.users (id) on delete cascade,
  nom       text not null default '',
  role      public.role_cms not null default 'redaction',
  cree_le   timestamptz not null default now()
);
comment on table public.profils is 'Un profil par compte de l''administration. Aucun compte n''est créé par ce script.';

-- Fonctions d'aide pour les règles de sécurité (security definer : lisent profils sans boucle RLS)
create or replace function public.est_membre() returns boolean
  language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profils where id = (select auth.uid())) $$;

create or replace function public.est_admin() returns boolean
  language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profils where id = (select auth.uid()) and role = 'administration') $$;

alter table public.profils enable row level security;
create policy "profils : chacun voit le sien, l'administration voit tout"
  on public.profils for select to authenticated
  using (id = (select auth.uid()) or public.est_admin());
create policy "profils : seule l'administration crée"
  on public.profils for insert to authenticated with check (public.est_admin());
create policy "profils : seule l'administration modifie"
  on public.profils for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "profils : seule l'administration supprime"
  on public.profils for delete to authenticated using (public.est_admin());

-- ---------------------------------------------------------------------
-- 2. Tables de contenu
--    Colonnes communes : id, publie, ordre, cree_le, modifie_le, modifie_par
-- ---------------------------------------------------------------------
create table public.pages (
  id text primary key default gen_random_uuid()::text,
  adresse text not null unique,            -- ex. /association
  titre text not null default '',
  description text not null default '',    -- pour Google
  theme text not null default 'rouge',     -- rouge | bleu | jaune | vert | nuit
  image_partage text not null default ''
);

create table public.sections (
  id text primary key default gen_random_uuid()::text,
  page text not null,                      -- adresse de la page, ex. /services/le-rebond
  type text not null,                      -- type de bloc (mise en page dans le code)
  contenu jsonb not null default '{}'::jsonb
);
create index on public.sections (page);

create table public.menu (
  id text primary key default gen_random_uuid()::text,
  emplacement text not null,               -- principal | boutons | pied_services | pied_pratique
  parent text references public.menu (id) on delete cascade,
  libelle text not null,
  lien text not null,
  style text,
  icone text
);

create table public.reglages (
  id text primary key default 'general',
  nom text not null default '', sous_nom text not null default '', logo text not null default '',
  slogan text not null default '', phrase_fin text not null default '',
  adresse_ligne1 text not null default '', adresse_ligne2 text not null default '',
  telephone text not null default '', email text not null default '',
  bandeau_texte text not null default '', lien_evitement text not null default '',
  bouton_infos text not null default '',
  pied_titre_services text not null default '', pied_titre_trouver text not null default '', pied_titre_pratique text not null default '',
  don_titre text not null default '', don_bouton text not null default '', don_lien text not null default '',
  don_image text not null default '', don_image_alt text not null default '',
  autres_services_titre text not null default '',
  infos_titre text not null default '', infos_titre_adresse text not null default '',
  infos_titre_tel text not null default '', infos_lien_ecrire text not null default '',
  iban text not null default '', beneficiaire text not null default '', attestation text not null default '',
  qr_code text not null default '',
  maintenance boolean not null default false
);

create table public.numeros_utiles (
  id text primary key default gen_random_uuid()::text,
  emplacement text not null,               -- bandeau | aide
  libelle text not null, numero text not null, tel text not null,
  precision text not null default ''
);

create table public.medias (
  id text primary key default gen_random_uuid()::text,
  fichier text not null,                   -- chemin dans le stockage « medias »
  alt text not null,                       -- texte alternatif obligatoire
  credit text not null default '',
  largeur int, hauteur int
);

create table public.services (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique, nom text not null, theme text not null default 'rouge',
  picto text not null default '', photo text not null default '', photo_alt text not null default '',
  rotation numeric not null default 0,
  accroche text not null default '', sous_titre text not null default '', chapo text not null default '',
  ariane text not null default '', description_seo text not null default '',
  horaires jsonb not null default '[]'::jsonb,   -- [{ "jours": "...", "heures": "..." }]
  telephone text not null default '', contact text not null default '',
  transversal boolean not null default false,
  bloc_transversal_sur text not null default '', bloc_transversal_texte text not null default '',
  bloc_transversal_bouton text not null default ''
);

create table public.chiffres (
  id text primary key default gen_random_uuid()::text,
  contexte text not null,                  -- accueil | association | service
  service text, valeur text not null, libelle text not null,
  annee text not null default '', image text not null default ''
);

create table public.graphiques (
  id text primary key default gen_random_uuid()::text,
  service text not null, graphique text not null, libelle text not null, valeur numeric not null
);

create table public.temoignages (
  id text primary key default gen_random_uuid()::text,
  service text, texte text not null, auteur text not null default ''
);

create table public.equipe (
  id text primary key default gen_random_uuid()::text,
  nom text not null, fonction text not null default '', photo text not null default '', photo_alt text not null default ''
);

create table public.galerie (
  id text primary key default gen_random_uuid()::text,
  photo text not null, alt text not null, titre text not null default '', legende text not null default ''
);

create table public.reperes (
  id text primary key default gen_random_uuid()::text,
  annee text not null, texte text not null
);

create table public.valeurs (
  id text primary key default gen_random_uuid()::text,
  numero text not null default '', nom text not null, texte text not null default ''
);

create table public.partenaires (
  id text primary key default gen_random_uuid()::text,
  type text not null,                      -- financeur | terrain
  nom text not null, logo text not null default '', site text not null default ''
);

create table public.projet (
  id text primary key default gen_random_uuid()::text,
  type text not null,                      -- budget | axe | benefice | amelioration
  titre text not null default '', montant text not null default '',
  description text not null default '', lien text not null default ''
);

create table public.articles (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique, titre text not null,
  categorie text not null default 'Actualité', -- Actualité | Ressource | Publication | Campagne | Événement | Projet
  date_affichee text not null default '', date_publication date,
  resume text not null default '', corps text not null default '',
  image text not null default '', image_alt text not null default '',
  service text, lien_externe text not null default '',
  exemple boolean not null default false   -- affiche la mention « exemple »
);

create table public.lieux_aide (
  id text primary key default gen_random_uuid()::text,
  nom text not null, categorie text not null, adresse text not null default '',
  horaires text not null default '', description text not null default '',
  telephone text not null default '', site text not null default '',
  latitude numeric, longitude numeric,
  a_verifier boolean not null default false
);

create table public.formulaires_champs (
  id text primary key default gen_random_uuid()::text,
  formulaire text not null,                -- contact | benevolat | partenariat
  nom text not null, libelle text not null,
  type text not null default 'texte',      -- texte | texte_long | email | telephone | cases | liste
  choix jsonb not null default '[]'::jsonb,
  obligatoire boolean not null default false, aide text not null default ''
);

-- Colonnes communes, horodatage et garde-fou de publication, sur toutes les tables de contenu
do $$
declare
  t text;
  contenus text[] := array['pages','sections','menu','reglages','numeros_utiles','medias','services','chiffres',
    'graphiques','temoignages','equipe','galerie','reperes','valeurs','partenaires','projet','articles',
    'lieux_aide','formulaires_champs'];
begin
  foreach t in array contenus loop
    execute format('alter table public.%I
      add column publie boolean not null default false,
      add column ordre int not null default 0,
      add column cree_le timestamptz not null default now(),
      add column modifie_le timestamptz not null default now(),
      add column modifie_par uuid references public.profils (id) on delete set null', t);
  end loop;
end $$;

-- Horodatage automatique + la rédaction ne peut pas publier
create or replace function public.avant_ecriture_contenu() returns trigger
  language plpgsql security definer set search_path = '' as
$$
begin
  new.modifie_le := now();
  new.modifie_par := (select auth.uid());
  -- auth.uid() vide = script lancé depuis l'éditeur SQL (import) : pas de garde-fou.
  -- Le public, lui, ne peut de toute façon rien écrire (aucune règle d'écriture pour anon).
  if (select auth.uid()) is not null and not public.est_admin() and new.publie
     and (tg_op = 'INSERT' or not old.publie) then
    raise exception 'Seule l''administration peut publier un contenu.';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Sécurité des contenus (RLS)
--    - public : lit uniquement ce qui est publié
--    - rédaction : lit tout, crée, modifie, dépublie (pas publier, pas supprimer)
--    - administration : tout, y compris publier et supprimer
--    - menu, réglages (dont coordonnées de don), numéros utiles, champs de formulaires :
--      écriture réservée à l'administration
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  contenus text[] := array['pages','sections','menu','reglages','numeros_utiles','medias','services','chiffres',
    'graphiques','temoignages','equipe','galerie','reperes','valeurs','partenaires','projet','articles',
    'lieux_aide','formulaires_champs'];
  reserves text[] := array['menu','reglages','numeros_utiles','formulaires_champs'];
  ecrire text;
begin
  foreach t in array contenus loop
    ecrire := case when t = any (reserves) then 'public.est_admin()' else 'public.est_membre()' end;
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger avant_ecriture before insert or update on public.%I
                    for each row execute function public.avant_ecriture_contenu()', t);
    execute format('create policy "lecture publique des contenus publiés" on public.%I
                    for select to anon using (publie)', t);
    execute format('create policy "lecture par les membres" on public.%I
                    for select to authenticated using (publie or public.est_membre())', t);
    execute format('create policy "création" on public.%I for insert to authenticated with check (%s)', t, ecrire);
    execute format('create policy "modification" on public.%I for update to authenticated using (%s) with check (%s)', t, ecrire, ecrire);
    execute format('create policy "suppression : administration" on public.%I for delete to authenticated using (public.est_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Messages des formulaires — administration uniquement
--    Écrits par la fonction serveur du site (clé de service saisie dans Vercel),
--    jamais lisibles par le public ni par la rédaction.
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  formulaire text not null check (formulaire in ('contact', 'benevolat', 'partenariat')),
  reponses jsonb not null,                 -- nom, e-mail, téléphone, message, etc.
  recu_le timestamptz not null default now(),
  lu boolean not null default false
);
alter table public.messages enable row level security;
create policy "messages : lecture administration" on public.messages for select to authenticated using (public.est_admin());
create policy "messages : marquer lu, administration" on public.messages for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "messages : suppression administration" on public.messages for delete to authenticated using (public.est_admin());
-- Pas de règle d'insertion : seul le serveur (clé de service, hors RLS) enregistre les messages.

-- ---------------------------------------------------------------------
-- 5. Publications et versions (suivi des changements, retour arrière)
-- ---------------------------------------------------------------------
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  le timestamptz not null default now(),
  par uuid references public.profils (id) on delete set null,
  resultat text not null default 'en cours'  -- en cours | réussi | échoué
);

create table public.versions (
  id uuid primary key default gen_random_uuid(),
  table_nom text not null,
  ligne_id text not null,
  donnees jsonb not null,
  publication uuid references public.publications (id) on delete cascade,
  publie_le timestamptz not null default now(),
  par uuid references public.profils (id) on delete set null
);
create index on public.versions (table_nom, ligne_id, publie_le desc);

alter table public.publications enable row level security;
alter table public.versions enable row level security;
create policy "publications : lecture membres" on public.publications for select to authenticated using (public.est_membre());
create policy "versions : lecture membres" on public.versions for select to authenticated using (public.est_membre());
-- Écriture uniquement par la fonction publier_site() ci-dessous.

-- Appelée par l'administration avant la reconstruction du site :
-- garde une copie de chaque contenu publié modifié depuis la dernière publication réussie.
create or replace function public.publier_site() returns uuid
  language plpgsql security definer set search_path = '' as
$$
declare
  t text;
  derniere timestamptz;
  pub uuid;
  contenus text[] := array['pages','sections','menu','reglages','numeros_utiles','medias','services','chiffres',
    'graphiques','temoignages','equipe','galerie','reperes','valeurs','partenaires','projet','articles',
    'lieux_aide','formulaires_champs'];
begin
  if not public.est_admin() then
    raise exception 'Seule l''administration peut publier le site.';
  end if;
  select max(le) into derniere from public.publications where resultat = 'réussi';
  insert into public.publications (par) values ((select auth.uid())) returning id into pub;
  foreach t in array contenus loop
    execute format(
      'insert into public.versions (table_nom, ligne_id, donnees, publication, par)
       select %L, x.id, to_jsonb(x), $1, $2 from public.%I x
       where x.publie and ($3 is null or x.modifie_le > $3)', t, t)
    using pub, (select auth.uid()), derniere;
  end loop;
  return pub;
end $$;
revoke all on function public.publier_site() from public, anon;
grant execute on function public.publier_site() to authenticated;

-- Le serveur du site met à jour le résultat après la reconstruction Vercel.
create or replace function public.resultat_publication(p uuid, r text) returns void
  language sql security definer set search_path = '' as
$$ update public.publications set resultat = r where id = p and public.est_admin() $$;
revoke all on function public.resultat_publication(uuid, text) from public, anon;
grant execute on function public.resultat_publication(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Durées de conservation (validées le 14/11/2026) — tâche quotidienne à 3h
-- ---------------------------------------------------------------------
create or replace function public.nettoyage_conservation() returns void
  language sql security definer set search_path = '' as
$$
  delete from public.messages
   where (formulaire = 'contact' and recu_le < now() - interval '12 months')
      or (formulaire in ('benevolat', 'partenariat') and recu_le < now() - interval '24 months');
  delete from public.versions where publie_le < now() - interval '24 months';
  delete from public.versions v
   using (select id, row_number() over (partition by table_nom, ligne_id order by publie_le desc) as rang
            from public.versions) r
   where v.id = r.id and r.rang > 20;
$$;
revoke all on function public.nettoyage_conservation() from public, anon, authenticated;

select cron.schedule('nettoyage-conservation', '0 3 * * *', $$ select public.nettoyage_conservation() $$);

-- ---------------------------------------------------------------------
-- 7. Stockage des images : lecture publique, envoi par les membres, suppression par l'administration
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('medias', 'medias', true)
  on conflict (id) do nothing;
create policy "medias : envoi par les membres" on storage.objects for insert to authenticated
  with check (bucket_id = 'medias' and public.est_membre());
create policy "medias : remplacement par les membres" on storage.objects for update to authenticated
  using (bucket_id = 'medias' and public.est_membre());
create policy "medias : suppression par l'administration" on storage.objects for delete to authenticated
  using (bucket_id = 'medias' and public.est_admin());
