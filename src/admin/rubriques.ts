// Description des rubriques de l'administration : tables, champs, libellés et aides.
// L'éditeur est générique : un champ non décrit ici est quand même affiché (type deviné à partir de sa valeur).
// La mise en page du site reste dans le code ; ici on ne décrit que les contenus.

export type TypeChamp = 'texte' | 'texte_long' | 'html' | 'nombre' | 'booleen' | 'choix' | 'media' | 'service' | 'date'
  | 'lien' | 'couleur' | 'liste_textes' | 'liste_objets' | 'contenu' | 'lecture' | 'menu_parent';
export interface Champ {
  nom: string; libelle?: string; type?: TypeChamp; aide?: string; choix?: string[] | [string, string][];
  obligatoire?: boolean; sousChamps?: Champ[]; largeur?: 'demi';
}
export interface Rubrique {
  cle: string; table: string; titre: string; groupe: string; description?: string;
  /** écriture réservée à l'administration (la base l'impose aussi) */
  admin?: boolean;
  champTitre: string; champSousTitre?: string; champs: Champ[];
  /** une seule ligne (réglages) */
  unique?: string;
  filtres?: { champ: string; libelle: string }[];
}

export const COULEURS: [string, string][] = [['rouge', 'Rouge (Le Rebond)'], ['bleu', 'Bleu (Chez Toît)'], ['jaune', 'Jaune (Parent’Elle)'], ['vert', 'Vert (Toudi Boudji)'], ['mauve', 'Mauve (Promotion de la santé)'], ['nuit', 'Encre (sans couleur)']];

