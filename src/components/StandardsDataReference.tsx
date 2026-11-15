import React, { useState } from 'react';
import { STANDARDS_REFERENCE } from '../data/standardsReference';

const text = JSON.stringify(STANDARDS_REFERENCE, null, 2);

export function StandardsDataReference() {
  const [message, setMessage] = useState('');
  return <div className="space-y-5">
    <h3 className="text-base font-bold">Complete reference data</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">All installed scoresheets, rules, altitude adjustments, walk limits, base groups, and waist-ratio rules are included here. Copy the complete reference to cross-check it with another AI model. The readable tables and this reference use the same grading data.</p>
    <dl className="space-y-3 text-sm">{Object.entries(STANDARDS_REFERENCE.rules).map(([name, rule]) => <div key={name}><dt className="font-semibold">{name.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</dt><dd className="mt-1 text-slate-600 dark:text-slate-400">{rule}</dd></div>)}</dl>
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setMessage('Complete reference copied.'); } catch { setMessage('Copy is unavailable in this browser. Select the reference text below to copy it.'); } }} className="min-h-11 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 cursor-pointer">Copy complete reference</button>
    <p role="status" className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    <pre tabIndex={0} aria-label="Complete standards reference JSON" className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs text-slate-700 dark:text-slate-300">{text}</pre>
    <p className="text-sm text-slate-600 dark:text-slate-400">Installed chart version: {STANDARDS_REFERENCE.release.date}. New publications must be checked against these values and the calculator’s regression tests before grading changes are published.</p>
  </div>;
}
