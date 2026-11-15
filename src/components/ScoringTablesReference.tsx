import React, { useState } from 'react';
import { Table2 } from 'lucide-react';
import {
  AgeBracketId,
  RUN_ALTITUDE_CORRECTION_TABLE,
  SexCategory,
  WALK_ALTITUDE_CORRECTION_TABLE,
} from '../data/scoringStandards';
import { FullScoresheets } from './FullScoresheets';
import { StandardsDataReference } from './StandardsDataReference';
import { WAIST_RATIO_FAIL_THRESHOLD } from '../data/scoringRelease';

interface ScoringTablesReferenceProps {
  activeSex: SexCategory;
  activeAgeBracket: AgeBracketId;
}

export const ScoringTablesReference: React.FC<ScoringTablesReferenceProps> = ({
  activeSex,
  activeAgeBracket,
}) => {
  const [subTab, setSubTab] = useState<'DEMOGRAPHIC' | 'ALTITUDE' | 'WHTR' | 'SOURCES'>(
    'DEMOGRAPHIC'
  );

  return (
    <section
      id="scoring-tables-section"
      aria-labelledby="scoring-tables-heading"
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D111A] p-5 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2
            id="scoring-tables-heading"
            className="text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <Table2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>USSF HPA Standards Library</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Full scoring rows, altitude adjustments, walk standards, and grading rules for the charts currently used by this calculator.
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div
          role="group"
          aria-label="Reference Table Views"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          {(
            [
              { id: 'DEMOGRAPHIC', label: 'Event scoresheets' },
              { id: 'ALTITUDE', label: 'Altitude & walk' },
              { id: 'WHTR', label: 'Waist ratio' },
              { id: 'SOURCES', label: 'Rules & complete data' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={subTab === t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-2.5 py-1 text-xs lg:text-sm font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'DEMOGRAPHIC' && <FullScoresheets />}

      {subTab === 'ALTITUDE' && (
        <div className="space-y-5">
          {/* Table A3.4: 20m HAMR Shuttle Adjustments */}
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Table A3.4. Altitude Time Correction for 20-Meter HAMR (All Age Brackets)
            </h3>
            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs lg:text-sm font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] lg:text-sm text-slate-500 dark:text-slate-400">
                    <th className="py-2 px-3 font-semibold">Event</th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Group 1 (5250–5499 ft)
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Group 2 (5500–5999 ft)
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Group 3 (6000–6599 ft)
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Group 4 (≥ 6600 ft)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-emerald-500/5 font-semibold">
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white">
                      20m HAMR Shuttle Bonus
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      Add 1 Shuttle (+1)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      Add 2 Shuttles (+2)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      Add 3 Shuttles (+3)
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                      Add 4 Shuttles (+4)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table A3.1: 2.0-Mile Run Altitude Time Correction */}
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Table A3.1. Altitude Time Correction for 2.0 Mile Run (Subtracted from Raw Run Time)
            </h3>
            <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs lg:text-sm font-mono">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] lg:text-sm text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">2 Mile Run Time (min:sec)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      Group 1 (5250–5499 ft)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      Group 2 (5500–5999 ft)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      Group 3 (6000–6599 ft)
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-right">
                      Group 4 (≥ 6600 ft)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                  {RUN_ALTITUDE_CORRECTION_TABLE.map((row) => (
                    <tr
                      key={row.label20Mile}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {row.label20Mile}
                      </td>
                      <td className="py-1.5 px-3 text-right text-cyan-700 dark:text-cyan-400">
                        -{row.formattedDeduction.group1} (-{row.deductionSec.group1}s)
                      </td>
                      <td className="py-1.5 px-3 text-right text-cyan-700 dark:text-cyan-400">
                        -{row.formattedDeduction.group2} (-{row.deductionSec.group2}s)
                      </td>
                      <td className="py-1.5 px-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                        -{row.formattedDeduction.group3} (-{row.deductionSec.group3}s)
                      </td>
                      <td className="py-1.5 px-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                        -{row.formattedDeduction.group4} (-{row.deductionSec.group4}s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tables A3.2 & A3.3: 2.0-Kilometer Walk Maximum Allowable Times by Age & Altitude */}
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Tables A3.2 (Male) & A3.3 (Female). Altitude Time Correction for 2.0 Kilometer Walk
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(['male', 'female'] as SexCategory[]).map((s) => (
                <div
                  key={s}
                  className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800"
                >
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs lg:text-sm font-semibold capitalize">
                    {s === 'male' ? 'Table A3.2 — Male 2.0 km Max Walk Time' : 'Table A3.3 — Female 2.0 km Max Walk Time'}
                  </div>
                  <table className="w-full text-left border-collapse text-xs lg:text-sm font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] lg:text-sm text-slate-500 dark:text-slate-400">
                        <th className="py-2 px-2.5 font-semibold">Age (yrs)</th>
                        <th className="py-2 px-2.5 font-semibold text-right">Baseline</th>
                        <th className="py-2 px-2.5 font-semibold text-right">Group 1</th>
                        <th className="py-2 px-2.5 font-semibold text-right">Group 2</th>
                        <th className="py-2 px-2.5 font-semibold text-right">Group 3</th>
                        <th className="py-2 px-2.5 font-semibold text-right">Group 4</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                      {WALK_ALTITUDE_CORRECTION_TABLE[s].map((row) => (
                        <tr key={row.ageLabel}>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-900 dark:text-white">
                            {row.ageLabel}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">{row.formattedMaxWalk.normal}</td>
                          <td className="py-1.5 px-2.5 text-right">{row.formattedMaxWalk.group1}</td>
                          <td className="py-1.5 px-2.5 text-right">{row.formattedMaxWalk.group2}</td>
                          <td className="py-1.5 px-2.5 text-right">{row.formattedMaxWalk.group3}</td>
                          <td className="py-1.5 px-2.5 text-right">{row.formattedMaxWalk.group4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'WHTR' && (
        <div className="space-y-4 text-sm lg:text-base">
          <h3 className="font-bold">Separate pass/fail waist-to-height check</h3>
          <p>Divide waist by height using inches for both measurements. Round the ratio to two decimals to match the supplied chart. This check does not add points to the HPA composite.</p>
          <table className="w-full text-left"><thead><tr><th scope="col" className="p-3">Rounded ratio</th><th scope="col" className="p-3">Result</th></tr></thead><tbody><tr className="border-t border-slate-200 dark:border-slate-800"><td className="p-3">Below {WAIST_RATIO_FAIL_THRESHOLD.toFixed(2)}</td><td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">PASS</td></tr><tr className="border-t border-slate-200 dark:border-slate-800"><td className="p-3">{WAIST_RATIO_FAIL_THRESHOLD.toFixed(2)} and above</td><td className="p-3 font-bold text-rose-700 dark:text-rose-400">FAIL</td></tr></tbody></table>
        </div>
      )}

      {subTab === 'SOURCES' && <StandardsDataReference />}
    </section>
  );
};
