import React, { useState } from 'react';
import { AGE_BRACKETS, type AgeBracketId, type SexCategory } from '../data/scoringStandards';
import { HPA_SCORING_RELEASE, SCORING_EVENTS } from '../data/scoringRelease';
import { formatSecondsToMmSs } from '../utils/calculator';
import { Selector } from './Selector';

export function FullScoresheets() {
  const [sex, setSex] = useState('all');
  const [age, setAge] = useState('all');
  const [eventId, setEventId] = useState('all');
  const sexes = (['male', 'female'] as SexCategory[]).filter((value) => sex === 'all' || sex === value);
  const ages = AGE_BRACKETS.filter((value) => age === 'all' || age === value.id);
  const events = SCORING_EVENTS.filter((value) => eventId === 'all' || eventId === value.id);
  const count = sexes.length * ages.length * events.length;

  return <div className="space-y-5">
    <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">Chart version: <strong>{HPA_SCORING_RELEASE.effectiveDate}</strong>. All scoring rows are included below. Filter to narrow the view; no external document is needed to read the installed scoresheets.</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="space-y-1">
        <label htmlFor="scoresheet-sex" className="text-xs lg:text-sm font-medium">Sex</label>
        <Selector id="scoresheet-sex" label="Scoresheet sex" value={sex} onChange={setSex}
          options={[{ value: 'all', label: 'All sexes' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
      </div>
      <div className="space-y-1">
        <label htmlFor="scoresheet-age" className="text-xs lg:text-sm font-medium">Age</label>
        <Selector id="scoresheet-age" label="Scoresheet age" value={age} onChange={setAge}
          options={[{ value: 'all', label: 'All ages' }, ...AGE_BRACKETS.map(bracket => ({ value: bracket.id, label: bracket.label }))]} />
      </div>
      <div className="space-y-1">
        <label htmlFor="scoresheet-event" className="text-xs lg:text-sm font-medium">Event</label>
        <Selector id="scoresheet-event" label="Scoresheet event" value={eventId} onChange={setEventId}
          options={[{ value: 'all', label: 'All events' }, ...SCORING_EVENTS.map(event => ({ value: event.id, label: event.label }))]} />
      </div>
    </div>
    <p role="status" className="text-sm lg:text-base font-semibold">Showing {count} complete {count === 1 ? 'scoresheet' : 'scoresheets'}</p>
    <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">Run: at or faster than a row’s time. Other events: at or above a row’s result. Missing an event’s minimum earns 0 points and fails its minimum requirement. Cardio rows are shown before altitude adjustment.</p>
    {sexes.flatMap((category) => ages.flatMap((bracket) => events.map((event) => {
      const rows = HPA_SCORING_RELEASE.tables[category][bracket.id as AgeBracketId][event.id];
      return <div key={`${category}-${bracket.id}-${event.id}`} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm lg:text-base text-left">
          <caption className="p-3 text-left font-semibold">{event.label} · {category === 'male' ? 'Male' : 'Female'} · {bracket.label}</caption>
          <thead className="bg-slate-100 dark:bg-slate-900"><tr><th scope="col" className="p-3">{event.unit === 'time' ? 'Time (mm:ss)' : event.unit === 'reps' ? 'Repetitions' : 'Shuttles'}</th><th scope="col" className="p-3 text-right">Points / {event.maximum}</th><th scope="col" className="p-3 text-right">Threshold</th></tr></thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">{rows.map(([value, points], index) => <tr key={value}><td className="p-3">{event.unit === 'time' ? formatSecondsToMmSs(value) : value}</td><td className="p-3 text-right font-bold">{points.toFixed(1)}</td><td className="p-3 text-right text-xs lg:text-sm text-slate-500 dark:text-slate-400">{index === 0 ? 'Maximum' : index === rows.length - 1 ? 'Minimum' : 'Scoring row'}</td></tr>)}</tbody>
        </table>
      </div>;
    })))}
  </div>;
}
