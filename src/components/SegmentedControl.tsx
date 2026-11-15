import { useLayoutEffect, useRef, useState } from 'react';

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
  const [bounds, setBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const optionKey = options.map(option => `${option.value}:${option.label}`).join('|');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = () => {
      const button = buttonRefs.current.get(value);
      if (!container || !button) return;
      const next = { x: button.offsetLeft, y: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight };
      setBounds(previous => previous && previous.x === next.x && previous.y === next.y
        && previous.width === next.width && previous.height === next.height ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (container) observer.observe(container);
    buttonRefs.current.forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [value, optionKey]);

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
      {bounds && <span
        aria-hidden="true"
        data-testid="selection-highlight"
        className="selection-highlight pointer-events-none absolute left-0 top-0 -z-10 rounded-md bg-white shadow-xs dark:bg-slate-800"
        style={{ width: bounds.width, height: bounds.height, transform: `translate(${bounds.x}px, ${bounds.y}px)` }}
      />}
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
        className={`relative rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-xs lg:px-3 lg:py-2 lg:text-base lg:font-semibold cursor-pointer ${equalWidth ? 'min-w-0 flex-1' : ''} ${value === option.value ? option.tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
      >
        {option.label}
      </button>)}
    </div>
  );
}
