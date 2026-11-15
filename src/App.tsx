import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { AsciiOrbitalBanner } from './components/AsciiOrbitalBanner';
import { GoalOptimizerPanel } from './components/GoalOptimizerPanel';
import { CopyResultsButton } from './components/CopyResultsButton';
import { MobileScoreSummary } from './components/MobileScoreSummary';
import { CountInput, DurationInput } from './components/PerformanceInput';
import { ScoringTablesReference } from './components/ScoringTablesReference';
import { SegmentedControl } from './components/SegmentedControl';
import { Selector } from './components/Selector';
import { ScoreIndicator } from './components/ScoreIndicator';
import { CardioAltitudeBreakdown } from './components/CardioAltitudeBreakdown';
import { WaistRatioCard } from './components/WaistRatioCard';
import { assessmentEntryCompletion, assessmentEntrySummary, assessmentInputsForEntry, EMPTY_PERFORMANCE, profileSettingsForEntry, type AssessmentEntry } from './utils/assessmentEntry';
import type { WaistMeasurements } from './utils/waistRatio';
import {
  ALTITUDE_GROUPS,
  AltitudeGroupId,
  SPACE_FORCE_INSTALLATIONS,
  SpaceForceInstallation,
} from './data/installations';
import {
  AGE_BRACKETS,
  AgeBracketId,
  CardioEventId,
  CoreEventId,
  SexCategory,
  StrengthEventId,
} from './data/scoringStandards';
import {
  calculateAssessment,
} from './utils/calculator';

const STORAGE_KEY_INPUTS = 'ussf_hpa_calculator_inputs_v1';
const STORAGE_KEY_THEME = 'ussf_hpa_calculator_theme_v1';

const DEFAULT_INPUTS: AssessmentEntry = {
  sex: 'male',
  ageBracket: 'under25',
  framework: 'ussf_hpa_60_20_20',
  installationId: 'peterson-sfb',
  altitudeGroup: 'group3',
  isManualAltitude: false,

  cardioEvent: 'run_2_0',
  strengthEvent: 'pushups',
  coreEvent: 'situps',

  cardioExempt: false,
  strengthExempt: false,
  coreExempt: false,
  whtrExempt: false,
  ...EMPTY_PERFORMANCE,
};

