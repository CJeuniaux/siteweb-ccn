-- Lot du 24/11/2026 : palette définitive. Toudi Boudji vert, Promotion de la santé jaune. Aucune suppression.
begin;
update public.services set theme = 'vert' where slug = 'toudi-boudji';
update public.services set theme = 'jaune' where slug = 'promotion-sante';
commit;
select slug, theme from public.services order by slug;
