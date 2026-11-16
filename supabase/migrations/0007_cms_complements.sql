-- 0007 — Colonnes ajoutées au site depuis l'import du 14/11/2026 (non destructif, relançable).
-- À APPLIQUER dans Supabase (éditeur SQL) avant la synchronisation des contenus. Pas encore appliqué.
alter table public.medias
  add column if not exists type_visuel text not null default ''
    check (type_visuel in ('', 'detoure', 'photo', 'composite', 'dessin'));
comment on column public.medias.type_visuel is 'detoure = PNG/WebP transparent (le site ajoute trait et fondu) ; photo = avec fond ; composite = ancien aplat incrusté ; dessin = SVG. Vide : deviné (SVG = dessin, sinon composite).';
alter table public.reglages
  add column if not exists credit_lien text not null default '',
  add column if not exists credit_libelle text not null default '',
  add column if not exists credit_logo text not null default '';

-- Comptes : l'e-mail est recopié dans le profil (affichage dans l'administration).
alter table public.profils add column if not exists email text not null default '';
update public.profils p set email = u.email from auth.users u where u.id = p.id and p.email = '';

-- Un compte invité par l'administration (Supabase → Authentication → Invite user ; les inscriptions libres sont fermées)
-- reçoit automatiquement un profil « rédaction ». L'administration peut ensuite changer son rôle dans l'admin du site.
create or replace function public.nouveau_compte() returns trigger
  language plpgsql security definer set search_path = '' as
$$
begin
  insert into public.profils (id, nom, role, email) values (new.id, '', 'redaction', coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists nouveau_compte on auth.users;
create trigger nouveau_compte after insert on auth.users for each row execute function public.nouveau_compte();

-- Fin d'une publication du site : l'administration note le résultat de la reconstruction (réussi | échoué).
create or replace function public.terminer_publication(pub uuid, res text) returns void
  language plpgsql security definer set search_path = '' as
$$
begin
  if not public.est_admin() then raise exception 'Seule l''administration peut publier le site.'; end if;
  if res not in ('réussi', 'échoué') then raise exception 'Résultat inconnu.'; end if;
  update public.publications set resultat = res where id = pub;
end $$;
revoke all on function public.terminer_publication(uuid, text) from public, anon;
grant execute on function public.terminer_publication(uuid, text) to authenticated;
