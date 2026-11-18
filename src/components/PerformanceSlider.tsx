import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

interface PerformanceSliderProps {
  id?: string;
  label: string;
  value: number | null;
  min: number;
  max: number;
  step?: number;
  valueText: string;
  describedBy?: string;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}

export function PerformanceSlider({
  id, label, value, min, max, step = 1, valueText, describedBy, formatValue, onChange,
}: PerformanceSliderProps) {
  const [dragging, setDragging] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const bubbleRef = useRef<HTMLOutputElement>(null);
  const [halfBubbleWidth, setHalfBubbleWidth] = useState(0);
  const current = Math.min(max, Math.max(min, min + Math.round(((value ?? min) - min) / step) * step));
  const fraction = max > min ? (current - min) / (max - min) : 0;
  const displayValue = formatValue(current);
  const active = dragging || keyboardFocus;
  // Account for the thumb's inset and keep the value inside the control at both ends.
  const bubblePosition = `clamp(${halfBubbleWidth}px, calc(${fraction * 100}% + ${9 - 18 * fraction}px), calc(100% - ${halfBubbleWidth}px))`;

  useLayoutEffect(() => {
    if (bubbleRef.current) setHalfBubbleWidth(bubbleRef.current.offsetWidth / 2);
  }, [displayValue]);

  return (
    <div className="range-control relative pt-5" style={{ '--range-progress': `${fraction * 100}%` } as CSSProperties}>
      <output
        ref={bubbleRef}
        aria-hidden="true"
        data-testid="slider-value-bubble"
        data-visible={active}
        className="slider-value-bubble pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-cyan-800 px-2 py-1 text-xs font-mono font-semibold text-white dark:bg-cyan-200 dark:text-slate-950"
        style={{ left: bubblePosition }}
      >
        {displayValue}
      </output>
      <input
        id={id}
        type="range"
        aria-label={label}
        aria-describedby={describedBy}
        aria-valuetext={valueText}
        min={min}
        max={max}
        step={step}
        value={current}
        className="performance-slider block h-11 w-full rounded-md"
        data-keyboard-focus={keyboardFocus && !dragging}
        onChange={event => onChange(Number(event.target.value))}
        onFocus={event => setKeyboardFocus(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => { setKeyboardFocus(false); setDragging(false); }}
        onPointerDown={event => {
          setDragging(true);
          setKeyboardFocus(false);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={event => {
          setDragging(false);
          if (value === null) onChange(Number(event.currentTarget.value));
        }}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        onKeyDown={event => {
          if (event.key === 'Escape') { setKeyboardFocus(false); return; }
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
            setKeyboardFocus(true);
          }
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            onChange(event.key === 'Home' ? min : max);
          }
        }}
      />
    </div>
  );
}