export const RUBRIQUES: Rubrique[] = [
  {
    cle: 'articles', table: 'articles', titre: 'Articles', groupe: 'Contenus', champTitre: 'titre', champSousTitre: 'categorie',
    description: 'Actualités, publications, projets et événements (page « Actualités & ressources »).', filtres: [{ champ: 'categorie', libelle: 'Catégorie' }],
    champs: [
      { nom: 'titre', libelle: 'Titre', obligatoire: true },
      { nom: 'slug', libelle: 'Adresse de la page', aide: 'Fin de l’adresse : /actualites/… (minuscules, tirets, sans accent). Remplie automatiquement à partir du titre.' },
      { nom: 'categorie', libelle: 'Catégorie', type: 'choix', choix: ['Actualité', 'Ressource', 'Publication', 'Campagne', 'Événement', 'Projet'], largeur: 'demi' },
      { nom: 'date_affichee', libelle: 'Date affichée', aide: 'Telle qu’elle apparaît, ex. « 10 novembre 2026 » ou « 2024 ».', largeur: 'demi' },
      { nom: 'date_publication', libelle: 'Date de publication (tri)', type: 'date', largeur: 'demi' },
      { nom: 'service', libelle: 'Service lié', type: 'service', largeur: 'demi' },
      { nom: 'resume', libelle: 'Résumé', type: 'texte_long', aide: 'Deux phrases maximum. Affiché sur la carte et sous le titre.' },
      { nom: 'corps', libelle: 'Texte de l’article', type: 'html' },
      { nom: 'image', libelle: 'Photo', type: 'media', aide: 'Fournissez la photo telle quelle : le site la passe en noir et blanc et ajoute le trait.' },
      { nom: 'image_alt', libelle: 'Description de la photo (pour les personnes aveugles)' },
      { nom: 'lien_externe', libelle: 'Lien externe', type: 'lien', aide: 'Si rempli, la carte mène vers ce lien au lieu d’une page d’article.' },
      { nom: 'exemple', libelle: 'Article d’exemple (affiche la mention « Exemple »)', type: 'booleen' },
    ],
  },
  {
    cle: 'services', table: 'services', titre: 'Services', groupe: 'Contenus', champTitre: 'nom', champSousTitre: 'sous_titre',
    description: 'Les cinq services : nom, couleur, accroche, horaires. Les blocs de chaque page se modifient dans « Pages ».',
    champs: [
      { nom: 'nom', libelle: 'Nom', obligatoire: true, largeur: 'demi' },
      { nom: 'slug', libelle: 'Adresse de la page', aide: '/services/… — à ne changer qu’avec une redirection.', largeur: 'demi' },
      { nom: 'theme', libelle: 'Couleur', type: 'couleur', largeur: 'demi' },
      { nom: 'picto', libelle: 'Pictogramme', type: 'media', aide: 'Les 4 pictogrammes du logo viennent du logo officiel et ne se remplacent pas ici. Pour un autre service, choisissez un SVG ; vide = pictogramme provisoire.', largeur: 'demi' },
      { nom: 'sous_titre', libelle: 'Sous-titre (cartes)' },
      { nom: 'accroche', libelle: 'Accroche' },
      { nom: 'chapo', libelle: 'Chapeau', type: 'texte_long' },
      { nom: 'photo', libelle: 'Photo d’en-tête', type: 'media', largeur: 'demi' },
      { nom: 'photo_alt', libelle: 'Description de la photo', largeur: 'demi' },
      { nom: 'horaires', libelle: 'Horaires', type: 'liste_objets', sousChamps: [{ nom: 'jours', libelle: 'Jours' }, { nom: 'heures', libelle: 'Heures' }] },
      { nom: 'telephone', libelle: 'Téléphone propre au service', aide: 'Laisser vide : le numéro des réglages est utilisé (recommandé).', largeur: 'demi' },
      { nom: 'contact', libelle: 'Personne de contact', largeur: 'demi' },
      { nom: 'ariane', libelle: 'Fil d’Ariane', largeur: 'demi' },
      { nom: 'description_seo', libelle: 'Description pour les moteurs de recherche', type: 'texte_long', aide: 'Environ 150 caractères.' },
      { nom: 'transversal', libelle: 'Service transversal', type: 'booleen' },
      { nom: 'bloc_transversal_sur', libelle: 'Bloc transversal : surtitre' },
      { nom: 'bloc_transversal_texte', libelle: 'Bloc transversal : texte', type: 'texte_long' },
      { nom: 'bloc_transversal_bouton', libelle: 'Bloc transversal : bouton' },
      { nom: 'rotation', type: 'lecture' },
    ],
  },
  { cle: 'chiffres', table: 'chiffres', titre: 'Chiffres clés', groupe: 'Données', champTitre: 'valeur', champSousTitre: 'libelle', filtres: [{ champ: 'contexte', libelle: 'Où' }, { champ: 'service', libelle: 'Service' }],
    champs: [
      { nom: 'valeur', libelle: 'Chiffre', obligatoire: true, largeur: 'demi', aide: 'Tel qu’affiché, ex. « 1 566 » ou « > 85 % ».' },
      { nom: 'annee', libelle: 'Année', largeur: 'demi', aide: 'Masquée automatiquement si le titre du bloc la donne déjà.' },
      { nom: 'libelle', libelle: 'Légende', obligatoire: true },
      { nom: 'contexte', libelle: 'Où l’afficher', type: 'choix', choix: [['accueil', 'Accueil'], ['association', 'L’association'], ['service', 'Page d’un service']], largeur: 'demi' },
      { nom: 'service', libelle: 'Service', type: 'service', largeur: 'demi' },
    ] },
  { cle: 'graphiques', table: 'graphiques', titre: 'Graphiques', groupe: 'Données', champTitre: 'libelle', champSousTitre: 'graphique', filtres: [{ champ: 'service', libelle: 'Service' }, { champ: 'graphique', libelle: 'Graphique' }],
    champs: [
      { nom: 'service', libelle: 'Service', type: 'service', largeur: 'demi' },
      { nom: 'graphique', libelle: 'Nom du graphique', aide: 'Les barres qui portent le même nom forment un graphique.', largeur: 'demi' },
      { nom: 'libelle', libelle: 'Libellé de la barre', largeur: 'demi' },
      { nom: 'valeur', libelle: 'Valeur', type: 'nombre', largeur: 'demi' },
    ] },
  { cle: 'temoignages', table: 'temoignages', titre: 'Témoignages', groupe: 'Données', champTitre: 'auteur', champSousTitre: 'texte',
    champs: [{ nom: 'texte', libelle: 'Témoignage', type: 'texte_long', obligatoire: true }, { nom: 'auteur', libelle: 'Qui parle', aide: 'Prénom d’emprunt par défaut, avec l’accord de la personne.' }, { nom: 'service', libelle: 'Service', type: 'service' }] },
  { cle: 'equipe', table: 'equipe', titre: 'Équipe', groupe: 'Données', champTitre: 'nom', champSousTitre: 'fonction',
    champs: [{ nom: 'nom', libelle: 'Nom', obligatoire: true, largeur: 'demi' }, { nom: 'fonction', libelle: 'Fonction', largeur: 'demi' }, { nom: 'photo', libelle: 'Portrait', type: 'media', aide: 'Avec l’accord écrit de la personne.', largeur: 'demi' }, { nom: 'photo_alt', libelle: 'Description du portrait', largeur: 'demi' }] },
  { cle: 'reperes', table: 'reperes', titre: 'Repères (histoire)', groupe: 'Données', champTitre: 'annee', champSousTitre: 'texte',
    champs: [{ nom: 'annee', libelle: 'Année', largeur: 'demi' }, { nom: 'texte', libelle: 'Texte', type: 'texte_long' }] },
  { cle: 'valeurs', table: 'valeurs', titre: 'Valeurs', groupe: 'Données', champTitre: 'nom', champSousTitre: 'texte',
    champs: [{ nom: 'numero', libelle: 'Numéro', largeur: 'demi' }, { nom: 'nom', libelle: 'Valeur', largeur: 'demi' }, { nom: 'texte', libelle: 'Texte', type: 'texte_long' }] },
  { cle: 'partenaires', table: 'partenaires', titre: 'Partenaires', groupe: 'Données', champTitre: 'nom', champSousTitre: 'type', filtres: [{ champ: 'type', libelle: 'Type' }],
    champs: [
      { nom: 'nom', libelle: 'Nom', obligatoire: true },
      { nom: 'type', libelle: 'Type', type: 'choix', choix: [['financeur', 'Financeur'], ['terrain', 'Partenaire de terrain']], largeur: 'demi' },
      { nom: 'site', libelle: 'Site internet', type: 'lien', largeur: 'demi' },
      { nom: 'logo', libelle: 'Logo', type: 'media', aide: 'De préférence en SVG ou PNG transparent. Le logo devient cliquable vers le site.' },
    ] },
  { cle: 'projet', table: 'projet', titre: 'Projet immobilier', groupe: 'Données', champTitre: 'titre', champSousTitre: 'type', filtres: [{ champ: 'type', libelle: 'Type' }],
    champs: [{ nom: 'type', libelle: 'Type', type: 'choix', choix: ['budget', 'axe', 'benefice', 'amelioration'], largeur: 'demi' }, { nom: 'montant', libelle: 'Montant', largeur: 'demi' }, { nom: 'titre', libelle: 'Titre' }, { nom: 'description', libelle: 'Description', type: 'texte_long' }, { nom: 'lien', libelle: 'Lien', type: 'lien' }] },
  {
    cle: 'lieux_aide', table: 'lieux_aide', titre: 'Lieux d’aide (carte)', groupe: 'Données', champTitre: 'nom', champSousTitre: 'categorie', filtres: [{ champ: 'categorie', libelle: 'Catégorie' }, { champ: 'statut_verification', libelle: 'Vérification' }],
    champs: [
      { nom: 'nom', libelle: 'Nom', obligatoire: true },
      { nom: 'categorie', libelle: 'Catégorie', aide: 'Les lieux d’une même catégorie sont regroupés sur la carte.', largeur: 'demi' },
      { nom: 'coordonnees_ccn', libelle: 'Lieu de Comme Chez Nous (adresse et téléphone repris des réglages)', type: 'booleen' },
      { nom: 'adresse', libelle: 'Adresse', largeur: 'demi' },
      { nom: 'telephone', libelle: 'Téléphone', largeur: 'demi' },
      { nom: 'horaires', libelle: 'Horaires' },
      { nom: 'description', libelle: 'Description' },
      { nom: 'site', libelle: 'Site internet', type: 'lien' },
      { nom: 'latitude', libelle: 'Position sur la carte', type: 'nombre', aide: 'Cliquez sur la carte pour placer le point.' },
      { nom: 'longitude', type: 'nombre' },
      { nom: 'statut_verification', libelle: 'Vérification (interne, jamais affiché)', type: 'choix', choix: [['a_verifier', 'À vérifier'], ['verifie', 'Vérifié']], largeur: 'demi' },
      { nom: 'date_verification', libelle: 'Date de vérification', type: 'date', largeur: 'demi' },
      { nom: 'a_verifier', type: 'lecture' },
    ],
  },
  { cle: 'numeros_utiles', table: 'numeros_utiles', titre: 'Numéros d’urgence', groupe: 'Structure', admin: true, champTitre: 'libelle', champSousTitre: 'numero', filtres: [{ champ: 'emplacement', libelle: 'Où' }],
    champs: [
      { nom: 'emplacement', libelle: 'Où', type: 'choix', choix: [['bandeau', 'Bandeau du haut + accueil'], ['aide', 'Page d’aide']], largeur: 'demi' },
      { nom: 'libelle', libelle: 'Libellé', largeur: 'demi' },
      { nom: 'numero', libelle: 'Numéro affiché', largeur: 'demi' },
      { nom: 'tel', libelle: 'Numéro à composer', aide: 'Chiffres seulement, ex. 071202310 ou +3271202310.', largeur: 'demi' },
      { nom: 'precision', libelle: 'Précision' },
    ] },
  { cle: 'menu', table: 'menu', titre: 'Menus', groupe: 'Structure', admin: true, description: 'Menu principal, boutons de l’en-tête et liens du pied de page.', champTitre: 'libelle', champSousTitre: 'lien', filtres: [{ champ: 'emplacement', libelle: 'Menu' }],
    champs: [
      { nom: 'emplacement', libelle: 'Menu', type: 'choix', choix: [['principal', 'Menu principal'], ['boutons', 'Boutons de l’en-tête'], ['pied_services', 'Pied de page : services'], ['pied_pratique', 'Pied de page : en pratique']], largeur: 'demi' },
      { nom: 'parent', libelle: 'Sous-menu de', type: 'menu_parent', largeur: 'demi' },
      { nom: 'libelle', libelle: 'Libellé', largeur: 'demi' },
      { nom: 'lien', libelle: 'Lien', type: 'lien', largeur: 'demi' },
      { nom: 'style', libelle: 'Style (boutons)', type: 'choix', choix: [['', '—'], ['plein', 'Plein'], ['contour', 'Contour']], largeur: 'demi' },
      { nom: 'icone', libelle: 'Icône', type: 'choix', choix: [['', 'Aucune'], ['coeur', 'Cœur'], ['fleche', 'Flèche']], largeur: 'demi' },
    ] },
  { cle: 'formulaires_champs', table: 'formulaires_champs', titre: 'Champs des formulaires', groupe: 'Structure', admin: true, champTitre: 'libelle', champSousTitre: 'formulaire', filtres: [{ champ: 'formulaire', libelle: 'Formulaire' }],
    champs: [
      { nom: 'formulaire', libelle: 'Formulaire', type: 'choix', choix: [['contact', 'Contact'], ['benevolat', 'Bénévolat'], ['partenariat', 'Partenariat']], largeur: 'demi' },
      { nom: 'nom', libelle: 'Nom technique', aide: 'Sans espace ni accent. Ne pas changer un champ existant.', largeur: 'demi' },
      { nom: 'libelle', libelle: 'Libellé' },
      { nom: 'type', libelle: 'Type', type: 'choix', choix: [['texte', 'Texte court'], ['texte_long', 'Texte long'], ['email', 'E-mail'], ['telephone', 'Téléphone'], ['cases', 'Cases à cocher']], largeur: 'demi' },
      { nom: 'obligatoire', libelle: 'Obligatoire', type: 'booleen', largeur: 'demi' },
      { nom: 'choix', libelle: 'Choix (cases à cocher)', type: 'liste_textes' },
      { nom: 'aide', libelle: 'Aide sous le champ' },
    ] },
  { cle: 'reglages', table: 'reglages', titre: 'Réglages', groupe: 'Structure', admin: true, unique: 'general', champTitre: 'nom',
    description: 'Coordonnées de l’association (réutilisées partout), textes communs, don.',
    champs: [
      { nom: 'nom', libelle: 'Nom de l’association', largeur: 'demi' }, { nom: 'sous_nom', libelle: 'Sous le nom', largeur: 'demi' },
      { nom: 'adresse_ligne1', libelle: 'Adresse (rue et numéro)', largeur: 'demi' }, { nom: 'adresse_ligne2', libelle: 'Code postal et ville', largeur: 'demi' },
      { nom: 'telephone', libelle: 'Téléphone', largeur: 'demi' }, { nom: 'email', libelle: 'E-mail', largeur: 'demi' },
      { nom: 'slogan', libelle: 'Slogan (pied de page)' }, { nom: 'phrase_fin', libelle: 'Phrase en bas de page' },
      { nom: 'bandeau_texte', libelle: 'Texte du bandeau d’urgence' },
      { nom: 'iban', libelle: 'IBAN', aide: 'Laisser vide masque tout le bloc de virement.', largeur: 'demi' }, { nom: 'beneficiaire', libelle: 'Bénéficiaire', largeur: 'demi' },
      { nom: 'attestation', libelle: 'Mention de déductibilité fiscale', type: 'texte_long' },
      { nom: 'qr_code', libelle: 'QR code (facultatif)', type: 'media', aide: 'Vide : le QR code de virement est fabriqué automatiquement à partir de l’IBAN.' },
      { nom: 'don_titre', libelle: 'Bloc don : titre', type: 'texte_long' }, { nom: 'don_bouton', libelle: 'Bloc don : bouton', largeur: 'demi' }, { nom: 'don_lien', libelle: 'Bloc don : lien', type: 'lien', largeur: 'demi' },
      { nom: 'don_image', libelle: 'Bloc don : photo', type: 'media', largeur: 'demi' }, { nom: 'don_image_alt', libelle: 'Bloc don : description de la photo', largeur: 'demi' },
      { nom: 'logo', type: 'lecture' }, { nom: 'maintenance', libelle: 'Mode maintenance', type: 'booleen' },
      { nom: 'credit_logo', libelle: 'Crédit : logo', type: 'media', largeur: 'demi' }, { nom: 'credit_lien', libelle: 'Crédit : lien', type: 'lien', largeur: 'demi' }, { nom: 'credit_libelle', libelle: 'Crédit : texte' },
    ] },
];

