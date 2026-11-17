import { useEffect, useState, type RefObject } from 'react';
import { ArrowUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, useIsPresent, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { ScoreNumber } from './ScoreNumber';

interface MobileScoreSummaryProps {
  summaryRef: RefObject<HTMLElement | null>;
  active: boolean;
  score: number | null;
  status: string;
  green: boolean;
  passed: boolean;
  failed: boolean;
}

export function MobileScoreSummary(props: MobileScoreSummaryProps) {
  const { summaryRef, active } = props;
  const [pastSummary, setPastSummary] = useState(false);

  useEffect(() => {
    const summary = summaryRef.current;
    if (!summary || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setPastSummary(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(summary);
    return () => observer.disconnect();
  }, [summaryRef]);

  return <AnimatePresence initial={false}>
    {active && pastSummary && <SummaryButton key="mobile-score" {...props} />}
  </AnimatePresence>;
}

function SummaryButton({ summaryRef, score, status, green, passed, failed }: MobileScoreSummaryProps) {
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  const displayScore = score === null ? '—' : score.toFixed(1);
  const color = green
    ? 'text-emerald-700 dark:text-emerald-400'
    : failed ? 'text-rose-700 dark:text-rose-400' : 'text-cyan-700 dark:text-cyan-400';

  return (
    <m.button
      type="button"
      initial={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
      transition={{ duration: reducedMotion ? .1 : .18 }}
      disabled={!present}
      aria-hidden={!present}
      data-testid="mobile-score-summary"
      aria-label={`Back to full score summary. ${displayScore} out of 100. ${status}.`}
      onClick={() => summaryRef.current?.scrollIntoView({ block: 'start' })}
      className="mobile-score-summary fixed inset-x-0 top-0 z-30 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-left cursor-pointer sm:hidden"
    >
      <span className={`shrink-0 font-mono tabular-nums ${color}`}>
        <span className="text-2xl font-bold tracking-tight" data-testid="mobile-score-value"><ScoreNumber value={score} /></span>
        <span className="ml-1 text-xs text-slate-600 dark:text-slate-400">/ 100</span>
      </span>
      <span className={`flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold ${color}`}>
        {passed ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : failed ? <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        <span>{status}</span>
      </span>
      <ArrowUp className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
    </m.button>
  );
}
