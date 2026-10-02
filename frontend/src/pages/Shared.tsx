import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
export default function Shared() {
  const { token = '' } = useParams();
  const [d, setD] = useState<Awaited<ReturnType<typeof api.shared>> | null>(null); const [err, setErr] = useState('');
  useEffect(() => { api.shared(token).then(setD).catch((e) => setErr(e.message)); }, [token]);
  if (err) return <main className="p-6 text-center" role="alert">{err}</main>;
  if (!d) return <main className="p-6 text-center">Loading...</main>;
  return (
    <main className="mx-auto max-w-md space-y-2 p-4"><h1 className="text-2xl font-bold">Shared emergency</h1>
      <p>Type: <strong>{d.emergencyType.replace('_', ' ')}</strong> (possible)</p><p>Status: <strong>{d.status}</strong></p>
      <p>Approximate location: {d.approxLatitude}, {d.approxLongitude}</p>
      <p>Facility: {d.facility ? <>{d.facility.name} - <a className="underline" href={`tel:${d.facility.phone}`}>{d.facility.phone}</a></> : 'Not selected yet'}</p>
      <p className="text-xs text-slate-500">Last updated {new Date(d.updatedAt).toLocaleString()}. This link expires automatically.</p></main>
  );
}
