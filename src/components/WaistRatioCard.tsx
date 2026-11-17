import React, { useEffect, useId, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleAlert } from 'lucide-react';
import { HeightInput } from './HeightInput';
import { WAIST_RATIO_FAIL_THRESHOLD } from '../data/scoringRelease';
import { calculateWaistRatio, type WaistMeasurements } from '../utils/waistRatio';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { ScoreNumber } from './ScoreNumber';

const EMPTY_MEASUREMENTS: WaistMeasurements = { waist: '', height: '' };

interface WaistRatioCardProps {
  measurements: WaistMeasurements;
  onChange: (measurements: WaistMeasurements) => void;
}

export function WaistRatioCard({ measurements, onChange }: WaistRatioCardProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const reducedMotion = useReducedMotion();
  const result = calculateWaistRatio(measurements);
  const passed = result.status === 'pass';
  const failed = result.status === 'fail';
  const label = passed ? 'PASS' : failed ? 'FAIL' : result.status === 'empty' ? 'Not entered' : result.status === 'incomplete' ? 'Incomplete' : 'Check entries';

  useEffect(() => {
    const text = result.ratio !== null
      ? `Waist-to-height ratio ${result.ratio.toFixed(2)}. ${label}.`
      : result.status === 'invalid'
        ? Object.values(result.errors).join(' ')
        : 'Enter both waist and height to check your waist-to-height ratio.';
    const timer = window.setTimeout(() => setAnnouncement(text), 500);
    return () => window.clearTimeout(timer);
  }, [measurements.waist, measurements.height]);

  return (
    <section
      aria-labelledby={`${id}-heading`}
      data-testid="waist-ratio-card"
      data-state={passed ? 'pass' : failed ? 'fail' : 'neutral'}
      className={`rounded-xl border ${passed
        ? 'border-emerald-500/60 bg-emerald-50/95 dark:bg-emerald-950/90'
        : failed
          ? 'border-rose-500/60 bg-rose-50/95 dark:bg-rose-950/90'
          : 'border-zinc-300 bg-zinc-100/95 dark:border-zinc-700 dark:bg-zinc-900/95'}`}
    >
      <h2 id={`${id}-heading`}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-panel`}
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center justify-between gap-3 rounded-xl p-5 text-left cursor-pointer"
        >
          <span className="min-w-0">
            <span className="block text-base lg:text-lg font-bold text-zinc-900 dark:text-zinc-100">Waist-to-Height Ratio</span>
            <span className={`mt-1 block text-xs lg:text-sm font-normal ${passed ? 'text-emerald-800 dark:text-emerald-200' : failed ? 'text-rose-800 dark:text-rose-200' : 'text-zinc-600 dark:text-zinc-400'}`}>Separate pass/fail check</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs lg:text-sm font-mono font-bold ${passed
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
              : failed
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
              {passed && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
              {failed && <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
              {label}
            </span>
            <m.span initial={false} animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: reducedMotion ? 0 : .2 }} className="inline-flex shrink-0" aria-hidden="true">
              <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            </m.span>
          </span>
        </button>
      </h2>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>

      <m.div id={`${id}-panel`} initial={false} animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .24 }} aria-hidden={!expanded} inert={!expanded} className="overflow-hidden">
        <div className="px-5 pb-5 space-y-4">
        <p className={`text-sm lg:text-base ${passed ? 'text-emerald-900 dark:text-emerald-100' : failed ? 'text-rose-900 dark:text-rose-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
          This check does not change your fitness point total.
        </p>
        <div className="grid grid-cols-2 items-start gap-3">
          <HeightInput value={measurements.height} error={result.errors.height} onChange={(height) => onChange({ ...measurements, height })} />
          {(['waist'] as const).map((key) => (
            <div key={key} className="min-w-0">
              <label htmlFor={`${id}-${key}`} className="mb-1 block text-xs lg:text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Waist (in)
              </label>
              <input
                id={`${id}-${key}`}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                placeholder="e.g. 32.5"
                value={measurements[key]}
                aria-invalid={Boolean(result.errors[key]) || undefined}
                aria-describedby={result.errors[key] ? `${id}-${key}-error` : undefined}
                onChange={(event) => onChange({ ...measurements, [key]: event.target.value })}
                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base lg:text-lg font-mono text-zinc-900 placeholder:text-zinc-500 caret-cyan-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 aria-invalid:border-rose-500"
              />
              {result.errors[key] && <p id={`${id}-${key}-error`} className="mt-1 text-xs lg:text-sm text-rose-800 dark:text-rose-200">{result.errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`text-xs lg:text-sm ${passed ? 'text-emerald-800 dark:text-emerald-200' : failed ? 'text-rose-800 dark:text-rose-200' : 'text-zinc-600 dark:text-zinc-400'}`}>Waist ÷ height</p>
            <p data-testid="waist-ratio-value" className={`mt-1 text-3xl font-mono font-bold tabular-nums ${passed ? 'text-emerald-800 dark:text-emerald-200' : failed ? 'text-rose-800 dark:text-rose-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
              <ScoreNumber value={result.ratio} decimals={2} />
            </p>
          </div>
          <button
            type="button"
            disabled={!measurements.waist && !measurements.height}
            onClick={() => onChange(EMPTY_MEASUREMENTS)}
            className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm lg:text-base font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >Clear measurements</button>
        </div>
        <p className={`text-xs lg:text-sm leading-relaxed ${passed ? 'text-emerald-800 dark:text-emerald-200' : failed ? 'text-rose-800 dark:text-rose-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
          PASS: {(WAIST_RATIO_FAIL_THRESHOLD - 0.01).toFixed(2)} or lower · FAIL: {WAIST_RATIO_FAIL_THRESHOLD.toFixed(2)} or higher.<br />
          Ratio rounded to two decimals to match the chart.
        </p>
        </div>
      </m.div>
    </section>
  );
}
