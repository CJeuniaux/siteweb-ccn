-- Lot du 18/11/2026 (suite) : logos Ville de Charleroi, CPAS de Charleroi, Entre 2 Wallonie. Aucune suppression.
begin;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie, type_visuel) values ('m-logo-ville-charleroi', 'logo-ville-charleroi.png', 'Ville de Charleroi', '', 237, 303, 36, true, 'photo') on conflict (id) do update set fichier = excluded.fichier, alt = excluded.alt, largeur = excluded.largeur, hauteur = excluded.hauteur, type_visuel = excluded.type_visuel;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie, type_visuel) values ('m-logo-cpas', 'logo-cpas-charleroi.png', 'CPAS de Charleroi', '', 240, 240, 37, true, 'photo') on conflict (id) do update set fichier = excluded.fichier, alt = excluded.alt, largeur = excluded.largeur, hauteur = excluded.hauteur, type_visuel = excluded.type_visuel;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie, type_visuel) values ('m-logo-entre2', 'logo-entre2-wallonie.png', 'Entre 2 Wallonie', '', 408, 300, 38, true, 'photo') on conflict (id) do update set fichier = excluded.fichier, alt = excluded.alt, largeur = excluded.largeur, hauteur = excluded.hauteur, type_visuel = excluded.type_visuel;
update public.partenaires set logo = 'm-logo-ville-charleroi' where id = 'pa-ville';
update public.partenaires set logo = 'm-logo-cpas' where id = 'pa-cpas';
update public.partenaires set logo = 'm-logo-entre2' where id = 'pa-entre2';
commit;
select id, nom, logo from public.partenaires order by type, ordre;
