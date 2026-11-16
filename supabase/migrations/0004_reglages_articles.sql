-- Libellés communs des articles, modifiables dans les réglages (lot 3, 14/11/2026).
-- À lancer AVANT de relancer 0002 (qui contient ces colonnes).
alter table public.reglages
  add column if not exists article_accroche text not null default '',
  add column if not exists article_retour text not null default '',
  add column if not exists article_lire_aussi text not null default '',
  add column if not exists article_lire text not null default '',
  add column if not exists article_lire_carte text not null default '',
  add column if not exists article_mention_exemple text not null default '',
  add column if not exists article_texte_exemple text not null default '';

-- La fiche de réglages existe déjà : on remplit les nouveaux champs (sans toucher aux autres)
update public.reglages set
  article_accroche = 'Comprendre, échanger, s’inspirer',
  article_retour = 'Toutes les actualités',
  article_lire_aussi = 'À lire aussi',
  article_lire = 'Lire',
  article_lire_carte = 'Lire l’article',
  article_mention_exemple = 'Exemple',
  article_texte_exemple = 'Article d’exemple : le texte complet sera publié prochainement.'
where id = 'general' and article_retour = '';