type ActiveTab = 'calculator' | 'goal' | 'standards';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [inputs, setInputs] = useState<AssessmentEntry>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_INPUTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cardioEvent === 'run_1_5') {
          parsed.cardioEvent = 'run_2_0';
        }
        return { ...DEFAULT_INPUTS, ...parsed, ...EMPTY_PERFORMANCE, ageBracket: 'under25', framework: 'ussf_hpa_60_20_20', whtrExempt: false };
      }
    } catch {
      // ignore
    }
    return DEFAULT_INPUTS;
  });

  const [goalTarget, setGoalTarget] = useState(90);
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [isAsciiPaused, setIsAsciiPaused] = useState(false);
  const [waistResetToken, setWaistResetToken] = useState(0);
  const [waistMeasurements, setWaistMeasurements] = useState<WaistMeasurements>({ waist: '', height: '' });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(profileSettingsForEntry(inputs)));
    } catch {
      // ignore
    }
  }, [inputs]);

  const activeInstallation = useMemo(
    () =>
      SPACE_FORCE_INSTALLATIONS.find((inst) => inst.id === inputs.installationId) ||
      SPACE_FORCE_INSTALLATIONS[0],
    [inputs.installationId]
  );

  const scoringInputs = useMemo(() => assessmentInputsForEntry(inputs), [inputs]);
  const completion = useMemo(() => assessmentEntryCompletion(inputs), [inputs]);
  const result = useMemo(() => calculateAssessment(scoringInputs), [scoringInputs]);
  const summaryPresentation = assessmentEntrySummary(inputs, result);
  const summaryAvailable = completion.all && result.totalPossiblePoints > 0;
  const summaryPassed = summaryAvailable && result.passedOverall && result.compositeScore >= 75;
  const summaryFailed = summaryAvailable && !summaryPassed;
  const summaryGreen = summaryPresentation.initial || summaryPassed;
  const summaryStatus = summaryPresentation.initial ? 'Enter event results' : completion.all ? result.readinessLabel : 'In progress';
  const summaryRef = useRef<HTMLElement>(null);
  const altitudeSpec = ALTITUDE_GROUPS[inputs.altitudeGroup];

  const updateInputs = (patch: Partial<AssessmentEntry>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  const [scoreAnnouncement, setScoreAnnouncement] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (summaryPresentation.initial) {
        setScoreAnnouncement('Starting display: 100 out of 100. Enter event results to calculate your score.');
        return;
      }
      if (!completion.all) {
        const missing = [!completion.cardio && 'cardio', !completion.strength && 'strength', !completion.core && 'core', !completion.whtr && 'body composition'].filter(Boolean).join(', ');
        setScoreAnnouncement(`Entered points so far: ${summaryPresentation.score?.toFixed(1) ?? 'none'} out of 100. Awaiting results for ${missing}.`);
        return;
      }
      if (!summaryAvailable) {
        setScoreAnnouncement(`No composite score. ${result.readinessLabel}.`);
        return;
      }
      setScoreAnnouncement(`Score ${result.compositeScore.toFixed(1)} out of 100. ${result.readinessLabel}. Cardio ${result.cardio.earnedPoints.toFixed(1)}, strength ${result.strength.earnedPoints.toFixed(1)}, core ${result.core.earnedPoints.toFixed(1)}${result.whtr.scoredInComposite ? `, body composition ${result.whtr.earnedPoints.toFixed(1)}` : ''}.`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [result, completion, summaryAvailable, summaryPresentation.initial, summaryPresentation.score]);

  const updateDuration = (
    minutesKey: 'runMinutes' | 'walkMinutes' | 'plankMinutes',
    secondsKey: 'runSeconds' | 'walkSeconds' | 'plankSeconds',
    minutes: number | null,
    seconds: number | null
  ) => updateInputs({ [minutesKey]: minutes, [secondsKey]: seconds });

  const handleSelectBase = (inst: SpaceForceInstallation) => {
    updateInputs({
      installationId: inst.id,
      altitudeGroup: inst.altitudeGroup,
      isManualAltitude: false,
    });
  };

  return (
    <div className="calculator-app relative min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#05070B] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{scoreAnnouncement}</p>
      <h1 className="sr-only">USSF HPA and PFT calculator</h1>
      <MobileScoreSummary
        summaryRef={summaryRef}
        active={activeTab === 'calculator'}
        score={summaryPresentation.score}
        status={summaryStatus}
        green={summaryGreen}
        passed={summaryPassed}
        failed={summaryFailed}
      />

      {/* Full-Viewport Animated ASCII Stars & Moving Spacecraft Background */}
      <AsciiOrbitalBanner
        installation={activeInstallation}
        activeAltitudeGroup={inputs.altitudeGroup}
        compositeScore={summaryAvailable ? result.compositeScore : null}
        passedOverall={summaryPassed}
        isPaused={isAsciiPaused}
      />

      {/* Minimal Top Bar */}
      <header className="relative z-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2 sm:gap-6 px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#05070B]/80 backdrop-blur-md">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('calculator');
          }}
          className="text-base lg:text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          USSF FITNESS
        </a>

        <nav
          aria-label="Workspace Views"
          className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 sm:gap-5 text-xs sm:text-sm lg:text-base font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 sm:border-0 pt-2 sm:pt-0"
        >
          {(
            [
              { id: 'calculator', label: 'Calculator' },
              { id: 'goal', label: 'Goal Planner' },
              { id: 'standards', label: 'Standards' },
            ] as { id: ActiveTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === t.id
                  ? 'border-cyan-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="order-2 sm:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={isAsciiPaused ? 'Resume background animation' : 'Pause background animation'}
            aria-pressed={isAsciiPaused}
            onClick={() => setIsAsciiPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs lg:text-sm font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isAsciiPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline">{isAsciiPaused ? 'Play Sky' : 'Pause Sky'}</span>
          </button>

          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs lg:text-sm font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:border-cyan-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Focused Center Workspace Floating Over Moving ASCII Sky */}
      <main className="relative z-10 flex-1 w-full max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Live Composite Score Hero */}
        <section
          ref={summaryRef}
          aria-label="Composite Score Summary"
          className={`rounded-xl border backdrop-blur-md p-6 transition-colors duration-150 ${
            summaryGreen
              ? 'border-emerald-500/40 bg-emerald-950/10 dark:bg-[#081512]/90'
              : summaryFailed
                ? 'border-rose-500/45 bg-rose-50/90 dark:bg-[#19080C]/90'
                : 'border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B0F17]/90'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs lg:text-sm font-mono text-slate-500 dark:text-slate-400">
                U.S. SPACE FORCE HPA · PFT SCORE
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  data-testid="composite-score-value"
                  className={`text-5xl sm:text-6xl font-mono font-bold tracking-tight tabular-nums ${
                    summaryGreen
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : summaryFailed
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-cyan-700 dark:text-cyan-400'
                  }`}
                >
                  {summaryPresentation.score === null ? '—' : summaryPresentation.score.toFixed(1)}
                </span>
                <span className="text-sm lg:text-base font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div
                data-testid="overall-pass-status"
                className={`inline-flex items-center gap-1.5 text-sm lg:text-base font-mono font-bold ${
                  summaryGreen
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : summaryFailed ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-700 dark:text-cyan-400'
                }`}
              >
                {summaryPassed ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : summaryFailed ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : null}
                <span>{summaryStatus}</span>
              </div>
              <div className="text-xs lg:text-sm font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Cardio {completion.cardio ? result.cardio.earnedPoints.toFixed(1) : '—'} · Strength{' '}
                {completion.strength ? result.strength.earnedPoints.toFixed(1) : '—'} · Core{' '}
                {completion.core ? result.core.earnedPoints.toFixed(1) : '—'}
                {result.whtr.scoredInComposite
                  ? ` · WHtR ${completion.whtr ? result.whtr.earnedPoints.toFixed(1) : '—'}`
                  : ''}
              </div>
            </div>
          </div>

          <CopyResultsButton inputs={scoringInputs} result={result} enabled={summaryAvailable} />

          {/* Clean Progress Bar — Turns Green at 75+ */}
          <div className="mt-4 space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
              <div
                className={`h-full transition-transform duration-150 origin-left ${
                  summaryGreen
                    ? 'bg-emerald-500'
                    : summaryFailed ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
                style={{
                  transform: `scaleX(${Math.min(1, Math.max(0, (summaryPresentation.score ?? 0) / 100))})`,
                }}
              />
            </div>
            <div className="grid grid-cols-[1rem_1fr_1fr] gap-3 text-[11px] lg:text-sm font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              <span>0</span>
              <span className="text-center">75.0 (Health Maintenance Pass)</span>
              <span className="text-right">90.0+ (Fit to Fight)</span>
            </div>
          </div>
        </section>

        {activeTab === 'calculator' && (
          <>
            {/* Compact Profile & Base Selector Card */}
            <section
              aria-label="Profile and Base Configuration"
              className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md p-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sex */}
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Sex
                  </label>
                  <SegmentedControl<SexCategory>
                    label="Sex"
                    value={inputs.sex}
                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
                    equalWidth
                    onChange={sex => updateInputs({ sex })}
                  />
                </div>

                {/* Age Group */}
                <div>
                  <label
                    htmlFor="age-select"
                    className="block text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Age Bracket
                  </label>
                  <Selector<AgeBracketId>
                    id="age-select"
                    label="Age Bracket"
                    value={inputs.ageBracket}
                    options={AGE_BRACKETS.map(bracket => ({ value: bracket.id, label: bracket.label }))}
                    onChange={ageBracket => updateInputs({ ageBracket })}
                  />
                </div>

              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="min-w-0">
                  <label htmlFor="installation-select" className="block text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Base / installation</label>
                  <Selector
                    id="installation-select" label="Base / installation" value={inputs.installationId}
                    searchLabel="Search bases" searchPlaceholder="Search a base or location…"
                    options={Object.values(ALTITUDE_GROUPS).flatMap(group => SPACE_FORCE_INSTALLATIONS
                      .filter(base => base.altitudeGroup === group.id)
                      .map(base => ({ value: base.id, label: base.name, group: group.shortLabel, description: base.stateOrCountry, keywords: `${base.id} ${base.majorUnit}` })))}
                    onChange={value => { const base = SPACE_FORCE_INSTALLATIONS.find(item => item.id === value); if (base) handleSelectBase(base); }}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="altitude-select" className="block text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Test altitude group</label>
                  <Selector<AltitudeGroupId | 'auto'>
                    id="altitude-select" label="Test altitude group" value={inputs.isManualAltitude ? inputs.altitudeGroup : 'auto'}
                    options={[{ value: 'auto', label: 'Use base altitude' }, ...Object.values(ALTITUDE_GROUPS).map(group => ({ value: group.id, label: group.shortLabel }))]}
                    onChange={value => updateInputs({ altitudeGroup: value === 'auto' ? activeInstallation.altitudeGroup : value, isManualAltitude: value !== 'auto' })}
                  />
                </div>
              </div>
              <p className="flex items-start gap-2 text-xs lg:text-sm text-slate-500 dark:text-slate-400"><MapPin className="h-4 w-4 shrink-0" />{inputs.isManualAltitude ? 'Custom test altitude: ' : `${activeInstallation.geographicElevationFt.toLocaleString()} ft · `}{altitudeSpec.shortLabel}</p>
            </section>

            {/* 1. Cardiorespiratory Card */}
            <section
              aria-label="Cardiorespiratory Component"
              className="score-card rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md p-5 space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  1. Cardiorespiratory
                </h2>
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <SegmentedControl<CardioEventId | 'exempt'>
                    label="Cardio event"
                    value={inputs.cardioExempt ? 'exempt' : inputs.cardioEvent}
                    options={[{ value: 'run_2_0', label: '2.0-Mile Run' }, { value: 'hamr', label: '20m HAMR' }, { value: 'walk_2km', label: '2.0-km Walk' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ cardioExempt: !inputs.cardioExempt })
                      : updateInputs({ cardioEvent: event, cardioExempt: false })}
                  />
                  <ScoreIndicator result={result.cardio} pending={!completion.cardio} />
                </div>
              </div>

              {inputs.cardioExempt ? (
                <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 py-1">
                  Cardiorespiratory component medically exempt. Composite score is calculated from remaining non-exempt components.
                </div>
              ) : inputs.cardioEvent === 'hamr' ? (
                <div className="space-y-2">
                  <CountInput label="HAMR shuttles" sliderLabel="HAMR shuttles" value={inputs.hamrShuttles} min={0} max={130} onChange={(value) => updateInputs({ hamrShuttles: value })} />
                </div>
              ) : inputs.cardioEvent === 'walk_2km' ? (
                <div className="space-y-2">
                  <DurationInput label="Walk time" sliderLabel="Walk time slider" minutes={inputs.walkMinutes} seconds={inputs.walkSeconds} min={15} max={3600} onChange={(minutes, seconds) => updateDuration('walkMinutes', 'walkSeconds', minutes, seconds)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <DurationInput label="Run time" sliderLabel="Run time slider" minutes={inputs.runMinutes} seconds={inputs.runSeconds} min={15} max={3600} sliderMax={1800} onChange={(minutes, seconds) => updateDuration('runMinutes', 'runSeconds', minutes, seconds)} />
                </div>
              )}

              {!inputs.cardioExempt && completion.cardio && result.cardio.altitudeBreakdown && <CardioAltitudeBreakdown breakdown={result.cardio.altitudeBreakdown} altitudeGroup={inputs.altitudeGroup} />}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs lg:text-sm font-mono text-slate-500">
                <span>
                  Min Pass: {result.cardio.minimumRequirementLabel} · Max:{' '}
                  {result.cardio.maximumRequirementLabel}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400">
                  {completion.cardio ? `Next: ${result.cardio.nextThreshold.improvementNeededLabel}` : 'Enter a result to see points.'}
                </span>
              </div>
            </section>

            {/* 2. Muscular Strength Card */}
            <section
              aria-label="Muscular Strength Component"
              className="score-card rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md p-5 space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  2. Muscular Strength
                </h2>
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <SegmentedControl<StrengthEventId | 'exempt'>
                    label="Strength event"
                    value={inputs.strengthExempt ? 'exempt' : inputs.strengthEvent}
                    options={[{ value: 'pushups', label: 'Push-ups (1m)' }, { value: 'hr_pushups', label: 'Hand-Release (2m)' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ strengthExempt: !inputs.strengthExempt })
                      : updateInputs({ strengthEvent: event, strengthExempt: false })}
                  />
                  <ScoreIndicator result={result.strength} pending={!completion.strength} />
                </div>
              </div>

              {inputs.strengthExempt ? (
                <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 py-1">
                  Muscular strength component medically exempt. Composite score is calculated from remaining non-exempt components.
                </div>
              ) : (
                <CountInput label="Strength repetitions" sliderLabel="Strength repetitions slider" value={inputs.strengthReps} min={0} max={100} onChange={(value) => updateInputs({ strengthReps: value })} />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs lg:text-sm font-mono text-slate-500">
                <span>
                  Min Pass: {result.strength.minimumRequirementLabel} · Max:{' '}
                  {result.strength.maximumRequirementLabel}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400">
                  {completion.strength ? `Next: ${result.strength.nextThreshold.improvementNeededLabel}` : 'Enter a result to see points.'}
                </span>
              </div>
            </section>

            {/* 3. Core Endurance Card */}
            <section
              aria-label="Core Endurance Component"
              className="score-card rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md p-5 space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  3. Core Endurance
                </h2>
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <SegmentedControl<CoreEventId | 'exempt'>
                    label="Core event"
                    value={inputs.coreExempt ? 'exempt' : inputs.coreEvent}
                    options={[{ value: 'situps', label: 'Sit-ups (1m)' }, { value: 'plank', label: 'Plank' }, { value: 'crunches', label: 'Reverse Crunch (2m)' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ coreExempt: !inputs.coreExempt })
                      : updateInputs({ coreEvent: event, coreExempt: false })}
                  />
                  <ScoreIndicator result={result.core} pending={!completion.core} />
                </div>
              </div>

              {inputs.coreExempt ? (
                <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 py-1">
                  Core endurance component medically exempt. Composite score is calculated from remaining non-exempt components.
                </div>
              ) : inputs.coreEvent === 'plank' ? (
                <DurationInput label="Plank duration" sliderLabel="Plank duration slider" minutes={inputs.plankMinutes} seconds={inputs.plankSeconds} min={0} max={600} onChange={(minutes, seconds) => updateDuration('plankMinutes', 'plankSeconds', minutes, seconds)} />
              ) : (
                <CountInput label="Core repetitions" sliderLabel="Core repetitions slider" value={inputs.coreReps} min={0} max={100} onChange={(value) => updateInputs({ coreReps: value })} />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs lg:text-sm font-mono text-slate-500">
                <span>
                  Min Pass: {result.core.minimumRequirementLabel} · Max:{' '}
                  {result.core.maximumRequirementLabel}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400">
                  {completion.core ? `Next: ${result.core.nextThreshold.improvementNeededLabel}` : 'Enter a result to see points.'}
                </span>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs lg:text-sm text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => {
                  setInputs(DEFAULT_INPUTS);
                  setWaistMeasurements({ waist: '', height: '' });
                  setWaistResetToken((token) => token + 1);
                }}
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Values</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('goal')}
                className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Need a target score plan? Open Goal Planner →
              </button>
            </div>
            <WaistRatioCard key={waistResetToken} measurements={waistMeasurements} onChange={setWaistMeasurements} />
          </>
        )}

        {activeTab === 'goal' && (summaryAvailable ? <GoalOptimizerPanel inputs={scoringInputs} targetScore={goalTarget} onTargetChange={setGoalTarget} /> : (
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B0F17]/90 p-5 space-y-3">
            <h2 className="text-base lg:text-lg font-bold">{completion.all ? 'Goal Planner needs a scored event' : 'Enter your event results first'}</h2>
            <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">{completion.all ? 'Choose at least one point-scored event to build a goal plan.' : 'Fill in your selected events or mark an exemption to build a goal plan from your actual performance.'}</p>
            <button type="button" onClick={() => setActiveTab('calculator')} className="min-h-11 rounded-lg bg-cyan-500 px-4 py-2 text-sm lg:text-base font-semibold text-slate-950 cursor-pointer">Go to Calculator</button>
          </section>
        ))}

        {activeTab === 'standards' && (
          <ScoringTablesReference
            activeSex={inputs.sex}
            activeAgeBracket={inputs.ageBracket}
          />
        )}
      </main>
    </div>
  );
}
