import { useLayoutEffect, useRef } from 'react';

interface HighlightBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Option<T extends string> {
  value: T;
  label: string;
  tone?: 'amber';
}
interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly Option<T>[];
  equalWidth?: boolean;
  variant?: 'event' | 'reference';
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, equalWidth = false, variant = 'event', onChange }: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const highlightRef = useRef<HTMLSpanElement>(null);
  const highlightBounds = useRef<HighlightBounds | null>(null);
  const optionKey = options.map(option => option.value).join('|');
  const reference = variant === 'reference';
  const optionSize = reference
    ? 'px-2.5 py-1 text-xs sm:shrink-0 sm:whitespace-nowrap lg:text-sm'
    : 'px-1.5 py-1 text-[11px] sm:px-2.5 sm:text-xs lg:px-3 lg:py-2 lg:text-base lg:font-semibold';

  useLayoutEffect(() => {
    const container = containerRef.current;
    const highlight = highlightRef.current;
    const selected = buttonRefs.current.get(value);
    if (!container || !highlight || !selected) return;

    const place = (animate: boolean) => {
      const next = {
        x: selected.offsetLeft,
        y: selected.offsetTop,
        width: selected.offsetWidth,
        height: selected.offsetHeight,
      };
      const previous = highlightBounds.current;
      if (previous && previous.x === next.x && previous.y === next.y &&
          previous.width === next.width && previous.height === next.height) return;

      // Sample the moving highlight so a quick second selection continues from its current position.
      const from = animate && previous ? highlight.getBoundingClientRect() : null;
      const origin = from ? container.getBoundingClientRect() : null;
      highlight.getAnimations().forEach(animation => animation.cancel());
      Object.assign(highlight.style, {
        left: `${next.x}px`,
        top: `${next.y}px`,
        width: `${next.width}px`,
        height: `${next.height}px`,
      });
      highlightBounds.current = next;

      if (from && origin && from.width && from.height && next.width && next.height) {
        const dx = from.left - origin.left - next.x;
        const dy = from.top - origin.top - next.y;
        // Update layout once, then let the browser animate only the transform.
        highlight.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(${from.width / next.width}, ${from.height / next.height})` },
          { transform: 'none' },
        ], { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    };

    place(true);
    const observer = new ResizeObserver(() => place(false));
    observer.observe(container);
    buttonRefs.current.forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [value, optionKey]);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className={`relative isolate gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 ${reference
        ? 'grid w-full grid-cols-2 p-1 ring-1 ring-inset ring-slate-200 sm:flex sm:w-fit sm:flex-wrap sm:items-center dark:ring-slate-800'
        : 'flex flex-wrap items-center p-0.5'}`}
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
      <span
        ref={highlightRef}
        aria-hidden="true"
        data-testid="selection-highlight"
        className="pointer-events-none absolute left-0 top-0 -z-10 origin-top-left rounded-md bg-white shadow-xs dark:bg-slate-800 dark:ring-1 dark:ring-cyan-400/40"
      />
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
        className={`press relative rounded-md font-medium cursor-pointer ${optionSize} ${equalWidth ? 'min-w-0 flex-1' : ''} ${value === option.value ? option.tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
      >
        {option.label}
      </button>)}
    </div>
  );
}
