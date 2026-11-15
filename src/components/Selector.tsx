import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SelectorOption<T extends string = string> {
  value: T;
  label: string;
  group?: string;
  description?: string;
  keywords?: string;
}

interface SelectorProps<T extends string> {
  id?: string;
  label: string;
  value: T;
  options: SelectorOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  valueLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  largeList?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFKD')
    .replace(/[‘’′']/g, ' ft ').replace(/[“”″"]/g, ' in ')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
}

function nextMatch<T extends string>(options: SelectorOption<T>[], query: string, current: string) {
  const matches = options.filter(option => normalize(option.label).startsWith(normalize(query)));
  if (!matches.length) return undefined;
  const index = matches.findIndex(option => option.value === current);
  return matches[(index + 1) % matches.length];
}

export function Selector<T extends string>({
  id, label, value, options, onChange, placeholder = 'Choose an option',
  valueLabel, searchLabel, searchPlaceholder, largeList = false, invalid, describedBy,
}: SelectorProps<T>) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef({ text: '', time: 0 });
  const [opening, setOpening] = useState<{ query: string; active: string } | null>(null);
  const selected = options.find(option => option.value === value);
  const display = value === '' ? placeholder : selected?.label ?? valueLabel ?? placeholder;
  const popupId = `${generatedId}-popup`;
  const valueId = `${generatedId}-value`;
  const dismiss = useCallback((restoreFocus = true) => {
    setOpening(null);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  return <>
    <button
      ref={triggerRef}
      id={id}
      type="button"
      aria-label={label}
      aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
      aria-haspopup="dialog"
      aria-expanded={opening !== null}
      aria-controls={opening ? popupId : undefined}
      aria-invalid={invalid || undefined}
      className={`selector-trigger flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm lg:text-base font-medium cursor-pointer transition-colors ${invalid ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'} bg-slate-50 text-slate-900 hover:border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400`}
      onClick={() => opening ? dismiss() : setOpening({ query: '', active: value })}
      onKeyDown={event => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const active = event.key === 'Home' ? options[0]?.value
            : event.key === 'End' ? options.at(-1)?.value : value;
          setOpening({ query: '', active: active ?? '' });
        } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          if (searchLabel) setOpening({ query: event.key, active: value });
          else {
            const previous = Date.now() - typeahead.current.time < 700 ? typeahead.current.text : '';
            const query = previous === event.key ? event.key : previous + event.key;
            typeahead.current = { text: query, time: Date.now() };
            const match = nextMatch(options, query, value);
            if (match) onChange(match.value);
          }
        }
      }}
    >
      <span id={valueId} className={`min-w-0 truncate ${value === '' ? 'text-slate-500 dark:text-slate-400' : ''}`}>{display}</span>
      <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${opening ? 'rotate-180' : ''}`} />
    </button>
    {opening && createPortal(<SelectorPopup
      id={popupId} label={label} value={value} options={options}
      opening={opening} anchor={triggerRef.current!}
      searchLabel={searchLabel} searchPlaceholder={searchPlaceholder} largeList={largeList}
      onDismiss={dismiss} onSelect={next => { onChange(next); dismiss(); }}
    />, document.body)}
  </>;
}

interface PopupProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: SelectorOption<T>[];
  opening: { query: string; active: string };
  anchor: HTMLButtonElement;
  searchLabel?: string;
  searchPlaceholder?: string;
  largeList: boolean;
  onDismiss: (restoreFocus?: boolean) => void;
  onSelect: (value: T) => void;
}

function SelectorPopup<T extends string>({
  id, label, value, options, opening, anchor, searchLabel, searchPlaceholder, largeList, onDismiss, onSelect,
}: PopupProps<T>) {
  const panelRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', time: 0 });
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [position, setPosition] = useState<CSSProperties>({ opacity: 0 });
  const [query, setQuery] = useState(opening.query);
  const [activeValue, setActiveValue] = useState(opening.active);
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const filtered = options.filter(option => {
    const text = normalize(`${option.label} ${option.group ?? ''} ${option.description ?? ''} ${option.keywords ?? ''}`);
    return tokens.every(token => /^\d+(?:\.\d+)?$/.test(token)
      ? text.split(' ').some(word => word === token || word.startsWith(token.includes('.') ? token : `${token}.`))
      : text.includes(token));
  });
  const active = filtered.find(option => option.value === activeValue)
    ?? (query || activeValue === '' ? filtered[0] : undefined);
  const listId = `${id}-list`;
  const activeId = active ? `${id}-option-${filtered.indexOf(active)}` : undefined;
  const groups = [...new Set(filtered.map(option => option.group ?? ''))];

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current!;
    const place = () => {
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const bottom = window.innerHeight - viewportTop - viewportHeight;
      if (compact) {
        setPosition({ left: 0, top: 'auto', bottom, width: '100%', maxHeight: Math.min(largeList ? 680 : 560, viewportHeight * (largeList ? .92 : .85)) });
      } else {
        const rect = anchor.getBoundingClientRect();
        const below = viewportTop + viewportHeight - rect.bottom - 18;
        const above = rect.top - viewportTop - 18;
        const down = below >= (largeList ? 600 : Math.min(300, viewportHeight * .5)) || below >= above;
        const width = Math.min(Math.max(rect.width, 280), viewportWidth - 24);
        setPosition({
          left: Math.max(12, Math.min(rect.left, viewportWidth - width - 12)),
          top: down ? rect.bottom + 6 : 'auto',
          bottom: down ? 'auto' : window.innerHeight - rect.top + 6,
          width, maxHeight: Math.max(80, Math.min(largeList ? 600 : 420, down ? below : above)),
        });
      }
    };
    compact ? panel.showModal() : panel.show();
    place();
    // Opening a touch sheet should not summon the software keyboard before a search is requested.
    (searchLabel && (!compact || opening.query) ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!compact && !panel.contains(event.target as Node) && !anchor.contains(event.target as Node)) onDismiss(false);
    };
    const scroll = (event: Event) => { if (!panel.contains(event.target as Node)) place(); };
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', scroll, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    const oldOverflow = document.documentElement.style.overflow;
    if (compact) document.documentElement.style.overflow = 'hidden';
    return () => {
      panel.close();
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', scroll, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
      if (compact) document.documentElement.style.overflow = oldOverflow;
    };
  }, [compact, anchor, largeList, onDismiss]);

  useLayoutEffect(() => {
    if (activeId && position.opacity !== 0) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId, active?.value, position.maxHeight]);

  const handleKeys = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onDismiss(); return; }
    if (event.key === 'Tab' && !compact) {
      event.preventDefault();
      const controls = [...document.querySelectorAll<HTMLElement>('button, input, select, a[href], [tabindex="0"]')]
        .filter(element => !panelRef.current?.contains(element) && element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length);
      const index = controls.indexOf(anchor);
      const next = controls[index + (event.shiftKey ? -1 : 1)];
      onDismiss(false);
      requestAnimationFrame(() => (next ?? anchor).focus());
      return;
    }
    if (event.target !== listRef.current && event.target !== searchRef.current) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length) {
        const index = active ? filtered.indexOf(active) : event.key === 'ArrowDown' ? -1 : 0;
        setActiveValue(filtered[(index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % filtered.length].value);
      }
    } else if ((event.key === 'Home' || event.key === 'End') && event.target === listRef.current) {
      event.preventDefault();
      setActiveValue((event.key === 'Home' ? filtered[0] : filtered.at(-1))?.value ?? '');
    } else if (event.key === 'Enter' || (event.key === ' ' && event.target === listRef.current)) {
      event.preventDefault();
      if (active) onSelect(active.value);
    } else if (!searchLabel && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const previous = Date.now() - typeahead.current.time < 700 ? typeahead.current.text : '';
      const text = previous === event.key ? event.key : previous + event.key;
      typeahead.current = { text, time: Date.now() };
      const match = nextMatch(filtered, text, active?.value ?? '');
      if (match) setActiveValue(match.value);
    }
  };

  return <dialog
    ref={panelRef} id={id} aria-label={label} aria-modal={compact}
    className={`selector-surface ${compact ? 'selector-sheet' : 'selector-popover'}`}
    style={position} onKeyDown={handleKeys}
    onCancel={event => { event.preventDefault(); onDismiss(); }}
    onClick={event => {
      if (!compact || event.target !== panelRef.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom || event.clientX < rect.left || event.clientX > rect.right) onDismiss();
    }}
  >
    {compact && <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2 pb-1">
      <h2 className="text-base font-bold">{label}</h2>
      <button type="button" aria-label={`Close ${label}`} className="selector-close flex h-11 w-11 shrink-0 items-center justify-center rounded-lg cursor-pointer" onClick={() => onDismiss()}>
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>}
    {searchLabel && <div className="selector-search mx-2 mt-2 mb-1 flex shrink-0 items-center gap-2 rounded-lg border px-3">
      <Search className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      <input
        ref={searchRef} type="search" role="combobox" aria-label={searchLabel}
        aria-autocomplete="list" aria-controls={listId} aria-expanded="true" aria-activedescendant={activeId}
        value={query} placeholder={searchPlaceholder ?? searchLabel}
        autoComplete="off" spellCheck={false}
        className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 caret-cyan-500"
        onChange={event => { setQuery(event.target.value); setActiveValue(''); }}
      />
      {query && <button type="button" aria-label="Clear search" className="selector-close -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md cursor-pointer" onClick={() => { setQuery(''); setActiveValue(value); searchRef.current?.focus(); }}>
        <X className="h-4 w-4" aria-hidden="true" />
      </button>}
    </div>}
    <div ref={listRef} id={listId} role="listbox" aria-label={label} aria-activedescendant={activeId}
      tabIndex={0} className="selector-options min-h-0 overflow-y-auto overscroll-contain p-1.5 outline-none">
      {groups.map((group, groupIndex) => <div key={group} role={group ? 'group' : undefined} aria-labelledby={group ? `${id}-group-${groupIndex}` : undefined}>
        {group && <div id={`${id}-group-${groupIndex}`} className="selector-group px-2.5 pt-3 pb-1.5 text-xs font-semibold">{group}</div>}
        {filtered.filter(option => (option.group ?? '') === group).map(option => <div
          key={option.value} id={`${id}-option-${filtered.indexOf(option)}`} role="option"
          aria-selected={option.value === value} data-highlighted={option.value === active?.value}
          className="selector-option flex min-h-11 items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm sm:text-base cursor-pointer"
          onPointerMove={event => { if (event.pointerType === 'mouse') setActiveValue(option.value); }}
          onMouseDown={event => event.preventDefault()}
          onClick={() => onSelect(option.value)}
        >
          <span className="min-w-0">
            <span className="block break-words">{option.label}</span>
            {option.description && <span className="selector-description mt-0.5 block text-xs">{option.description}</span>}
          </span>
          <span className="w-4 shrink-0">{option.value === value && <Check className="h-4 w-4 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />}</span>
        </div>)}
      </div>)}
    </div>
    {!filtered.length && <p className="selector-description px-3 py-6 text-center text-sm" role="status">No matches. Try another search.</p>}
  </dialog>;
}
