-- Lot 4 (médiathèque), 14/11/2026. Les 17 fichiers sont déjà dans l’espace de stockage « medias ».
-- 1) crée les 17 fiches ; 2) remplace les adresses des contenus déjà importés. Relançable sans effet.
begin;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-asso-equipe', 'asso-equipe.webp', 'L’accueil de Comme Chez Nous à Charleroi', '', 1480, 923, 1, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-chez-toit-cles', 'chez-toit-cles.webp', 'Le service Chez Toît', '', 1480, 930, 2, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-don-mains', 'don-mains.webp', 'Une poignée de main', '', 1414, 968, 3, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-hero-immeuble', 'hero-immeuble.webp', '', '', 1024, 869, 4, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-hero-rebond', 'hero-rebond.webp', 'Portrait d’un homme souriant, bonnet de laine, regard tourné vers le haut', '', 1024, 866, 5, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-logo', 'logo.svg', '', '', 1126, 1071, 6, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-parent-elle-jeu', 'parent-elle-jeu.webp', 'Le service Parent’Elle', '', 1480, 920, 7, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-picto-chez-toit', 'picto-chez-toit.svg', '', '', 1112, 738, 8, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-picto-parent-elle', 'picto-parent-elle.svg', '', '', 1137, 643, 9, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-picto-rebond', 'picto-rebond.svg', '', '', 1075, 610, 10, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-picto-toudi-boudji', 'picto-toudi-boudji.svg', '', '', 1151, 574, 11, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-rebond-repas', 'rebond-repas.webp', 'Un repas partagé au Rebond', '', 1480, 925, 12, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-service-chez-toit', 'service-chez-toit.webp', 'Façade en briques d’une maison de Chez Toît', '', 1147, 968, 13, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-service-parent-elle', 'service-parent-elle.webp', 'Une mère et sa fille accompagnées par Parent’Elle, souriantes', '', 1426, 968, 14, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-service-rebond', 'service-rebond.webp', 'Trois hommes rient autour d’un café au Rebond', '', 1135, 928, 15, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-service-toudi-boudji', 'service-toudi-boudji.webp', 'Trois hommes de dos, bras sur les épaules', '', 1422, 968, 16, true) on conflict (id) do nothing;
insert into public.medias (id, fichier, alt, credit, largeur, hauteur, ordre, publie) values ('m-toudi-boudji-atelier', 'toudi-boudji-atelier.webp', 'Le service Toudi Boudji', '', 1480, 525, 17, true) on conflict (id) do nothing;

-- Remplace les adresses /img/… des contenus déjà importés par la référence de la fiche (ex. /img/service-rebond.webp → m-service-rebond).
-- Les taches de pinceau (/img/pinceau-…) restent dans le code et ne sont pas touchées.
update public.services
   set picto = regexp_replace(picto, '^/img/([a-z0-9-]+)\.(webp|svg)$', 'm-\1'),
       photo = regexp_replace(photo, '^/img/([a-z0-9-]+)\.(webp|svg)$', 'm-\1')
 where picto ~ '^/img/' or photo ~ '^/img/';

update public.reglages
   set logo = regexp_replace(logo, '^/img/([a-z0-9-]+)\.(webp|svg)$', 'm-\1'),
       don_image = regexp_replace(don_image, '^/img/([a-z0-9-]+)\.(webp|svg)$', 'm-\1')
 where logo ~ '^/img/' or don_image ~ '^/img/';

update public.sections
   set contenu = regexp_replace(contenu::text, '"/img/((?!pinceau-)[a-z0-9-]+)\.(webp|svg)"', '"m-\1"', 'g')::jsonb
 where contenu::text ~ '"/img/(?!pinceau-)';

commit;

-- Contrôle : doit afficher 17 et 0
select (select count(*) from public.medias) as fiches,
       (select count(*) from (
          select picto || ' ' || photo as t from public.services
          union all select logo || ' ' || don_image from public.reglages
          union all select contenu::text from public.sections) x
        where t ~ '/img/(?!pinceau-)') as adresses_restantes;
