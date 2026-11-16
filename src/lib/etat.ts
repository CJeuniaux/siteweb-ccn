// Interrupteurs de mise en ligne, réglés dans Vercel (variables d'environnement), jamais dans le code.
//
// VERSION DE TRAVAIL (par défaut) : pages en « noindex », robots.txt qui bloque tout,
//   bandeau « Version de travail ». Pour la mise en ligne définitive : PUBLIC_SITE_DEFINITIF=1
//   (et retirer l'en-tête X-Robots-Tag de vercel.json).
// FORMULAIRES : inactifs par défaut (message « en cours d'installation », aucun envoi).
//   Une fois la fonction d'envoi installée : PUBLIC_FORMULAIRES_ACTIFS=1.
export const VERSION_TRAVAIL = import.meta.env.PUBLIC_SITE_DEFINITIF !== '1';
export const FORMULAIRES_ACTIFS = import.meta.env.PUBLIC_FORMULAIRES_ACTIFS === '1';
