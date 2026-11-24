-- Lot du 24/11/2026 : composition « Cinq services complémentaires » sur l'accueil et sur Nos services. Aucune suppression.
begin;
update public.sections set contenu = jsonb_build_object('titre', E'Cinq services\ncomplémentaires', 'accroche', 'Un même objectif :', 'intro', 'accompagner chaque personne vers plus de stabilité, d’autonomie et de bien-être.') where id = 'ac-3';
update public.sections set ordre = ordre + 1 where page = '/services' and id in ('sv-2','sv-3','sv-4','sv-5') and not exists (select 1 from public.sections where id = 'sv-6');
insert into public.sections (id, page, type, ordre, publie, contenu) values ('sv-6', '/services', 'grille_services', 2, true, jsonb_build_object('titre', E'Cinq services\ncomplémentaires', 'accroche', 'Un même objectif :', 'intro', 'accompagner chaque personne vers plus de stabilité, d’autonomie et de bien-être.')) on conflict (id) do update set contenu = excluded.contenu, ordre = excluded.ordre, type = excluded.type, page = excluded.page;
commit;
select id, page, type, ordre, contenu->>'titre' as titre from public.sections where page in ('/services','/accueil') order by page, ordre;
