import { useState } from 'react';
import { api } from '../services/api';
import type { Facility } from '../types';

const FLAGS = [['emergencyAvailable', 'Emergency care'], ['snakeBiteTreatment', 'Snake-bite treatment'], ['insectStingTreatment', 'Insect-sting treatment'], ['emergencyEquipmentAvailable', 'Emergency equipment']] as const;

export default function ResourceEditor({ facility, onSaved }: { facility: Facility; onSaved: () => void }) {
  const r = facility.resource;
  const [f, setF] = useState({ emergencyAvailable: !!r?.emergencyAvailable, snakeBiteTreatment: !!r?.snakeBiteTreatment, insectStingTreatment: !!r?.insectStingTreatment, emergencyEquipmentAvailable: !!r?.emergencyEquipmentAvailable });
  const [av, setAv] = useState<string>(r?.antivenomAvailable == null ? 'unknown' : String(r.antivenomAvailable));
  const [msg, setMsg] = useState('');
  const save = async () => {
    try { await api.updateResources(facility.id, { ...f, antivenomAvailable: av === 'unknown' ? null : av === 'true' }); setMsg('Saved.'); onSaved(); }
    catch (e) { setMsg((e as Error).message); }
  };
  return (
    <div className="space-y-2 text-sm">
      {FLAGS.map(([k, label]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{label}</label>)}
      <label className="flex items-center gap-2">Antivenom
        <select value={av} onChange={(e) => setAv(e.target.value)} className="rounded border p-1"><option value="unknown">Not confirmed</option><option value="true">Available</option><option value="false">Not available</option></select></label>
      <button onClick={save} className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">Save resources</button>
      {msg && <span role="status" className="ml-2">{msg}</span>}
    </div>
  );
}
