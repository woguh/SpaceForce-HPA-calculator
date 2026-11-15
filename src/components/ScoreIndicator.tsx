import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ComponentScoreResult } from '../utils/calculator';

interface ScoreIndicatorProps {
  result: ComponentScoreResult;
  detail?: string;
  pending?: boolean;
}

export function ScoreIndicator({ result, detail, pending = false }: ScoreIndicatorProps) {
  const isMaxed = !pending && !result.exempt && !result.isPassFailOnly &&
    result.maxPoints > 0 && result.earnedPoints >= result.maxPoints;
  const wasMaxed = useRef(isMaxed);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const reachedMaximum = isMaxed && !wasMaxed.current;
    wasMaxed.current = isMaxed;
    setCelebrating(reachedMaximum);
    if (!reachedMaximum) return;

    const timer = window.setTimeout(() => setCelebrating(false), 800);
    return () => window.clearTimeout(timer);
  }, [isMaxed]);

  if (!pending && (result.exempt || result.isPassFailOnly)) {
    return (
      <span className={`font-mono text-lg font-bold ${result.exempt
        ? 'text-slate-500 dark:text-slate-400'
        : result.passedMinimum
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-rose-700 dark:text-rose-400'}`}>
        {result.exempt ? 'EXEMPT' : `${result.passedMinimum ? 'PASS' : 'FAIL'} (Walk)`}
      </span>
    );
  }

  return (
    <div
      className={`score-indicator relative shrink-0 text-right font-mono tabular-nums ${pending
        ? 'text-slate-500 dark:text-slate-400'
        : isMaxed
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-cyan-700 dark:text-cyan-400'}`}
      data-maxed={isMaxed}
      data-celebrating={celebrating}
    >
      <div className="relative z-10 flex items-baseline justify-end gap-2 whitespace-nowrap">
        <span className="score-indicator__value inline-block text-3xl sm:text-4xl font-extrabold tracking-tight">
          {pending ? '—' : result.earnedPoints.toFixed(1)}
        </span>
        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {result.maxPoints > 0 ? `/ ${result.maxPoints} pts` : 'Not entered'}
        </span>
      </div>
      <div className="flex min-h-5 items-center justify-end gap-1 text-[11px] font-bold tracking-wide">
        {isMaxed && <><CheckCircle2 className="h-3 w-3" aria-hidden="true" /><span>MAX SCORE</span></>}
      </div>
      {detail && <p className="text-xs text-slate-600 dark:text-slate-400">{detail}</p>}
    </div>
  );
}
