import { ArrowRight } from 'lucide-react';
import { ALTITUDE_GROUPS, type AltitudeGroupId } from '../data/installations';
import { formatSecondsToMmSs, type ComponentScoreResult } from '../utils/calculator';

interface RunAltitudeBreakdownProps {
  timing: NonNullable<ComponentScoreResult['runTiming']>;
  altitudeGroup: AltitudeGroupId;
}

export function RunAltitudeBreakdown({ timing, altitudeGroup }: RunAltitudeBreakdownProps) {
  const steps = [
    { label: 'Your time', value: formatSecondsToMmSs(timing.rawSeconds), color: 'text-slate-900 dark:text-slate-100' },
    { label: 'Altitude adjustment', value: timing.deductionSeconds ? `−${timing.deductionSeconds}s` : '0s', color: timing.deductionSeconds ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400' },
    { label: 'Scored time', value: formatSecondsToMmSs(timing.scoredSeconds), color: 'text-cyan-700 dark:text-cyan-400' },
  ];

  return (
    <div data-testid="run-altitude-breakdown" className="space-y-2 pt-1">
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1">
        {steps.map((step, index) => (
          <div key={step.label} className="contents">
            <dt className="row-start-1 min-w-0 text-[11px] text-slate-600 dark:text-slate-400">{step.label}</dt>
            <dd className={`row-start-2 min-w-0 flex items-center justify-between gap-1 font-mono text-base font-bold tabular-nums ${step.color}`}>
              <span>{step.value}</span>
              {index < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {ALTITUDE_GROUPS[altitudeGroup].shortLabel.split(' (')[0]} · Points use the scored time.
        {timing.scoredSeconds > timing.rawSeconds - timing.deductionSeconds && ' Times below 1:00 are scored as 1:00.'}
      </p>
    </div>
  );
}
