-- Lot du 23/11/2026 : logos Wallonie social SPW et Agence FSE. Aucune suppression.
begin;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie, type_visuel) values ('m-logo-fse', 'logo-fse.png', 'Agence FSE, Fonds social européen — cofinancé par l’Union européenne', '', 383, 131, 39, true, 'photo') on conflict (id) do update set fichier = excluded.fichier, alt = excluded.alt, largeur = excluded.largeur, hauteur = excluded.hauteur, type_visuel = excluded.type_visuel;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie, type_visuel) values ('m-logo-spw', 'logo-spw-social.png', 'Wallonie social SPW', '', 809, 400, 40, true, 'photo') on conflict (id) do update set fichier = excluded.fichier, alt = excluded.alt, largeur = excluded.largeur, hauteur = excluded.hauteur, type_visuel = excluded.type_visuel;
update public.partenaires set logo = 'm-logo-spw' where id = 'pa-spw';
update public.partenaires set logo = 'm-logo-fse' where id = 'pa-fse';
commit;
select id, nom, logo from public.partenaires order by type, ordre;