/** Libellés des champs qui reviennent dans les blocs de page (contenu des sections) */
export const LIBELLES: Record<string, string> = {
  titre: 'Titre', sur: 'Surtitre', chapo: 'Chapeau', accroche: 'Accroche', intro: 'Introduction', texte: 'Texte', paragraphes: 'Paragraphes',
  boutons: 'Boutons', libelle: 'Libellé', lien: 'Lien', style: 'Style', icone: 'Icône', image: 'Photo', image_alt: 'Description de la photo',
  portrait: 'Portrait', portrait_alt: 'Description du portrait', theme: 'Couleur', colonnes: 'Colonnes', etiquette: 'Étiquette', pinceau: 'Couleur de l’étiquette',
  liste: 'Liste', liste_style: 'Style de liste', etapes: 'Étapes', cartes: 'Cartes', bouton: 'Bouton', fiches: 'Fiches', lien_libelle: 'Texte du lien',
  telephone: 'Téléphone', service: 'Service', contexte: 'Contexte', graphique: 'Graphique', note: 'Note', sous_titre: 'Sous-titre', sous_texte: 'Sous-texte',
  formulaire: 'Formulaire', message_envoye: 'Message après envoi', message_erreur: 'Message en cas d’erreur', message_invalide: 'Message si des champs manquent',
  encart_titre: 'Encadré : titre', encart_texte: 'Encadré : texte', encart_lignes: 'Encadré : lignes', encart_boutons: 'Encadré : boutons', valeur: 'Valeur',
  reglage: 'Reprendre des réglages', coordonnees: 'Afficher les coordonnées de l’association', image_position: 'Position de la photo', apres_liste: 'Texte après la liste',
  rangs: 'Rangées', aplat: 'Aplat de pinceau derrière la photo (n° 0 à 6)', trait: 'Trait de stylo autour de la photo', categories: 'Catégories',
  bouton_tout: 'Bouton « tout »', libelle_filtres: 'Libellé des filtres', emplacement: 'Emplacement', liens: 'Liens', et_aussi: '« Et aussi »',
  formulaires: 'Formulaires', but: 'But', duree: 'Durée de conservation', libelle_champs: 'Titre de colonne : données', libelle_duree: 'Titre de colonne : durée',
  a_valider: 'À faire valider (interne)', note_interne: 'Note interne (jamais affichée)', libelle_iban: 'Libellé IBAN', libelle_beneficiaire: 'Libellé bénéficiaire',
  bouton_copier: 'Bouton « copier »', copie_ok: 'Message après copie', communication: 'Communication à indiquer', bon_a_savoir_titre: 'Bon à savoir : titre',
  bon_a_savoir: 'Bon à savoir : texte', qr_alt: 'Description du QR code', qr_legende: 'Légende du QR code', fil: 'Couleurs', numeros: 'Numérotation',
  type: 'Type', montant: 'Montant', nom: 'Nom', centre_latitude: 'Centre de la carte : latitude', centre_longitude: 'Centre de la carte : longitude',
  libelle_carte: 'Description de la carte', bouton_pres: 'Bouton « près de moi »', decor: 'Image de décor', signature: 'Signature', jours: 'Jours', heures: 'Heures',
};

