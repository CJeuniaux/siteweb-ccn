-- 0005 — Lieux d'aide : statut de vérification interne (jamais affiché au public) et coordonnées de Comme Chez Nous
-- lues dans les réglages. Non destructif : l'ancienne colonne a_verifier est conservée jusqu'à validation, puis supprimable.
-- À APPLIQUER dans Supabase avant de basculer le site sur la base (pas encore appliqué).
alter table public.lieux_aide
  add column if not exists statut_verification text not null default 'a_verifier'
    check (statut_verification in ('a_verifier', 'verifie')),
  add column if not exists date_verification date,
  add column if not exists coordonnees_ccn boolean not null default false;
update public.lieux_aide set statut_verification = case when a_verifier then 'a_verifier' else 'verifie' end;
update public.lieux_aide set coordonnees_ccn = true where id in ('l-rebond', 'l-parentelle', 'l-cheztoit', 'l-toudi');
