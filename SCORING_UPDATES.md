# Updating HPA standards

The Standards library renders the exact `USSF_HPA_DISCRETE_TABLES` object used by the scoring engine. Do not maintain a second copy of scoring rows in UI components.

1. Obtain the new published scoresheets and guidance. Keep the previous release in Git history and record the new document URL, date, and release ID in `src/data/scoringRelease.ts`.
2. Update `src/data/ussfScoringTables.ts` for all affected sex/age/event combinations. Rows are `[performance threshold, points]`. Run thresholds are seconds in ascending order; other events use descending thresholds. Plank thresholds are seconds. Reps and shuttles are integers. The final row is the passing event minimum.
3. If altitude or walk rules change, update `RUN_ALTITUDE_CORRECTION_TABLE`, `WALK_ALTITUDE_CORRECTION_TABLE`, and applicable altitude rules in `src/data/scoringStandards.ts` / `src/data/installations.ts`. Review `getHamrAltitudeBonusShuttles` and the run correction logic in `src/utils/calculator.ts` when the publication changes the calculation rules, rather than only row values.
4. Update source descriptions in `src/data/scoringStandards.ts`. The chart PDF is a hosted copy; identify its provenance honestly. A date in the release manifest describes the installed chart version, not a claim that no newer guidance exists.
5. For a revised standalone waist chart, update `WAIST_RATIO_FAIL_THRESHOLD` in `src/data/scoringRelease.ts`, review rounding in `src/utils/waistRatio.ts`, and update boundary examples. This check contributes no HPA points.
6. Run `npm run lint`, `npm run build`, and `node --import tsx --test src/utils/*.test.ts src/data/*.test.ts`. Add independent examples transcribed from the new publication, especially immediately above/below minimums and altitude boundaries. Integrity tests check all 126 event scoresheets but cannot prove a transcription matches its source.
7. Preview the complete Standards rows, calculator outputs, and goal recommendations in a PR before merging. Replacing a PDF link alone does not update grading. Changes to weights, event rules, exemptions or pass thresholds need corresponding engine changes and tests.

The public app is fixed to USSF HPA (60/20/20). Legacy four-pillar helpers remain internal for compatibility tests; stored assessment-mode preferences are overridden when loading the public app.

## Cross-checking with another AI model

The Standards tab has no external PDF dependency. Event scoresheets initially show all 126 full tables; filters only narrow the view. Altitude/walk and waist sections show the remaining reference tables. Rules & complete data includes a copyable JSON snapshot assembled from the actual grading tables and configuration, not a separately transcribed document.

Give an AI model that snapshot plus the new published standards and this repository. Ask it to compare every affected cohort/event row, altitude band, walk limit, pass threshold, and exemption rule; report differences before editing the data. Consult calculator.ts for procedural behavior and SCORING_UPDATES.md for file locations and test commands. The snapshot describes the installed implementation, not independent proof of its correctness.
