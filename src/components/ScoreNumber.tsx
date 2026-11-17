import NumberFlow, { useCanAnimate, type Format } from '@number-flow/react';

const SCORE_FORMAT: Format = { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false };
const RATIO_FORMAT: Format = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false };
const TRANSFORM_TIMING = { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const OPACITY_TIMING = { duration: 120, easing: 'ease-out' };

/** Animate displayed results without interpolating the values used for grading or copying. */
export function ScoreNumber({ value, decimals = 1 }: { value: number | null; decimals?: 1 | 2 }) {
  const canAnimate = useCanAnimate();
  if (value === null || !Number.isFinite(value)) return <span data-value="—">—</span>;
  const formatted = value.toFixed(decimals);
  return <NumberFlow
    value={value}
    locales="en-US"
    format={decimals === 2 ? RATIO_FORMAT : SCORE_FORMAT}
    className="score-number"
    role="img"
    aria-label={formatted}
    data-value={formatted}
    transformTiming={TRANSFORM_TIMING}
    spinTiming={TRANSFORM_TIMING}
    opacityTiming={OPACITY_TIMING}
    animated={canAnimate}
    respectMotionPreference
  />;
}
