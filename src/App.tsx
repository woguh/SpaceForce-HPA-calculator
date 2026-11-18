import React, { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as m from 'motion/react-m';
import {
  AlertTriangle,
  CheckCircle2,
  Github,
  MapPin,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { GoalOptimizerPanel } from './components/GoalOptimizerPanel';
import { CopyResultsButton } from './components/CopyResultsButton';
import { MobileScoreSummary } from './components/MobileScoreSummary';
import { CountInput, DurationInput } from './components/PerformanceInput';
import { ScoringTablesReference } from './components/ScoringTablesReference';
import { SegmentedControl } from './components/SegmentedControl';
import { Selector } from './components/Selector';
import { ScoreIndicator } from './components/ScoreIndicator';
import { ScoreNumber } from './components/ScoreNumber';
import { CardioAltitudeBreakdown } from './components/CardioAltitudeBreakdown';
import { WaistRatioCard } from './components/WaistRatioCard';
import { ForegroundAsteroid } from './components/ForegroundAsteroid';
import type { OrbitalDisplayProps } from './components/OrbitalDisplay';
import { useReducedMotionPreference } from './hooks/useReducedMotionPreference';
import './flight-console.css';
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

function UnavailableOrbit({ onUnavailable }: OrbitalDisplayProps) {
  useEffect(onUnavailable, [onUnavailable]);
  return null;
}

const OrbitalDisplay = lazy<React.ComponentType<OrbitalDisplayProps>>(() => import('./components/OrbitalDisplay')
  .catch(() => ({ default: UnavailableOrbit })));
const ORBIT_QUERY = '(min-width: 1024px) and (pointer: fine)';
const showsDesktopOrbit = () => window.matchMedia(ORBIT_QUERY).matches;
const hideServerOrbit = () => false;
function subscribeToOrbitVisibility(change: () => void) {
  const query = window.matchMedia(ORBIT_QUERY);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
}

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

const WORKSPACE_VIEWS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'goal', label: 'Goal Planner' },
  { id: 'standards', label: 'Standards' },
] as const;
type ActiveTab = (typeof WORKSPACE_VIEWS)[number]['id'];

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
  const workspaceRef = useRef<HTMLDivElement>(null);
  const focusWorkspace = useRef(false);
  const [orbitPaused, setOrbitPaused] = useState(false);
  const [orbitUnavailable, setOrbitUnavailable] = useState(false);
  const disableOrbit = useCallback(() => setOrbitUnavailable(true), []);
  const desktopOrbit = useSyncExternalStore(subscribeToOrbitVisibility, showsDesktopOrbit, hideServerOrbit);
  const showOrbit = desktopOrbit && !orbitUnavailable;
  const reducedMotion = useReducedMotionPreference();
  const [waistResetToken, setWaistResetToken] = useState(0);
  const [waistMeasurements, setWaistMeasurements] = useState<WaistMeasurements>({ waist: '', height: '' });

  useLayoutEffect(() => {
    if (!focusWorkspace.current) return;
    focusWorkspace.current = false;
    workspaceRef.current?.focus({ preventScroll: true });
    workspaceRef.current?.scrollIntoView({ block: 'start' });
  }, [activeTab]);

  const openWorkspace = (tab: ActiveTab) => {
    focusWorkspace.current = true;
    setActiveTab(tab);
  };

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
    <div className="calculator-app flight-console relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{scoreAnnouncement}</p>
      <h1 className="sr-only">USSF HPA and PFT calculator</h1>
      <MobileScoreSummary
        summaryRef={summaryRef}
        active={activeTab === 'calculator'}
        score={summaryPresentation.score}
        status={summaryStatus}
        green={summaryPassed}
        passed={summaryPassed}
        failed={summaryFailed}
      />
      {showOrbit && <div className="flight-orbit" aria-hidden="true">
        <Suspense fallback={null}>
          <OrbitalDisplay paused={orbitPaused || reducedMotion} onUnavailable={disableOrbit} />
        </Suspense>
      </div>}
      {showOrbit && !orbitPaused && !reducedMotion && <ForegroundAsteroid />}

      <div className="flight-tools relative z-20 flex justify-end px-4 sm:px-8 pt-3 sm:pt-4">
        <div className="flex items-center gap-2">
          {showOrbit && !reducedMotion && <button
            type="button"
            aria-label={orbitPaused ? 'Resume orbital display animation' : 'Pause orbital display animation'}
            aria-pressed={orbitPaused}
            onClick={() => setOrbitPaused(paused => !paused)}
            title={orbitPaused ? 'Resume orbital display' : 'Pause orbital display'}
            className="press inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:border-cyan-500 cursor-pointer shrink-0"
          >
            {orbitPaused ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
          </button>}

          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="press inline-flex h-11 w-24 sm:h-10 sm:w-24 items-center justify-center text-sm font-medium leading-none rounded-[14px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 hover:border-cyan-500 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {theme === 'dark'
                ? <Sun className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                : <Moon className="h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />}
              <span className="block leading-none">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </span>
          </button>

          <a
            href="https://github.com/woguh/SpaceForce-HPA-calculator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub (opens in a new tab)"
            title="View source on GitHub"
            className="press inline-flex h-11 w-11 sm:h-10 sm:w-10 pointer-coarse:min-h-11 pointer-coarse:min-w-11 items-center justify-center rounded-[50%] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:border-cyan-500 shrink-0"
          >
            <Github className="h-[18px] w-[18px]" aria-hidden="true" />
          </a>
        </div>
      </div>

      <main className="flight-workspace relative z-10 flex-1 w-full max-w-3xl px-4 sm:px-6 pt-2 sm:pt-3 pb-8 space-y-6" data-orbital-display={showOrbit}>
        <nav aria-label="Workspace Views">
          <SegmentedControl<ActiveTab>
            label="Pages"
            value={activeTab}
            options={WORKSPACE_VIEWS.map(view => ({ value: view.id, label: view.label }))}
            variant="workspace"
            equalWidth
            onChange={setActiveTab}
          />
        </nav>
        {/* Live Composite Score Hero */}
        <section
          ref={summaryRef}
          aria-label="Composite Score Summary"
          className="flight-score flight-case"
          data-score-tone={summaryFailed ? 'fail' : summaryPassed ? 'pass' : 'ready'}
        >
          <div className="flight-score__readout">
          <div className="flight-score__top">
            <div>
              <h2 className="flight-score__heading">HPA composite score</h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  data-testid="composite-score-value"
                  className={`flight-score__value font-mono font-bold tabular-nums ${
                    summaryPassed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : summaryFailed
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-cyan-700 dark:text-cyan-400'
                  }`}
                >
                  <ScoreNumber value={summaryPresentation.score} />
                </span>
                <span className="text-sm lg:text-base font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="flight-score__status space-y-1">
              <div
                data-testid="overall-pass-status"
                className={`inline-flex items-center gap-1.5 text-sm lg:text-base font-mono font-bold ${
                  summaryPassed
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
              <CopyResultsButton inputs={scoringInputs} result={result} enabled={summaryAvailable} />
            </div>
          </div>

          {/* Clean Progress Bar — Turns Green at 75+ */}
          <div className="flight-score__meter space-y-2">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-900">
              <m.div
                initial={false}
                className={`h-full origin-left ${
                  summaryPassed
                    ? 'bg-emerald-500'
                    : summaryFailed ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
                animate={{
                  scaleX: Math.min(1, Math.max(0, (summaryPresentation.score ?? 0) / 100)),
                }}
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3/4 w-0.5 -translate-x-1/2 bg-white ring-1 ring-slate-950/80" />
            </div>
            <span aria-hidden="true" className="flight-score__ruler" />
            <div className="flight-score__scale" aria-hidden="true">
              <span>0</span><span>75</span><span>90</span><span>100</span>
            </div>
            <div className="flight-score__thresholds">
              <span><b>75</b> Health Maintenance Pass</span>
              <span><b>90+</b> Fit to Fight</span>
            </div>
          </div>
          <dl className="flight-score__events">
            {(['cardio', 'strength', 'core', ...(result.whtr.scoredInComposite ? ['whtr'] as const : [])] as const).map(key => {
              const event = result[key];
              const ready = completion[key];
              const label = { cardio: 'Cardio', strength: 'Strength', core: 'Core', whtr: 'WHtR' }[key];
              const value = event.exempt ? 'Exempt' : !ready ? '—' : event.isPassFailOnly
                ? (event.passedMinimum ? 'Pass' : 'Fail') : event.earnedPoints.toFixed(1);
              return <div key={key}><dt>{label}</dt><dd>{value}</dd></div>;
            })}
          </dl>
          </div>
        </section>

        <div
          key={activeTab}
          ref={workspaceRef}
          role="region"
          aria-label={WORKSPACE_VIEWS.find(view => view.id === activeTab)?.label}
          tabIndex={-1}
          className="workspace-panel scroll-mt-4 space-y-6 focus:outline-none"
        >
        {activeTab === 'calculator' && (
          <>
            {/* Compact Profile & Base Selector Card */}
            <section
              aria-label="Profile and Base Configuration"
              className="flight-profile flight-case p-5 space-y-4"
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
                    searchLabel="Search bases" searchPlaceholder="Search a base or location…" largeList
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
              className="flight-cardio flight-case score-card p-5 sm:p-6 space-y-4"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-x-4">
                <h2 className="break-words text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  1. Cardiorespiratory
                </h2>
                <div className="text-right">
                  <ScoreIndicator result={result.cardio} pending={!completion.cardio} />
                </div>
                <div className="col-span-2 min-w-0 max-w-full justify-self-start">
                  <SegmentedControl<CardioEventId | 'exempt'>
                    label="Cardio event"
                    value={inputs.cardioExempt ? 'exempt' : inputs.cardioEvent}
                    options={[{ value: 'run_2_0', label: '2.0-Mile Run' }, { value: 'hamr', label: '20m HAMR' }, { value: 'walk_2km', label: '2.0-km Walk' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ cardioExempt: !inputs.cardioExempt })
                      : updateInputs({ cardioEvent: event, cardioExempt: false })}
                  />
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
              className="flight-case score-card p-5 sm:p-6 space-y-4"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-x-4">
                <h2 className="break-words text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  2. Muscular Strength
                </h2>
                <div className="text-right">
                  <ScoreIndicator result={result.strength} pending={!completion.strength} />
                </div>
                <div className="col-span-2 min-w-0 max-w-full justify-self-start">
                  <SegmentedControl<StrengthEventId | 'exempt'>
                    label="Strength event"
                    value={inputs.strengthExempt ? 'exempt' : inputs.strengthEvent}
                    options={[{ value: 'pushups', label: 'Push-ups (1m)' }, { value: 'hr_pushups', label: 'Hand-Release (2m)' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ strengthExempt: !inputs.strengthExempt })
                      : updateInputs({ strengthEvent: event, strengthExempt: false })}
                  />
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
              className="flight-case score-card p-5 sm:p-6 space-y-4"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-x-4">
                <h2 className="break-words text-left text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  3. Core Endurance
                </h2>
                <div className="text-right">
                  <ScoreIndicator result={result.core} pending={!completion.core} />
                </div>
                <div className="col-span-2 min-w-0 max-w-full justify-self-start">
                  <SegmentedControl<CoreEventId | 'exempt'>
                    label="Core event"
                    value={inputs.coreExempt ? 'exempt' : inputs.coreEvent}
                    options={[{ value: 'situps', label: 'Sit-ups (1m)' }, { value: 'plank', label: 'Plank' }, { value: 'crunches', label: 'Reverse Crunch (2m)' }, { value: 'exempt', label: 'Exempt', tone: 'amber' }]}
                    onChange={event => event === 'exempt'
                      ? updateInputs({ coreExempt: !inputs.coreExempt })
                      : updateInputs({ coreEvent: event, coreExempt: false })}
                  />
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
                className="flight-action-reset press inline-flex min-h-8 items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Values</span>
              </button>
              <button
                type="button"
                onClick={() => openWorkspace('goal')}
                className="flight-action-goal press min-h-8 font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
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
            <button type="button" onClick={() => openWorkspace('calculator')} className="press min-h-11 rounded-lg bg-cyan-500 px-4 py-2 text-sm lg:text-base font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer">Go to Calculator</button>
          </section>
        ))}

        {activeTab === 'standards' && (
          <ScoringTablesReference
            activeSex={inputs.sex}
            activeAgeBracket={inputs.ageBracket}
          />
        )}
        </div>
      </main>
    </div>
  );
}
