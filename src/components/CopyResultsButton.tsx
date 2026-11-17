import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { AssessmentInputs, AssessmentResult } from '../utils/calculator';
import { formatResultSummary } from '../utils/resultSummary';
import { toast } from '@/components/ui/toast';

export function CopyResultsButton({ inputs, result, enabled }: { inputs: AssessmentInputs; result: AssessmentResult; enabled: boolean }) {
  const [state, setState] = useState<'ready' | 'copied' | 'manual'>('ready');
  const id = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const text = formatResultSummary(inputs, result);
  useEffect(() => { setState('ready'); }, [text, enabled]);
  useEffect(() => {
    if (state === 'manual') { textRef.current?.focus(); textRef.current?.select(); }
    if (state !== 'copied') return;
    const timer = window.setTimeout(() => setState('ready'), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setState('copied'); toast.success('> RESULTS COPIED', { description: `${result.compositeScore.toFixed(1)} / 100 · ready to paste` }); }
    catch { setState('manual'); }
  };
  return (
    <div className="mt-1 space-y-2 text-right">
      <button type="button" onClick={copy} disabled={!enabled} aria-describedby={!enabled ? `${id}-hint` : undefined} className="press inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed">
        {state === 'copied' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
        {state === 'copied' ? 'Copied!' : 'Copy results'}
      </button>
      {!enabled && <p id={`${id}-hint`} className="sr-only">Complete your events to copy results.</p>}
      <p role="status" className="sr-only">{state === 'copied' ? 'Results copied to clipboard.' : state === 'manual' ? 'Select and copy your results below.' : ''}</p>
      {state === 'manual' && enabled && <div className="space-y-2 text-left">
        <label htmlFor={`${id}-text`} className="block text-xs text-slate-600 dark:text-slate-300">Copy the summary below:</label>
        <textarea id={`${id}-text`} ref={textRef} readOnly value={text} rows={8} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100" />
      </div>}
    </div>
  );
}
