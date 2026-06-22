import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, Star, Phone, Loader2, Trash2 } from 'lucide-react';
import { Pharmacy as PharmacyEntity } from '@/api/entities';
import { findNearbyPharmacies, kmToMiles, DEFAULT_LOCATION } from '@/api/pharmacy';
import PharmacyMap from '@/components/pharmacy/PharmacyMap';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const locKey = (p) => `${Number(p.latitude).toFixed(5)},${Number(p.longitude).toFixed(5)}`;

export default function Pharmacy() {
  const qc = useQueryClient();
  const [center, setCenter] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | locating | loading | done
  const [demo, setDemo] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');

  const { data: favorites = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => PharmacyEntity.list('-created_date')
  });
  const favKeys = new Set(favorites.map(locKey));

  const search = async (loc) => {
    setStatus('loading');
    setCenter(loc);
    const out = await findNearbyPharmacies(loc.lat, loc.lng);
    setResults(out.results);
    setDemo(out.demo);
    setStatus('done');
  };

  const locate = () => {
    setGeoMsg('');
    if (!navigator.geolocation) {
      setGeoMsg('Geolocation unavailable — showing a default location.');
      search(DEFAULT_LOCATION);
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => search({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setGeoMsg('Location blocked — showing results near a default location. Allow location for results near you.');
        search(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveFav = useMutation({
    mutationFn: (p) =>
      PharmacyEntity.create({
        name: p.name,
        address: p.address || null,
        city: p.city || null,
        state: p.state || null,
        zip: p.zip || null,
        phone: p.phone || null,
        latitude: p.latitude,
        longitude: p.longitude,
        is_favorite: true
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacies'] })
  });
  const removeFav = useMutation({
    mutationFn: (id) => PharmacyEntity.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacies'] })
  });

  const busy = status === 'locating' || status === 'loading';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Find Pharmacy</h1>
        <Button size="sm" onClick={locate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {status === 'locating' ? 'Locating…' : status === 'loading' ? 'Searching…' : 'Near me'}
        </Button>
      </div>

      {geoMsg && <p className="text-xs text-muted-foreground">{geoMsg}</p>}

      {favorites.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Favorites</h2>
          {favorites.map((f) => (
            <Card key={f.id} className="flex items-center gap-3 p-3">
              <Star className="h-4 w-4 shrink-0 fill-current text-warning" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{f.name}</div>
                {f.address && <div className="truncate text-xs text-muted-foreground">{f.address}</div>}
              </div>
              {f.phone && (
                <a href={`tel:${f.phone}`} aria-label="Call" className="grid h-9 w-9 place-items-center rounded-full border border-border">
                  <Phone className="h-4 w-4" />
                </a>
              )}
              <button type="button" onClick={() => removeFav.mutate(f.id)} aria-label="Remove favorite" className="grid h-9 w-9 place-items-center rounded-full border border-border text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </section>
      )}

      {center && <PharmacyMap center={center} pharmacies={results} selectedId={selectedId} onSelect={setSelectedId} />}

      {status === 'idle' && favorites.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="Find pharmacies near you"
          action={<Button onClick={locate}><Navigation className="h-4 w-4" /> Use my location</Button>}
        >
          See nearby pharmacies on a map and save your favorites.
        </EmptyState>
      )}

      {status === 'done' && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Nearby{demo ? ' (sample)' : ''}
            </h2>
            <span className="text-xs text-muted-foreground">{results.length} found</span>
          </div>
          {results.map((p) => {
            const saved = favKeys.has(locKey(p));
            return (
              <Card
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn('flex cursor-pointer items-center gap-3 p-3', p.id === selectedId && 'border-primary')}
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[p.address, `${kmToMiles(p.distanceKm).toFixed(1)} mi`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {p.phone && (
                  <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} aria-label="Call" className="grid h-9 w-9 place-items-center rounded-full border border-border">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (!saved) saveFav.mutate(p); }}
                  aria-label={saved ? 'Saved' : 'Save favorite'}
                  className={cn('grid h-9 w-9 place-items-center rounded-full border border-border', saved && 'text-warning')}
                >
                  <Star className={cn('h-4 w-4', saved && 'fill-current')} />
                </button>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
