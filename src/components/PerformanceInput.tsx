import React, { useId } from 'react';

interface IntegerInputProps {
  label: string;
  accessibleLabel?: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
}

function IntegerInput({ label, accessibleLabel, value, min, max, onChange }: IntegerInputProps) {
  const id = useId();
  const invalid = value !== null && (!Number.isInteger(value) || value < min || value > max);
  const finishEditing = () => {
    if (value !== null) onChange(Math.min(max, Math.max(min, Math.round(value))));
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        aria-label={accessibleLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        min={min}
        max={max}
        step={1}
        value={value ?? ''}
        onChange={(event) => {
          const text = event.target.value;
          onChange(text === '' || !Number.isFinite(Number(text)) ? null : Number(text));
        }}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        className="w-full min-h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xl font-mono font-bold tabular-nums text-slate-900 dark:text-white caret-cyan-500 aria-invalid:border-rose-500"
      />
      {invalid && <p id={`${id}-error`} className="mt-1 text-xs text-rose-700 dark:text-rose-300">Enter {min}–{max}.</p>}
    </div>
  );
}

interface PerformanceInputProps {
  label: string;
  sliderLabel: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
}

function StepButtons({ label, value, min, max, onChange, step, unit }: PerformanceInputProps & { step: number; unit: string }) {
  return (
    <div className="flex gap-1.5 self-end">
      {[-step, step].map((delta) => (
        <button
          key={delta}
          type="button"
          aria-label={`${delta < 0 ? 'Decrease' : 'Increase'} ${label.toLowerCase()} by ${step} ${unit}`}
          disabled={value !== null && (delta < 0 ? value <= min : value >= max)}
          onClick={() => onChange(Math.min(max, Math.max(min, (value ?? 0) + delta)))}
          className="min-h-11 min-w-11 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-mono text-sm font-semibold cursor-pointer hover:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {delta > 0 ? '+' : '−'}{step}{unit === 'seconds' ? 's' : ''}
        </button>
      ))}
    </div>
  );
}

interface DurationInputProps extends Omit<PerformanceInputProps, 'value' | 'onChange'> {
  sliderMax?: number;
  minutes: number | null;
  seconds: number | null;
  onChange: (minutes: number | null, seconds: number | null) => void;
}

export function DurationInput({ label, sliderLabel, minutes, seconds, min, max, sliderMax = max, onChange }: DurationInputProps) {
  const sliderHintId = useId();
  const entered = minutes !== null && seconds !== null;
  const value = entered ? minutes * 60 + seconds : null;
  const duration = entered ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : 'Not entered';
  const updateTotal = (total: number | null) => {
    if (total === null) return onChange(null, null);
    onChange(Math.floor(total / 60), total % 60);
  };

  return (
    <fieldset className="space-y-2 min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-2 w-44 max-w-full">
          <IntegerInput label="Minutes" accessibleLabel={`${label} minutes`} value={minutes} min={0} max={Math.floor(max / 60)} onChange={(next) => onChange(next, seconds)} />
          <IntegerInput label="Seconds" accessibleLabel={`${label} seconds`} value={seconds} min={minutes === Math.floor(min / 60) ? min % 60 : 0} max={minutes === Math.floor(max / 60) ? max % 60 : 59} onChange={(next) => onChange(minutes, next)} />
        </div>
        <StepButtons label={label} sliderLabel={sliderLabel} value={value} min={min} max={max} onChange={updateTotal} step={10} unit="seconds" />
      </div>
      <input type="range" aria-label={sliderLabel} aria-describedby={sliderMax < max ? sliderHintId : undefined} aria-valuetext={value !== null && value > sliderMax ? `Slider at its ${sliderMax / 60} minute limit. Entered time: ${duration}` : duration} min={min} max={sliderMax} step={1} value={Math.min(value ?? min, sliderMax)} onChange={(event) => updateTotal(Number(event.target.value))} onPointerUp={(event) => { if (value === null) updateTotal(Number(event.currentTarget.value)); }} onKeyDown={(event) => { if (event.key === 'Home') updateTotal(min); if (event.key === 'End') updateTotal(sliderMax); }} className="w-full h-11 accent-cyan-500 cursor-pointer" />
      {sliderMax < max && <p id={sliderHintId} className="sr-only">Slider limited to {sliderMax / 60} minutes. Enter longer times using the minutes and seconds fields.</p>}
    </fieldset>
  );
}

export function CountInput(props: PerformanceInputProps) {
  const { label, sliderLabel, value, min, max, onChange } = props;
  return (
    <fieldset className="space-y-2 min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-28">
          <IntegerInput label={label} value={value} min={min} max={max} onChange={onChange} />
        </div>
        <StepButtons {...props} step={1} unit={label === 'HAMR shuttles' ? 'shuttle' : 'repetition'} />
      </div>
      <input type="range" aria-label={sliderLabel} aria-valuetext={value === null ? 'Not entered' : `${value} ${label === 'HAMR shuttles' ? 'shuttles' : 'repetitions'}`} min={min} max={max} step={1} value={value ?? min} onChange={(event) => onChange(Number(event.target.value))} onPointerUp={(event) => { if (value === null) onChange(Number(event.currentTarget.value)); }} onKeyDown={(event) => { if (event.key === 'Home') onChange(min); if (event.key === 'End') onChange(max); }} className="w-full h-11 accent-cyan-500 cursor-pointer" />
    </fieldset>
  );
}
