// Médiathèque : envoi des images (espace de stockage « medias »), description obligatoire, type d'image.
// Le site ajoute lui-même le noir et blanc, le grain, le liseré, le trait de stylo et le fondu : on fournit la photo telle quelle.
import { useState } from 'preact/hooks';
import type { Ligne } from './donnees';
import { useCtx, estAdmin, slugifier } from './champs';
import { Etat } from './rubrique';

const TYPES: [string, string][] = [['detoure', 'Détourée (fond transparent)'], ['photo', 'Photo avec fond'], ['dessin', 'Dessin / logo (SVG)'], ['composite', 'Ancienne image (aplat incrusté)']];

/** Dimensions et transparence d'une image choisie, lues dans le navigateur */
async function analyser(f: File): Promise<{ largeur: number; hauteur: number; type: string }> {
  if (f.type === 'image/svg+xml') return { largeur: 0, hauteur: 0, type: 'dessin' };
  const url = URL.createObjectURL(f);
  const img = new Image(); img.src = url; await img.decode();
  let type = 'photo';
  if (/png|webp/.test(f.type)) {
    const c = document.createElement('canvas'); const w = 120, h = Math.max(1, Math.round((img.height / img.width) * 120));
    c.width = w; c.height = h; const x = c.getContext('2d')!; x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let transparents = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 200) transparents++;
    if (transparents / (w * h) > 0.05) type = 'detoure';
  }
  URL.revokeObjectURL(url);
  return { largeur: img.naturalWidth, hauteur: img.naturalHeight, type };
}

