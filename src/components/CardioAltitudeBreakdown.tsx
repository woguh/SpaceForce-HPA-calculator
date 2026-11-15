import { ArrowRight } from 'lucide-react';
import { ALTITUDE_GROUPS, type AltitudeGroupId } from '../data/installations';
import { formatHamrLevelShuttle, formatSecondsToMmSs, type ComponentScoreResult } from '../utils/calculator';

interface CardioAltitudeBreakdownProps {
  breakdown: NonNullable<ComponentScoreResult['altitudeBreakdown']>;
  altitudeGroup: AltitudeGroupId;
}
interface Step { label: string; value: string; detail?: string }

export function CardioAltitudeBreakdown({ breakdown, altitudeGroup }: CardioAltitudeBreakdownProps) {
  let steps: Step[];
  let adjusted: boolean;
  let note: string;
  if (breakdown.event === 'hamr') {
    steps = [
      { label: 'Your shuttles', value: String(breakdown.rawShuttles), detail: formatHamrLevelShuttle(breakdown.rawShuttles).split(' (')[0] },
      { label: 'Altitude bonus', value: breakdown.bonusShuttles ? `+${breakdown.bonusShuttles}` : '0' },
      { label: 'Scored shuttles', value: String(breakdown.scoredShuttles), detail: formatHamrLevelShuttle(breakdown.scoredShuttles).split(' (')[0] },
    ];
    adjusted = breakdown.bonusShuttles > 0;
    note = 'Points use the scored shuttles.';
  } else if (breakdown.event === 'walk') {
    steps = [
      { label: 'Normal pass limit', value: formatSecondsToMmSs(breakdown.standardLimitSeconds) },
      { label: 'Altitude allowance', value: breakdown.allowanceSeconds ? `+${breakdown.allowanceSeconds}s` : '0s' },
      { label: 'Your pass limit', value: formatSecondsToMmSs(breakdown.adjustedLimitSeconds) },
    ];
    adjusted = breakdown.allowanceSeconds > 0;
    note = `Your time: ${formatSecondsToMmSs(breakdown.rawSeconds)}. Pass at ${formatSecondsToMmSs(breakdown.adjustedLimitSeconds)} or faster.`;
  } else {
    steps = [
      { label: 'Your time', value: formatSecondsToMmSs(breakdown.rawSeconds) },
      { label: 'Altitude adjustment', value: breakdown.deductionSeconds ? `−${breakdown.deductionSeconds}s` : '0s' },
      { label: 'Scored time', value: formatSecondsToMmSs(breakdown.scoredSeconds) },
    ];
    adjusted = breakdown.deductionSeconds > 0;
    note = 'Points use the scored time.';
    if (breakdown.scoredSeconds > breakdown.rawSeconds - breakdown.deductionSeconds) note += ' Times below 1:00 are scored as 1:00.';
  }
  return (
    <div data-testid={`${breakdown.event}-altitude-breakdown`} className="space-y-2 pt-1">
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1">
        {steps.map((step, index) => (
          <div key={step.label} className="contents">
            <dt className="row-start-1 min-w-0 text-[11px] lg:text-sm text-slate-600 dark:text-slate-400">{step.label}</dt>
            <dd className={`row-start-2 min-w-0 flex items-start justify-between gap-1 font-mono text-base lg:text-xl font-bold tabular-nums ${index === 2 ? 'text-cyan-700 dark:text-cyan-400' : index === 1 && adjusted ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
              <span>
                <span data-testid="altitude-step-value">{step.value}</span>
                {step.detail && <span className="mt-1 block text-[11px] lg:text-sm font-normal text-slate-600 dark:text-slate-400">{step.detail}</span>}
              </span>
              {index < steps.length - 1 && <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">{ALTITUDE_GROUPS[altitudeGroup].shortLabel.split(' (')[0]} · {note}</p>
    </div>
  );
}
