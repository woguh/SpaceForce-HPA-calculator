import { useId } from 'react';
import { formatHeightFeetInches } from '../utils/waistRatio';

interface HeightInputProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}
const inputClass = 'min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-base lg:text-lg font-mono text-zinc-900 placeholder:text-zinc-500 caret-cyan-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 aria-invalid:border-rose-500';
const HEIGHTS = Array.from({ length: 97 }, (_, i) => 48 + i * 0.5);

export function HeightInput({ value, error, onChange }: HeightInputProps) {
  const id = useId();
  const total = Number(value);
  const selected = value.trim() && !error && Number.isFinite(total) && total > 0 ? String(total) : '';
  return <div className="min-w-0 space-y-3">
    <div>
      <label htmlFor={`${id}-combined`} className="mb-1 block text-xs lg:text-sm font-medium text-zinc-800 dark:text-zinc-200">Height (ft + in)</label>
      <select id={`${id}-combined`} aria-label="Height (ft + in)" value={selected} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value)} className={inputClass.replace('font-mono', 'font-sans')}>
        <option value="">Select height</option>
        {selected && !HEIGHTS.includes(total) && <option value={selected}>{formatHeightFeetInches(total)}</option>}
        {HEIGHTS.map(height => <option key={height} value={height}>{formatHeightFeetInches(height)}</option>)}
      </select>
    </div>
    <div>
      <label htmlFor={`${id}-total`} className="mb-1 block text-xs lg:text-sm font-medium text-zinc-800 dark:text-zinc-200">Height (in)</label>
      <input id={`${id}-total`} type="number" inputMode="decimal" min="0.01" step="any" placeholder="e.g. 70" value={value} aria-label="Height (in)" aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value)} className={inputClass} />
    </div>
    {error && <p id={`${id}-error`} className="text-xs lg:text-sm text-rose-800 dark:text-rose-200">{error}</p>}
  </div>;
}