/** Types de blocs de page (mise en page dans le code) */
export const TYPES_BLOCS: Record<string, string> = {
  accueil_hero: 'En-tête de l’accueil', grille_services: 'Grille des services', aide_rapide: 'Aide rapide (numéros)', liens_actus: 'Liens vers les actualités',
  don: 'Appel au don', tete: 'En-tête de page', rangs_services: 'Rangées des services', deux_colonnes: 'Deux colonnes', reperes: 'Repères (histoire)',
  valeurs: 'Valeurs', equipe: 'Équipe', partenaires: 'Partenaires', duo: 'Deux colonnes avec étiquettes', etapes: 'Étapes', texte: 'Texte',
  texte_image: 'Texte et photo', cartes_texte: 'Cartes de texte', cartes_liens: 'Cartes avec lien', carte_aide: 'Carte des lieux d’aide',
  liste_articles: 'Liste des articles', numeros: 'Numéros d’urgence', fiches: 'Fiches', virement: 'Virement (IBAN)', budget: 'Budget',
  projet: 'Projet', formulaire: 'Formulaire', chiffres: 'Chiffres clés', graphique: 'Graphique', temoignages: 'Témoignages', infos: 'Infos pratiques',
  autres_services: 'Autres services', transversal: 'Bloc transversal', donnees_formulaires: 'Données des formulaires (vie privée)',
  axe: 'Axe', benefice: 'Bénéfice', financeur: 'Financeurs', terrain: 'Terrain',
};

export const CLES_MEDIA = ['image', 'portrait', 'decor', 'picto', 'logo', 'photo', 'qr_code', 'don_image', 'credit_logo'];
export const CLES_COULEUR = ['theme', 'pinceau'];
