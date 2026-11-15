const LETTERS: Record<string, [string, string, string]> = {
  A: [' _ ', '|_|', '| |'],
  C: [' _ ', '|  ', '|_ '],
  D: [' _ ', '| \\', '|_/'],
  E: [' _ ', '|_ ', '|_ '],
  G: [' _ ', '| _', '|_|'],
  L: ['   ', '|  ', '|_ '],
  N: ['   ', '|\\|', '| |'],
  O: [' _ ', '| |', '|_|'],
  P: [' _ ', '|_)', '|  '],
  R: [' _ ', '|_)', '| \\'],
  S: [' _ ', '|_ ', ' _|'],
  T: ['___', ' | ', ' | '],
  U: ['   ', '| |', '|_|'],
  ' ': ['   ', '   ', '   '],
};

function wordArt(label: string) {
  const letters = [...label.toUpperCase()];
  const rows = [0, 1, 2].map(row => letters.map(letter => LETTERS[letter][row]).join(' '));
  return [...rows, '_'.repeat(rows[0].length)].join('\n');
}

interface AsciiNavigationProps<T extends string> {
  views: { id: T; label: string }[];
  activeView: T;
  onChange: (view: T) => void;
}

export function AsciiNavigation<T extends string>({ views, activeView, onChange }: AsciiNavigationProps<T>) {
  return <nav aria-label="Workspace Views" className="flex items-start justify-between gap-2 sm:gap-4">
    {views.map(view => <button
      key={view.id}
      type="button"
      aria-label={view.label}
      aria-pressed={activeView === view.id}
      onClick={() => onChange(view.id)}
      className={`min-h-11 shrink-0 rounded-sm py-1 text-left font-mono transition-colors cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-200 ${activeView === view.id ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'}`}
    >
      <pre aria-hidden="true" className="hidden select-none font-mono text-[7px] md:text-[8px] lg:text-[9px] font-semibold leading-[1.1] sm:block">{wordArt(view.label)}</pre>
      <span aria-hidden="true" className="block whitespace-pre select-none text-[10px] min-[375px]:text-xs leading-[1.3] sm:hidden">{`[ ${view.label} ]\n${'_'.repeat(view.label.length + 4)}`}</span>
    </button>)}
  </nav>;
}