export function Mediatheque() {
  const ctx = useCtx();
  const { source, profil, medias, rechargerMedias } = ctx;
  const admin = estAdmin(profil);
  const [choisi, setChoisi] = useState<Ligne | null>(null);
  const [envoi, setEnvoi] = useState<{ fichier: File; alt: string; type: string; largeur: number; hauteur: number } | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [encours, setEncours] = useState(false);
  const [recherche, setRecherche] = useState('');

  const choisirFichier = async (f?: File) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(f.type)) { setMessage({ type: 'erreur', texte: 'Formats acceptés : JPG, PNG, WebP, SVG.' }); return; }
    if (f.size > 15 * 1024 * 1024) { setMessage({ type: 'erreur', texte: 'Image trop lourde (15 Mo maximum).' }); return; }
    const a = await analyser(f);
    setEnvoi({ fichier: f, alt: '', ...a }); setMessage(null);
  };
  const envoyer = async () => {
    if (!envoi) return;
    if (!envoi.alt.trim()) { setMessage({ type: 'erreur', texte: 'La description de l’image est obligatoire (elle est lue aux personnes aveugles).' }); return; }
    setEncours(true);
    try {
      const ext = envoi.fichier.name.split('.').pop()!.toLowerCase();
      const base = slugifier(envoi.fichier.name.replace(/\.[^.]+$/, '')) || 'image';
      const nom = medias.some((m) => m.fichier === `${base}.${ext}`) ? `${base}-${Date.now().toString(36)}.${ext}` : `${base}.${ext}`;
      await source.envoyerFichier(nom, envoi.fichier);
      const id = 'm-' + nom.replace(/\.[^.]+$/, '');
      await source.creer('medias', { id, fichier: nom, alt: envoi.alt.trim(), credit: '', largeur: envoi.largeur || null, hauteur: envoi.hauteur || null, type_visuel: envoi.type, publie: admin, ordre: medias.length + 1 });
      await rechargerMedias();
      setEnvoi(null);
      setMessage({ type: 'ok', texte: admin ? 'Image ajoutée. Elle peut maintenant être choisie dans les contenus.' : 'Image ajoutée en brouillon : l’administration la publiera.' });
    } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
    setEncours(false);
  };
  const enregistrer = async (publie?: boolean) => {
    try {
      await source.modifier('medias', choisi!.id, { ...choisi!, ...(publie === undefined ? {} : { publie }) });
      await rechargerMedias(); setMessage({ type: 'ok', texte: 'Image enregistrée.' }); setChoisi(null);
    } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  const supprimer = async () => {
    if (!confirm('Supprimer la fiche de cette image ? Vérifiez d’abord qu’elle n’est plus utilisée dans un contenu. Cette action ne peut pas être annulée.')) return;
    try { await source.supprimer('medias', choisi!.id); await rechargerMedias(); setChoisi(null); } catch (e: any) { setMessage({ type: 'erreur', texte: e.message }); }
  };
  const visibles = medias.filter((m) => !recherche || `${m.alt} ${m.fichier}`.toLowerCase().includes(recherche.toLowerCase()));
  return (
    <section>
      <header class="entete-ecran"><div><h1>Médiathèque</h1><p class="intro">Fournissez la photo telle quelle, en couleur et sans retouche. Le site ajoute lui-même le noir et blanc, le grain, le trait de stylo et le fondu. Pour un en-tête de page, une photo détourée (fond transparent) donne le meilleur rendu.</p></div></header>
      <div class="envoi">
        <label class="btn plein" for="fichier">Choisir une image…</label>
        <input id="fichier" class="sr" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(e) => choisirFichier((e.target as HTMLInputElement).files?.[0])} />
        {envoi && (
          <div class="envoi-fiche">
            <img src={URL.createObjectURL(envoi.fichier)} alt="" />
            <div class="formulaire-fiche">
              <p><b>{envoi.fichier.name}</b> · {envoi.largeur ? `${envoi.largeur} × ${envoi.hauteur} px` : 'SVG'}</p>
              <div class="champ"><label for="alt-nouveau">Description de l’image <span class="requis">*</span></label><input id="alt-nouveau" value={envoi.alt} onInput={(e) => setEnvoi({ ...envoi, alt: (e.target as HTMLInputElement).value })} placeholder="Ex. Une intervenante écoute un homme lors d’un entretien" /></div>
              <div class="champ"><label for="type-nouveau">Type d’image</label><select id="type-nouveau" value={envoi.type} onChange={(e) => setEnvoi({ ...envoi, type: (e.target as HTMLSelectElement).value })}>{TYPES.map(([v, l]) => <option value={v}>{l}</option>)}</select><small class="aide">Deviné automatiquement ; corrigez si besoin.</small></div>
              <div class="barre-actions"><button class="btn plein" disabled={encours} onClick={envoyer}>{encours ? 'Envoi…' : 'Envoyer l’image'}</button><button class="btn contour" onClick={() => setEnvoi(null)}>Annuler</button></div>
            </div>
          </div>
        )}
      </div>
      {message && <p class={message.type === 'ok' ? 'succes' : 'erreur'} role={message.type === 'ok' ? 'status' : 'alert'}>{message.texte}</p>}
      {choisi && (
        <div class="envoi-fiche">
          <img src={source.urlFichier(choisi.fichier)} alt="" />
          <fieldset class="formulaire-fiche">
            <p><b>{choisi.fichier}</b> · <Etat publie={choisi.publie} /></p>
            <div class="champ"><label for="alt-m">Description de l’image <span class="requis">*</span></label><input id="alt-m" value={choisi.alt} onInput={(e) => setChoisi({ ...choisi, alt: (e.target as HTMLInputElement).value })} /></div>
            <div class="champ demi"><label for="type-m">Type d’image</label><select id="type-m" value={choisi.type_visuel ?? ''} onChange={(e) => setChoisi({ ...choisi, type_visuel: (e.target as HTMLSelectElement).value })}><option value="">Automatique</option>{TYPES.map(([v, l]) => <option value={v}>{l}</option>)}</select></div>
            <div class="champ demi"><label for="credit-m">Crédit photo</label><input id="credit-m" value={choisi.credit ?? ''} onInput={(e) => setChoisi({ ...choisi, credit: (e.target as HTMLInputElement).value })} /></div>
            <div class="barre-actions">
              <button class="btn plein" onClick={() => enregistrer()}>Enregistrer</button>
              {admin && !choisi.publie && <button class="btn contour" onClick={() => enregistrer(true)}>Publier</button>}
              <button class="btn contour" onClick={() => setChoisi(null)}>Fermer</button>
              {admin && <button class="btn danger" onClick={supprimer}>Supprimer</button>}
            </div>
          </fieldset>
        </div>
      )}
      <div class="outils-liste"><input type="search" placeholder="Rechercher une image…" aria-label="Rechercher une image" value={recherche} onInput={(e) => setRecherche((e.target as HTMLInputElement).value)} /></div>
      <ul class="grille-medias">
        {visibles.map((m) => (
          <li><button type="button" onClick={() => { setChoisi(m); scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src={source.urlFichier(m.fichier)} alt="" loading="lazy" />
            <span class="media-alt">{m.alt || m.fichier}</span>
            <span class="media-type">{TYPES.find(([v]) => v === m.type_visuel)?.[1] ?? 'Automatique'}{!m.publie && ' · brouillon'}</span>
          </button></li>
        ))}
      </ul>
    </section>
  );
}
