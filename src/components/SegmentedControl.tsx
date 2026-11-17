import { useId, useRef } from 'react';
import * as m from 'motion/react-m';

/** Shared UI spring: settles in ~200ms with no overshoot. */
const SPRING = { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 } as const;

interface Option<T extends string> {
  value: T;
  label: string;
  tone?: 'amber';
}
interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  equalWidth?: boolean;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, equalWidth = false, onChange }: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const highlightId = useId();

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className="relative isolate flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900"
      onKeyDown={event => {
        const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!direction && event.key !== 'Home' && event.key !== 'End') return;
        const index = options.findIndex(option => buttonRefs.current.get(option.value) === event.target);
        if (index < 0) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (index + direction + options.length) % options.length;
        const next = options[nextIndex].value;
        buttonRefs.current.get(next)?.focus();
        if (next !== value) onChange(next);
      }}
    >
      {options.map(option => <button
        key={option.value}
        ref={element => {
          if (element) buttonRefs.current.set(option.value, element);
          else buttonRefs.current.delete(option.value);
        }}
        type="button"
        aria-pressed={value === option.value}
        tabIndex={value === option.value ? 0 : -1}
        onClick={() => onChange(option.value)}
        className={`press relative rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-xs lg:px-3 lg:py-2 lg:text-base lg:font-semibold cursor-pointer ${equalWidth ? 'min-w-0 flex-1' : ''} ${value === option.value ? option.tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
      >
        {value === option.value && <m.span
          aria-hidden="true"
          data-testid="selection-highlight"
          layoutId={`segment-${highlightId}`}
          transition={SPRING}
          className="pointer-events-none absolute inset-0 -z-10 rounded-md bg-white shadow-xs dark:bg-slate-800 dark:ring-1 dark:ring-cyan-400/40"
        />}
        {option.label}
      </button>)}
    </div>
  );
}
