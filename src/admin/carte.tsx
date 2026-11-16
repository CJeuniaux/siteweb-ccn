// Position d'un lieu d'aide : un clic sur la carte place le point (mêmes fonds de carte que le site).
import { useEffect, useRef } from 'preact/hooks';
import type { Ligne } from './donnees';
import 'leaflet/dist/leaflet.css';

export function CarteLieu({ ligne, onChange }: { ligne: Ligne; onChange: (lat: number, lng: number) => void }) {
  const boite = useRef<HTMLDivElement>(null);
  const etat = useRef<{ carte?: any; point?: any }>({});
  const rappel = useRef(onChange); rappel.current = onChange;
  useEffect(() => {
    let annule = false;
    import('leaflet').then(({ default: L }) => {
      if (annule || !boite.current) return;
      const centre: [number, number] = ligne.latitude != null ? [Number(ligne.latitude), Number(ligne.longitude)] : [50.4108, 4.4446];
      const carte = L.map(boite.current).setView(centre, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(carte);
      const point = L.circleMarker(centre, { radius: 9, color: '#fff', weight: 2.5, fillColor: '#D4705C', fillOpacity: ligne.latitude != null ? 1 : 0 }).addTo(carte);
      carte.on('click', (e: any) => { point.setLatLng(e.latlng).setStyle({ fillOpacity: 1 }); rappel.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))); });
      etat.current = { carte, point };
    });
    return () => { annule = true; etat.current.carte?.remove(); };
  }, []);
  return (
    <div class="champ">
      <span class="etiquette-champ">Position sur la carte</span>
      <div ref={boite} class="carte-admin" role="application" aria-label="Carte : cliquez pour placer le lieu" />
      <small class="aide">Cliquez sur la carte pour placer le point. Actuellement : {ligne.latitude != null ? `${ligne.latitude}, ${ligne.longitude}` : 'aucune position'}.</small>
    </div>
  );
}
