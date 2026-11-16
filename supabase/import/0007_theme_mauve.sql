-- Changement de charte (14/11/2026) : Promotion de la santé devient un service comme les autres,
-- couleur mauve #9279B6. Le bleu nuit reste la couleur de structure du site.
update public.services set theme = 'mauve' where id = 'promotion-sante' and theme = 'nuit';

-- Contrôle : doit afficher mauve
select theme from public.services where id = 'promotion-sante';
