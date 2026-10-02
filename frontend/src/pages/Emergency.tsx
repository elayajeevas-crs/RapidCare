import { useCallback, useState } from 'react';
import { Mic, Phone, Share2 } from 'lucide-react';
import { api } from '../services/api';
import FacilityCard from '../components/FacilityCard';
import FacilityMap from '../components/FacilityMap';
import { DISCLAIMER, EMERGENCY_NUMBER, GUIDANCE } from '../utils/guidance';
import type { Classification, EmergencyType, RankedFacility, Session } from '../types';

const LABEL: Record<EmergencyType, string> = { SNAKE_BITE: 'Snake Bite', INSECT_STING: 'Poisonous Insect Sting', OTHER: 'Other Emergency' };
const STEPS = ['Emergency started', 'Location detected', 'Facility found', 'Route started', 'Care reached'];
const progress = (s: Session | null, hasResults: boolean) => !s ? 0 : s.status === 'RESOLVED' ? 5 : s.status === 'ROUTE_STARTED' ? 4 : hasResults ? 3 : 2;

export default function Emergency() {
  const [type, setType] = useState<EmergencyType | null>(null);
  const [text, setText] = useState('');
  const [detected, setDetected] = useState<Classification | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [manual, setManual] = useState({ lat: '', lon: '' });
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<RankedFacility[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [needManual, setNeedManual] = useState(false);
  const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

  const classify = async (phrase: string) => {
    setError('');
    try {
      const c = await api.classify(phrase);
      if (c.emergencyType === 'OTHER') { setDetected(null); setError('We could not recognise a snake-bite or insect-sting emergency from that. Use the buttons above or call emergency services.'); return; }
      setDetected(c); setType(c.emergencyType);
    } catch (e) { setError((e as Error).message); }
  };
  const listen = () => {
    const rec = new SR(); rec.lang = 'en-IN';
    rec.onresult = (ev: any) => { const t = ev.results[0][0].transcript as string; setText(t); void classify(t); };
    rec.onerror = () => setError('Voice recognition failed. Type your emergency or use the buttons.');
    rec.start();
  };

  const start = useCallback(async (lat: number, lon: number, accuracy?: number) => {
    if (!type) { setError('Choose an emergency type first.'); return; }
    setBusy(true); setError('');
    try {
      setCoords({ lat, lon, accuracy });
      const s = await api.createEmergency({ emergencyType: type, latitude: lat, longitude: lon, voiceInput: text || undefined });
      setSession(s);
      const n = await api.nearby(lat, lon, type);
      setResults(n.results); setNote(n.distanceNote);
      if (!n.results.length) setError('No facilities found nearby. Call emergency services.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [type, text]);

  const locate = () => {
    if (!navigator.geolocation) { setNeedManual(true); setError('Location is not available in this browser. Enter coordinates manually.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => void start(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      () => { setNeedManual(true); setError('Location access is required to find nearby healthcare facilities. You can enter coordinates manually.'); },
      { enableHighAccuracy: true, timeout: 15000 });
  };
  const manualStart = () => {
    const lat = Number(manual.lat), lon = Number(manual.lon);
    if (!manual.lat || !manual.lon || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).'); return; }
    void start(lat, lon);
  };
  const select = async (f: RankedFacility) => {
    if (!session) return;
    try { const r = await api.selectFacility(session.id, f.facility.id); setSession(r.session); setError(''); } catch (e) { setError((e as Error).message); }
  };
  const setStatus = async (status: string) => { if (session) try { setSession(await api.updateEmergency(session.id, status)); } catch (e) { setError((e as Error).message); } };
  const g = type ? GUIDANCE[type] : null;

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4">
      <a href={`tel:${EMERGENCY_NUMBER}`} className="flex items-center justify-center gap-2 rounded-2xl bg-rescue p-4 text-lg font-bold text-white"><Phone aria-hidden />Call emergency services ({EMERGENCY_NUMBER})</a>
      {!navigator.onLine && <p role="alert" className="rounded-lg bg-amber-100 p-3 text-sm">You appear to be offline. Facility availability cannot be checked live. Call emergency services.</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section aria-labelledby="t"><h2 id="t" className="mb-2 text-xl font-bold">What is the emergency?</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(LABEL) as EmergencyType[]).map((k) => (
            <button key={k} onClick={() => { setType(k); setDetected(null); }} aria-pressed={type === k} className={`rounded-xl border-2 p-4 font-semibold ${type === k ? 'border-rescue bg-red-50' : 'border-slate-200'}`}>{LABEL[k]}</button>))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Describe the emergency" placeholder='e.g. "I was bitten by a snake"' className="min-w-0 flex-1 rounded-lg border p-3" />
          <button onClick={() => void classify(text)} disabled={!text.trim()} className="rounded-lg border px-3 font-semibold">Detect</button>
          {SR && <button onClick={listen} aria-label="Use voice input" className="rounded-lg border px-3"><Mic /></button>}
        </div>
        {!SR && <p className="mt-1 text-sm text-slate-600">Voice recognition is not supported in this browser. Use the emergency buttons above.</p>}
        {detected && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">Emergency detected: Possible {LABEL[detected.emergencyType]} (classification confidence {Math.round(detected.confidence * 100)}%). Please seek professional medical care immediately.</p>}
      </section>

      {g && <section className="rounded-2xl border p-4"><h2 className="font-bold">{g.title}</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        {g.avoid.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">{g.avoid.map((s) => <li key={s}>{s}</li>)}</ul>}
        <p className="mt-2 text-xs text-slate-500">{DISCLAIMER}</p></section>}

      {!session && type && <section className="space-y-2">
        <button onClick={locate} disabled={busy} className="w-full rounded-2xl bg-rescue p-4 text-lg font-bold text-white">{busy ? 'Finding facilities...' : 'Use my location & find facilities'}</button>
        {needManual && <div className="flex flex-wrap gap-2"><input aria-label="Latitude" placeholder="Latitude" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} className="min-w-0 flex-1 rounded-lg border p-3" />
          <input aria-label="Longitude" placeholder="Longitude" value={manual.lon} onChange={(e) => setManual({ ...manual, lon: e.target.value })} className="min-w-0 flex-1 rounded-lg border p-3" />
          <button onClick={manualStart} className="rounded-lg border px-4 font-semibold">Search</button></div>}
      </section>}

      {session && coords && <>
        <ol className="grid grid-cols-5 gap-1 text-center text-[11px]" aria-label="Emergency progress">{STEPS.map((s, i) => <li key={s} className={`rounded p-1 ${i < progress(session, results.length > 0) ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}>{s}</li>)}</ol>
        <p className="text-sm text-slate-600">Location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}{coords.accuracy ? ` (accuracy ~${Math.round(coords.accuracy)} m)` : ''} - Status: <strong>{session.status}</strong></p>
        <FacilityMap lat={coords.lat} lon={coords.lon} results={results} />
        <p className="text-xs text-slate-500">{note}</p>
        <div className="space-y-3">{results.map((r) => <FacilityCard key={r.facility.id} r={r} selected={session.selectedFacilityId === r.facility.id} onSelect={() => void select(r)} />)}</div>
        {session.selectedFacilityId && <p className="rounded-lg bg-blue-50 p-3 text-sm">Prototype Emergency Notification sent to the selected facility (no real ambulance dispatch).</p>}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void setStatus('ROUTE_STARTED')} className="rounded-lg border px-3 py-2 font-semibold">I've started the route</button>
          <button onClick={() => void setStatus('RESOLVED')} className="rounded-lg border px-3 py-2 font-semibold">Care reached - resolve</button>
          <button onClick={() => void setStatus('CANCELLED')} className="rounded-lg border px-3 py-2">Cancel</button>
          <button onClick={async () => { try { setShareUrl((await api.share(session.id)).url); } catch (e) { setError((e as Error).message); } }} className="flex items-center gap-1 rounded-lg border px-3 py-2"><Share2 size={16} />Share</button>
        </div>
        {shareUrl && <p className="break-all rounded-lg bg-slate-100 p-3 text-sm">Link valid for 2 hours: {shareUrl}</p>}
      </>}
    </main>
  );
}
