// Vérifie le nettoyage du texte des articles. Lancement : npm run test:texte
import { texteSur } from './texte.ts';

const piege = '<p onclick="alert(1)">Texte <strong>gras</strong></p><script>alert(2)</script>'
  + '<img src=x onerror=alert(3)><a href="javascript:alert(4)">lien</a>'
  + '<a href="https://exemple.org">ext</a><h2 style="color:red">Titre</h2>';
const sortie = texteSur(piege);
const interdits = ['<script', 'onclick', 'onerror', '<img', 'javascript:', 'style='];
const trouves = interdits.filter((m) => sortie.includes(m));
console.log(sortie);
if (trouves.length) { console.error('ÉCHEC, restent :', trouves.join(', ')); process.exit(1); }
if (!sortie.includes('<strong>gras</strong>') || !sortie.includes('<h2>Titre</h2>') || !sortie.includes('rel="noopener"')) {
  console.error('ÉCHEC : la mise en forme autorisée a été perdue'); process.exit(1);
}
console.log('Nettoyage correct : scripts et attributs dangereux retirés, mise en forme gardée.');
