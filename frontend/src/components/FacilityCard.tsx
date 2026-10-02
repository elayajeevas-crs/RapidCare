import { AlertTriangle, Check, MapPin, Phone } from 'lucide-react';
import type { RankedFacility } from '../types';

const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };

export default function FacilityCard({ r, onSelect, selected }: { r: RankedFacility; onSelect: () => void; selected: boolean }) {
  const f = r.facility;
  const nav = `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;
  return (
    <article className={`rounded-2xl border p-4 ${selected ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-semibold">{f.name}</h3><p className="text-sm text-slate-600">{f.type.replace(/_/g, ' ')} - {r.distanceKm} km straight-line</p></div>
        {f.isDemo && <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">DEMO DATA</span>}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {r.reasons.map((x) => <li key={x} className="flex gap-2 text-green-700"><Check size={16} aria-hidden />{x}</li>)}
        {r.warnings.map((x) => <li key={x} className="flex gap-2 text-amber-700"><AlertTriangle size={16} aria-hidden />{x}</li>)}
      </ul>
      <p className="mt-2 text-xs text-slate-500">Availability last updated: {ago(f.resource?.updatedAt ?? f.lastUpdated)}. Availability information may be outdated. Please contact the facility when possible.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onSelect} className="rounded-lg bg-rescue px-3 py-2 text-sm font-semibold text-white">{selected ? 'Selected' : 'Select & notify'}</button>
        <a href={nav} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><MapPin size={16} />Navigate</a>
        <a href={`tel:${f.phone}`} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><Phone size={16} />Call</a>
      </div>
    </article>
  );
}
