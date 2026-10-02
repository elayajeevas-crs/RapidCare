import { DISCLAIMER, EMERGENCY_NUMBER, GUIDANCE } from '../utils/guidance';
export default function FirstAid() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4"><h1 className="text-2xl font-bold">Emergency guidance</h1>
      <a href={`tel:${EMERGENCY_NUMBER}`} className="block rounded-2xl bg-rescue p-3 text-center font-bold text-white">Call {EMERGENCY_NUMBER}</a>
      {['SNAKE_BITE', 'INSECT_STING'].map((k) => <section key={k} className="rounded-2xl border p-4"><h2 className="font-bold">{GUIDANCE[k].title}</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{GUIDANCE[k].steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">{GUIDANCE[k].avoid.map((s) => <li key={s}>{s}</li>)}</ul></section>)}
      <p className="text-xs text-slate-500">{DISCLAIMER}</p></main>
  );
}
