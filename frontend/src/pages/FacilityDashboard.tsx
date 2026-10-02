import { useCallback, useEffect, useState } from 'react';
import { api, Notification } from '../services/api';
import ResourceEditor from '../components/ResourceEditor';
import { getUser } from '../utils/auth';
import type { Facility } from '../types';

export default function FacilityDashboard() {
  const user = getUser();
  const [items, setItems] = useState<Notification[]>([]); const [fac, setFac] = useState<Facility | null>(null); const [err, setErr] = useState('');
  const load = useCallback(() => {
    api.notifications().then(setItems).catch((e) => setErr(e.message));
    api.facilities().then((l) => setFac(l.find((f) => f.id === user?.facilityId) ?? null)).catch((e) => setErr(e.message));
  }, [user?.facilityId]);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  const act = async (id: string, s: string) => { try { await api.updateNotification(id, s); load(); } catch (e) { setErr((e as Error).message); } };
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4"><h1 className="text-2xl font-bold">{fac?.name ?? 'Facility dashboard'}</h1>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      <section><h2 className="mb-2 font-bold">Emergency notifications <span className="text-xs font-normal">(Prototype Emergency Notification)</span></h2>
        {items.length === 0 && <p className="text-sm text-slate-600">No notifications yet.</p>}
        {items.map((n) => <div key={n.id} className="mb-2 rounded-xl border p-3 text-sm"><p><strong>{n.session.emergencyType.replace('_', ' ')}</strong> - {n.distanceKm ?? '?'} km - {new Date(n.createdAt).toLocaleTimeString()} - <em>{n.status}</em></p>
          <p className="text-xs text-slate-600">Approx. location {n.session.latitude.toFixed(2)}, {n.session.longitude.toFixed(2)}</p>
          <div className="mt-2 flex gap-2">{['ACCEPTED', 'REJECTED', 'READY'].map((s) => <button key={s} onClick={() => void act(n.id, s)} className="rounded border px-2 py-1">{s === 'READY' ? 'Mark Ready' : s === 'ACCEPTED' ? 'Accept' : 'Reject'}</button>)}</div></div>)}
      </section>
      {fac && <section><h2 className="mb-2 font-bold">Resource availability</h2><ResourceEditor key={fac.lastUpdated} facility={fac} onSaved={load} /></section>}
    </main>
  );
}
