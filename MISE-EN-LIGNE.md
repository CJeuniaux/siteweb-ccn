# Mise en ligne — ce qu'il faut faire, dans l'ordre

## Le point décisif

Le site est **fabriqué à partir du CMS**, pas lu en direct. Quand quelqu'un modifie un
contenu dans l'administration, le site doit être refabriqué pour que le changement
apparaisse. C'est le rôle du bouton **« Publier le site »** dans l'administration.

Ce bouton appelle l'API de Vercel (`src/pages/api/publier.ts`). **Il ne fonctionne que
si le site est hébergé chez Vercel.**

Conséquence : si le site est déplacé sur Infomaniak, l'association ne peut plus publier
ses contenus elle-même — il faut quelqu'un qui refabrique et renvoie le site à chaque
modification.

C'est pourquoi la recommandation ci-dessous garde le site chez Vercel et n'utilise
Infomaniak que pour le domaine. Ton offre Infomaniak permet Node.js, donc l'autre voie
est techniquement possible — mais elle coûte cette autonomie-là.

---

## Étape 1 — La page d'attente sur le domaine

Fichiers : `maintenance/index.html` et `maintenance/logo.svg`. Rien d'autre, aucun build.

1. Dans Infomaniak, ouvrir le gestionnaire de fichiers de l'hébergement (ou un FTP).
2. Déposer les **deux** fichiers à la racine du site (souvent `/web` ou `/sites/...`).
3. Vérifier que `index.html` est bien le fichier d'accueil.

Puis faire pointer `asblcommecheznous.com` vers cet hébergement Infomaniak.

> **Attention** : à ce moment-là, le site Lovable actuel **disparaît** de l'adresse
> publique et est remplacé par la page d'attente. C'est voulu, mais c'est irréversible
> le temps que la propagation DNS se fasse (quelques heures).

## Étape 2 — Le CRM sur son sous-domaine

Le CRM reste hébergé chez Lovable : il n'y a qu'un pointage à faire.

Dans la zone DNS du domaine chez Infomaniak, ajouter un enregistrement :

```
Type : CNAME
Nom  : crm
Cible : (l'adresse que Lovable indique pour un domaine personnalisé)
```

L'adresse cible se trouve dans Lovable, dans les réglages du projet, section domaine
personnalisé. Il faut aussi y **déclarer** `crm.asblcommecheznous.com`, sinon Lovable
refusera les requêtes.

## Étape 3 — Le site, quand il est validé

Une fois le site approuvé, on bascule la racine du domaine de la page d'attente vers
Vercel.

1. Dans Vercel, projet `comme-chez-nous` → Settings → Domains → ajouter
   `asblcommecheznous.com` et `www.asblcommecheznous.com`.
2. Vercel affiche les enregistrements exacts à créer. En général :

```
Type : A      Nom : @     Valeur : 76.76.21.21
Type : CNAME  Nom : www   Valeur : cname.vercel-dns.com
```

3. Les saisir dans la zone DNS Infomaniak, à la place de ceux qui pointent vers
   l'hébergement.
4. Attendre la propagation, puis vérifier que le certificat HTTPS est bien délivré.

À ce moment-là, retirer la page d'attente de l'hébergement Infomaniak pour éviter toute
confusion.

## Étape 4 — Avant la bascule, à ne pas oublier

- **Retirer le `noindex`.** Le site est actuellement marqué « ne pas référencer »
  (`VERSION_TRAVAIL` dans `src/lib/etat.ts`, et l'en-tête `X-Robots-Tag` dans
  `vercel.json`). Tant qu'il est là, Google ignore le site.
- **Vérifier les variables d'environnement** dans Vercel : `PUBLIC_SUPABASE_URL`,
  `PUBLIC_SUPABASE_ANON_KEY`, et `VERCEL_TOKEN` pour que le bouton « Publier » marche.
- **Exécuter le SQL en attente** dans Supabase (lien Contact dans le menu, photo de
  Promotion de la santé, suppression du sous-menu) — sinon ces corrections n'apparaîtront
  pas en production.

## Si tu préfères malgré tout héberger chez Infomaniak

C'est possible puisque tu as Node.js. Il faudrait :

1. remplacer l'adaptateur Vercel par `@astrojs/node` dans `astro.config.mjs` ;
2. construire le site, envoyer `dist/` et `package.json` sur le serveur ;
3. y installer les dépendances et lancer le serveur Node en service permanent ;
4. saisir les variables d'environnement côté Infomaniak ;
5. **remplacer le bouton « Publier »** par une autre mécanique (par exemple une tâche
   planifiée qui refabrique le site toutes les nuits), faute de quoi l'association ne
   peut plus mettre son site à jour.

Compter une demi-journée, et une maintenance récurrente ensuite.
