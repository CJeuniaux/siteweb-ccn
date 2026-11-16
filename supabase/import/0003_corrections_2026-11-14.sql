-- Corrections demandées par Charlotte le 14/11/2026, sur les contenus déjà importés (0002).
-- Les mêmes corrections sont faites dans donnees/initiales/ (source de 0002).
begin;

-- 1. Équipe : Julien Moreau et Awa Traoré ne font pas partie de l'équipe réelle → non publiés
update public.equipe set publie = false where id in ('e-moreau', 'e-traore');

-- 2. Sophie Crapez est directrice
update public.services set contact = 'Sophie Crapez, Directrice' where id = 'parent-elles';

-- 3. Une seule graphie : « Parent’Elle » (apostrophe courbe, sans s). L'adresse /services/parent-elles ne change pas.
update public.services set nom = regexp_replace(nom, 'Parent[''’]Elles?', 'Parent’Elle', 'g'),
                           photo_alt = regexp_replace(photo_alt, 'Parent[''’]Elles?', 'Parent’Elle', 'g')
 where nom ~ 'Parent[''’]Elle' or photo_alt ~ 'Parent[''’]Elle';
update public.menu set libelle = regexp_replace(libelle, 'Parent[''’]Elles?', 'Parent’Elle', 'g')
 where libelle ~ 'Parent[''’]Elle';
update public.sections set contenu = regexp_replace(contenu::text, 'Parent[''’]Elles?', 'Parent’Elle', 'g')::jsonb
 where contenu::text ~ 'Parent[''’]Elle';
update public.temoignages set texte = regexp_replace(texte, 'Parent[''’]Elles?', 'Parent’Elle', 'g')
 where texte ~ 'Parent[''’]Elle';

-- 4. Promotion de la santé : la section ps-1 répétait le chapo → supprimée (le chapo est gardé)
delete from public.sections where id = 'ps-1';

commit;

-- Contrôle : doit afficher 0 partout
select (select count(*) from public.equipe where publie and id in ('e-moreau', 'e-traore')) as equipe_a_retirer,
       (select count(*) from public.services where id = 'parent-elles' and contact <> 'Sophie Crapez, Directrice') as contact_a_corriger,
       (select count(*) from public.sections where id = 'ps-1') as doublon,
       (select count(*) from (
          select nom || photo_alt as t from public.services
          union all select libelle from public.menu
          union all select contenu::text from public.sections
          union all select texte from public.temoignages) x
        where t ~ 'Parent''Elle|Parent’Elles|Parent''Elles') as ancienne_graphie;
