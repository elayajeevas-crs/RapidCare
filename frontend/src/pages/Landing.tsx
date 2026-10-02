import { Link } from 'react-router-dom';
import { Activity, MapPin, Mic, ShieldAlert } from 'lucide-react';
import { DISCLAIMER } from '../utils/guidance';

const FEATURES = [
  { icon: Mic, title: 'Say or tap what happened', text: 'Voice or text identifies a possible snake bite or insect sting. It is a category match, not a diagnosis.' },
  { icon: MapPin, title: 'Find suitable facilities', text: 'Ranked by reported capability, antivenom status and distance - never by distance alone.' },
  { icon: Activity, title: 'Track the emergency', text: 'Notify a facility (prototype), share a temporary link, and follow status until care is reached.' },
  { icon: ShieldAlert, title: 'Honest about uncertainty', text: 'Unknown antivenom stays "not confirmed". Old data is flagged as possibly outdated.' },
];
export default function Landing() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-rescue">DEMO MODE - sample data only</p>
        <h1 className="mt-2 text-5xl font-extrabold">RapidCare</h1>
        <p className="text-2xl font-semibold text-slate-700">Smart Emergency Response</p>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">Find appropriate emergency healthcare faster when every minute matters.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/emergency" className="rounded-2xl bg-rescue px-8 py-4 text-xl font-bold text-white">Start Emergency</Link>
          <a href="#how" className="rounded-2xl border-2 px-6 py-4 text-lg font-semibold">Learn How It Works</a>
        </div>
      </section>
      <section id="how" className="mx-auto grid max-w-5xl gap-4 px-4 pb-14 sm:grid-cols-2">
        {FEATURES.map(({ icon: I, title, text }) => <div key={title} className="rounded-2xl border p-5"><I className="text-rescue" aria-hidden /><h2 className="mt-2 font-bold">{title}</h2><p className="text-sm text-slate-600">{text}</p></div>)}
      </section>
      <footer className="border-t p-4 text-center text-xs text-slate-500">{DISCLAIMER}</footer>
    </main>
  );
}
