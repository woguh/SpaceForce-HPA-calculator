import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { WheelPicker, WheelPickerWrapper } from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';
import { formatHeightFeetInches } from '../utils/waistRatio';

const ITEM_HEIGHT = 44;
const WHOLE_HEIGHTS = Array.from({ length: 49 }, (_, index) => 48 + index);

/** Stage a whole-inch selection; only Done or Clear changes the actual measurement. */
export default function MobileHeightPicker({ value, onConfirm }: { value: string; onConfirm: (value: string) => void }) {
  const hintId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [initialHeight] = useState(() => {
    const entered = Number(value);
    return value.trim() && Number.isFinite(entered) && entered > 0 ? Math.max(1, Math.round(entered)) : 70;
  });
  const [draft, setDraft] = useState(initialHeight);
  const options = useMemo(() => {
    const heights = WHOLE_HEIGHTS.includes(initialHeight) ? WHOLE_HEIGHTS : [...WHOLE_HEIGHTS, initialHeight].sort((a, b) => a - b);
    return heights.map(height => ({ value: height, label: formatHeightFeetInches(height) }));
  }, [initialHeight]);

  useEffect(() => {
    const wheel = wrapperRef.current?.querySelector<HTMLElement>('[data-rwp]');
    if (!wheel) return;
    // The package supplies keyboard/touch behavior; name its focusable root for assistive technology.
    wheel.setAttribute('role', 'spinbutton');
    wheel.setAttribute('aria-label', 'Height wheel');
    wheel.setAttribute('aria-describedby', hintId);
    wheel.setAttribute('aria-valuemin', String(options[0].value));
    wheel.setAttribute('aria-valuemax', String(options.at(-1)!.value));
    wheel.setAttribute('aria-valuenow', String(initialHeight));
    wheel.setAttribute('aria-valuetext', `${formatHeightFeetInches(initialHeight)}, ${initialHeight} inches`);
    wrapperRef.current?.querySelectorAll('[data-rwp-options], [data-rwp-highlight-wrapper]').forEach(element => element.setAttribute('aria-hidden', 'true'));
    wheel.focus({ preventScroll: true });
  }, [hintId, options, initialHeight]);

  useEffect(() => {
    const wheel = wrapperRef.current?.querySelector<HTMLElement>('[data-rwp]');
    wheel?.setAttribute('aria-valuenow', String(draft));
    wheel?.setAttribute('aria-valuetext', `${formatHeightFeetInches(draft)}, ${draft} inches`);
  }, [draft]);

  const confirm = () => {
    const list = wrapperRef.current?.querySelector<HTMLElement>('[data-rwp-highlight-list]');
    if (list && getComputedStyle(list).transform !== 'none') {
      // If Done is tapped during inertia, commit the closest visible row instead of a stale callback value.
      const offset = new DOMMatrixReadOnly(getComputedStyle(list).transform).m42;
      const index = Math.max(0, Math.min(options.length - 1, Math.round(-offset / ITEM_HEIGHT)));
      if (Number.isFinite(offset)) { onConfirm(String(options[index].value)); return; }
    }
    onConfirm(String(draft));
  };

  return <div className="height-wheel-panel min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
    <div ref={wrapperRef} className="py-2">
      <WheelPickerWrapper className="height-wheel">
        <WheelPicker
          defaultValue={initialHeight}
          options={options}
          onValueChange={setDraft}
          infinite={false}
          visibleCount={20}
          optionItemHeight={ITEM_HEIGHT}
          classNames={{ optionItem: 'height-wheel-option', highlightWrapper: 'height-wheel-highlight', highlightItem: 'height-wheel-selected' }}
        />
      </WheelPickerWrapper>
    </div>
    <p id={hintId} className="mt-1 text-center text-xs text-slate-600 dark:text-slate-400">For half inches, use Height (in).</p>
    <div className="mt-4 flex items-center justify-between gap-3">
      <button type="button" onClick={() => onConfirm('')} className="selector-close min-h-11 rounded-lg px-4 text-sm font-medium cursor-pointer">Clear height</button>
      <button type="button" onClick={confirm} className="min-h-11 min-w-24 rounded-lg bg-cyan-600 px-5 text-sm font-semibold text-white cursor-pointer hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200">Done</button>
    </div>
  </div>;
}
