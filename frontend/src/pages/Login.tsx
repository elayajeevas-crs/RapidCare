import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { homeFor, saveSession } from '../utils/auth';

export default function Login({ register = false }: { register?: boolean }) {
  const nav = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = register ? await api.register(name, email, password) : await api.login(email, password); saveSession(r.token, r.user); nav(homeFor(r.user.role)); }
    catch (err) { setMsg((err as Error).message); }
  };
  return (
    <main className="mx-auto max-w-sm p-4"><h1 className="mb-4 text-2xl font-bold">{register ? 'Create account' : 'Log in'}</h1>
      <form onSubmit={submit} className="space-y-3">
        {register && <label className="block text-sm">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>}
        <label className="block text-sm">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm">Password (min 8 characters)<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
        <button className="w-full rounded-lg bg-slate-900 p-3 font-semibold text-white">{register ? 'Register' : 'Log in'}</button>
      </form>
      {msg && <p role="alert" className="mt-3 text-sm text-red-700">{msg}</p>}
      <p className="mt-4 text-sm">{register ? <Link to="/login" className="underline">Have an account? Log in</Link> : <Link to="/register" className="underline">Create an account</Link>}</p>
    </main>
  );
}
