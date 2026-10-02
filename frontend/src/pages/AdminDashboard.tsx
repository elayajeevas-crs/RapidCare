import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, Dashboard } from '../services/api';
import ResourceEditor from '../components/ResourceEditor';
import type { Facility } from '../types';

const COLORS = ['#D92D20', '#b45309', '#15803d', '#1d4ed8', '#64748b', '#7c3aed'];
const blank = { name: '', type: 'PHC', address: '', latitude: '', longitude: '', phone: '', open24x7: false };

export default function AdminDashboard() {
  const [d, setD] = useState<Dashboard | null>(null); const [fs, setFs] = useState<Facility[]>([]); const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState(blank); const [err, setErr] = useState('');
  const load = useCallback(() => { api.dashboard().then(setD).catch((e) => setErr(e.message)); api.facilities().then(setFs).catch((e) => setErr(e.message)); }, []);
  useEffect(load, [load]);
  const add = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try { await api.createFacility({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }); setForm(blank); load(); } catch (x) { setErr((x as Error).message); }
  };
  const remove = async (id: string) => { if (confirm('Delete this facility?')) { try { await api.deleteFacility(id); load(); } catch (e) { setErr((e as Error).message); } } };
  if (!d) return <main className="p-6">{err || 'Loading...'}</main>;
  const cards: [string, number][] = [['Facilities', d.totalFacilities], ['Active emergencies', d.activeEmergencies], ['Emergency-ready & open', d.emergencyFacilities], ['Antivenom unconfirmed', d.unconfirmedResources], ["Today's sessions", d.todaySessions]];
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4"><h1 className="text-2xl font-bold">Admin dashboard</h1>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{cards.map(([l, v]) => <div key={l} className="rounded-2xl border p-3"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-slate-600">{l}</p></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="h-60 rounded-2xl border p-3"><h2 className="text-sm font-bold">Emergency types</h2>{d.byType.length ? <ResponsiveContainer><PieChart><Pie data={d.byType.map((x) => ({ name: x.emergencyType, value: x._count }))} dataKey="value" nameKey="name" label>{d.byType.map((_, i) => <Cell key={i} fill={COLORS[i % 6]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-sm">No data yet.</p>}</section>
        <section className="h-60 rounded-2xl border p-3"><h2 className="text-sm font-bold">Status distribution</h2>{d.byStatus.length ? <ResponsiveContainer><BarChart data={d.byStatus.map((x) => ({ name: x.status.replace('_', ' '), count: x._count }))}><XAxis dataKey="name" fontSize={10} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#D92D20" /></BarChart></ResponsiveContainer> : <p className="text-sm">No data yet.</p>}</section>
      </div>
      <section className="overflow-x-auto"><h2 className="mb-2 font-bold">Recent emergency sessions</h2>
        <table className="w-full text-left text-sm"><thead><tr><th>Type</th><th>Status</th><th>Facility</th><th>Created</th></tr></thead>
          <tbody>{d.recent.map((r) => <tr key={r.id} className="border-t"><td>{r.emergencyType}</td><td>{r.status}</td><td>{r.selectedFacility?.name ?? '-'}</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>)}</tbody></table></section>
      <section><h2 className="mb-2 font-bold">Facilities</h2>
        {fs.map((f) => <div key={f.id} className="mb-2 rounded-xl border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>{f.name} {f.isDemo && <b className="rounded bg-slate-900 px-1 text-xs text-white">DEMO DATA</b>} - {f.type.replace(/_/g, ' ')}</span>
          <span className="flex gap-2"><button className="underline" onClick={() => setOpen(open === f.id ? null : f.id)}>Resources</button><button className="text-red-700 underline" onClick={() => void remove(f.id)}>Delete</button></span></div>
          {open === f.id && <div className="mt-2"><ResourceEditor key={f.lastUpdated} facility={f} onSaved={load} /></div>}</div>)}
        <form onSubmit={add} className="mt-3 grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-2"><h3 className="font-bold sm:col-span-2">Add facility</h3>
          {(['name', 'address', 'latitude', 'longitude', 'phone'] as const).map((k) => <input key={k} required placeholder={k} aria-label={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="rounded border p-2" />)}
          <select aria-label="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded border p-2"><option value="GOVERNMENT_HOSPITAL">Government Hospital</option><option value="PHC">PHC</option><option value="PRIVATE_HOSPITAL">Private Hospital</option><option value="EMERGENCY_CARE_CENTRE">Emergency Care Centre</option></select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.open24x7} onChange={(e) => setForm({ ...form, open24x7: e.target.checked })} />Open 24/7</label>
          <button className="rounded-lg bg-slate-900 p-2 font-semibold text-white sm:col-span-2">Add facility</button></form></section>
    </main>
  );
}
