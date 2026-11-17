import React, { useMemo } from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import { AssessmentInputs, GoalComponentRecommendation, calculateTargetGoalPlan } from '../utils/calculator';
import { ScoreNumber } from './ScoreNumber';
import { PerformanceSlider } from './PerformanceSlider';

interface GoalOptimizerPanelProps {
  inputs: AssessmentInputs;
  targetScore: number;
  onTargetChange: (score: number) => void;
}

const TARGET_PRESETS = [75, 80, 85, 90, 95];

function GoalPerformance({ recommendation: rec, kind }: { recommendation: GoalComponentRecommendation; kind: 'current' | 'balanced' | 'single' }) {
  if (kind === 'current') {
    return <><div className="font-semibold text-slate-900 dark:text-slate-100">{rec.currentPerformanceLabel}</div><div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{rec.currentPoints.toFixed(1)} / {rec.maxPoints} pts</div></>;
  }
  if (kind === 'balanced') {
    return <><div className="font-bold text-cyan-700 dark:text-cyan-300">{rec.balancedTargetPerformanceLabel}</div><div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{rec.balancedTargetPoints.toFixed(1)} pts ({rec.balancedDeltaLabel})</div></>;
  }
  return <><div className={rec.singlePathAchievable ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>{rec.singlePathPerformanceLabel}</div><div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">{rec.singlePathDeltaLabel}</div></>;
}

export const GoalOptimizerPanel: React.FC<GoalOptimizerPanelProps> = ({ inputs, targetScore, onTargetChange }) => {

  const plan = useMemo(
    () => calculateTargetGoalPlan(inputs, targetScore),
    [inputs, targetScore]
  );

  return (
    <section
      id="goal-calculator-section"
      aria-labelledby="goal-calculator-heading"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D111A] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="goal-calculator-heading"
            className="text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Target Score Goal Calculator</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate the exact repetitions, run times, or shuttles needed to achieve your target composite score
          </p>
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className="font-mono sm:text-right">
          <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            Target Composite:{' '}
            <strong className="text-cyan-600 dark:text-cyan-400 tabular-nums">
              <ScoreNumber value={plan.targetCompositeScore} /> pts
            </strong>
          </div>
          <div className="text-[11px] lg:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
            Current: <ScoreNumber value={plan.currentCompositeScore} /> pts ·{' '}
            {plan.alreadyAchieved ? 'Target Met' : plan.pointsGap > 0 ? <>+<ScoreNumber value={plan.pointsGap} /> pts needed</> : 'Event minimum not met'}
          </div>
        </div>
      </div>

      {/* Target Preset Buttons & Fine Slider */}
      <div className="space-y-3 mb-4">
        <div
          role="group"
          aria-label="Target Score Presets"
          className="grid grid-cols-3 min-[360px]:grid-cols-5 gap-1.5"
        >
          {TARGET_PRESETS.map((preset) => {
            const active = Math.abs(targetScore - preset) < 0.1;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => onTargetChange(preset)}
                className={`press min-h-9 rounded-md border px-1 py-1.5 text-[11px] sm:text-xs lg:text-sm font-mono font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-cyan-500 bg-cyan-500/15 text-slate-900 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {preset} pts
              </button>
            );
          })}
        </div>

        <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">
          {targetScore === 75 ? '75 points: Health Maintenance passing threshold.' : targetScore === 90 ? '90 points: Fit to Fight threshold.' : `${targetScore.toFixed(1)} points: your personal score target.`} All event minimums must also be met.
        </p>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="target-score-slider" className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">
              Custom Target
            </label>
            <span className="font-mono text-xs lg:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              <ScoreNumber value={targetScore} /> pts
            </span>
          </div>
          <PerformanceSlider
            id="target-score-slider"
            label="Custom Target"
            min={75}
            max={100}
            step={0.5}
            value={targetScore}
            valueText={`${targetScore.toFixed(1)} points`}
            formatValue={value => `${value.toFixed(1)} pts`}
            onChange={onTargetChange}
          />
        </div>
      </div>

      {plan.alreadyAchieved ? (
        <div className="p-3.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-xs lg:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Your current performance (<strong>{plan.currentCompositeScore.toFixed(1)} pts</strong>) already meets or exceeds the{' '}
            <strong>{plan.targetCompositeScore.toFixed(1)}-point</strong> target with all component minimums satisfied.
          </span>
        </div>
      ) : (
        <>
          <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {plan.recommendations.map((rec) => (
              <article key={rec.componentKey} aria-label={`${rec.componentTitle} goal`} className="py-5 first:pt-1 last:pb-0">
                <h3 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white">{rec.componentTitle}</h3>
                <p className="mt-1 text-xs lg:text-sm text-slate-500 dark:text-slate-400">{rec.eventLabel}</p>
                <dl className="mt-4 space-y-4 text-sm lg:text-base">
                  {([
                    ['current', 'Current'],
                    ['balanced', 'Balanced Goal Plan'],
                    ['single', 'Single-Event Path'],
                  ] as const).map(([kind, label]) => (
                    <div key={kind} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 items-start">
                      <dt className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">{label}</dt>
                      <dd className="text-right font-mono tabular-nums break-words"><GoalPerformance recommendation={rec} kind={kind} /></dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        <div className="hidden sm:block overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs lg:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] lg:text-sm font-mono text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Component & Event</th>
                <th className="py-2.5 px-3 font-semibold text-right">Current</th>
                <th className="py-2.5 px-3 font-semibold text-right">Balanced Goal Plan</th>
                <th className="py-2.5 px-3 font-semibold text-right">Single-Event Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              {plan.recommendations.map((rec) => (
                <tr
                  key={rec.componentKey}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {rec.componentTitle}
                    </div>
                    <div className="text-[11px] lg:text-sm text-slate-500 dark:text-slate-400">
                      {rec.eventLabel}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <div className="text-slate-900 dark:text-slate-100 font-semibold">
                      {rec.currentPerformanceLabel}
                    </div>
                    <div className="text-[11px] lg:text-sm text-slate-500">
                      {rec.currentPoints.toFixed(1)} / {rec.maxPoints} pts
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <div className="text-cyan-700 dark:text-cyan-300 font-bold">
                      {rec.balancedTargetPerformanceLabel}
                    </div>
                    <div className="text-[11px] lg:text-sm text-slate-500">
                      {rec.balancedTargetPoints.toFixed(1)} pts ({rec.balancedDeltaLabel})
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <div
                      className={
                        rec.singlePathAchievable
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {rec.singlePathPerformanceLabel}
                    </div>
                    <div className="text-[11px] lg:text-sm text-slate-500">{rec.singlePathDeltaLabel}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
};
