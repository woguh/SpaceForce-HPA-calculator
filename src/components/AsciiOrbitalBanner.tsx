import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AltitudeGroupId, SpaceForceInstallation } from '../data/installations';

interface AsciiOrbitalBannerProps {
  installation: SpaceForceInstallation;
  activeAltitudeGroup: AltitudeGroupId;
  compositeScore: number | null;
  passedOverall: boolean;
  isPaused?: boolean;
}

interface NormalizedStar {
  nx: number;
  ny: number;
  speed: number;
  glyph: string;
}

interface NormalizedCraft {
  ny: number;
  nx: number;
  speed: number;
  sprite: string[];
  direction: 1 | -1;
}

const STARS: NormalizedStar[] = Array.from({ length: 160 }, (_, i) => ({
  nx: ((i * 73.13) % 1000) / 1000,
  ny: ((i * 197.47) % 1000) / 1000,
  speed: i % 4 === 0 ? 0.35 : i % 3 === 0 ? 0.2 : 0.1,
  glyph: i % 9 === 0 ? '✦' : i % 4 === 0 ? '+' : i % 2 === 0 ? '·' : '.',
}));

const CRAFTS: NormalizedCraft[] = [
  {
    ny: 0.12,
    nx: 0.08,
    speed: 0.6,
    direction: 1,
    sprite: ['  /▲\\  ', '=[♦♦♦]=>'],
  },
  {
    ny: 0.24,
    nx: 0.78,
    speed: 0.45,
    direction: -1,
    sprite: [' <=[o]=> ', '  / | \\  '],
  },
  {
    ny: 0.39,
    nx: 0.86,
    speed: 0.5,
    direction: 1,
    sprite: ['──╬──=[██]►'],
  },
  {
    ny: 0.56,
    nx: 0.05,
    speed: 0.7,
    direction: 1,
    sprite: ['···► ==[∆]==>'],
  },
  {
    ny: 0.73,
    nx: 0.82,
    speed: 0.4,
    direction: -1,
    sprite: ['◄[═══]──╬──'],
  },
  {
    ny: 0.86,
    nx: 0.14,
    speed: 0.55,
    direction: 1,
    sprite: ['  /◊\\  ', '=[███]=>'],
  },
];

export const AsciiOrbitalBanner: React.FC<AsciiOrbitalBannerProps> = ({
  installation,
  compositeScore,
  isPaused = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLPreElement | null>(null);
  const [gridDims, setGridDims] = useState({ cols: 160, rows: 48, visibleRows: 46 });
  const [tick, setTick] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isLowScore = compositeScore !== null && compositeScore < 75;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const probe = probeRef.current;
      if (!container || !probe) return;
      const rect = container.getBoundingClientRect();
      const probeRect = probe.getBoundingClientRect();
      const charW = probeRect.width > 0 ? probeRect.width / 10 : 8.2;
      const lineH = probeRect.height > 0 ? probeRect.height / 10 : 20;
      const cols = Math.max(48, Math.ceil(rect.width / charW) + 1);
      const visibleRows = Math.max(20, Math.floor(rect.height / lineH));
      const rows = Math.max(24, Math.ceil(rect.height / lineH));
      setGridDims((prev) =>
        prev.cols === cols && prev.rows === rows && prev.visibleRows === visibleRows
          ? prev
          : { cols, rows, visibleRows }
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setTick((t) => (t + 1) % 100000);
    }, 90);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const handleMove = (e: MouseEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 6;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 3;
      setMouseOffset({ x: nx, y: ny });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isPaused, prefersReducedMotion]);

  const asciiFrame = useMemo(() => {
    const { cols, rows, visibleRows } = gridDims;
    const grid: string[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ' ')
    );

    // 1. Drifting starfield scaled across the entire viewport
    for (const star of STARS) {
      const sx =
        Math.floor(
          (star.nx * cols + tick * star.speed + mouseOffset.x * (star.speed * 4) + cols * 10) %
            cols
        );
      const sy =
        Math.floor((star.ny * rows + mouseOffset.y * (star.speed * 3) + rows * 10) % rows);
      if (sy >= 0 && sy < rows && sx >= 0 && sx < cols) {
        grid[sy][sx] = star.glyph;
      }
    }

    // 2. Subtle full-width orbital wave across the sky
    const waveAmp = Math.max(3, Math.round(rows * 0.14));
    for (let x = 0; x < cols; x += 2) {
      const waveY = Math.round(
        rows * 0.5 + Math.sin((x / cols) * Math.PI * 2 + tick * 0.03) * waveAmp
      );
      if (waveY >= 0 && waveY < rows) {
        grid[waveY][x] = x % 6 === 0 ? '∙' : '·';
      }
    }

    // 3. Moving spacecraft & orbital satellites
    for (const craft of CRAFTS) {
      const baseRow = Math.round(craft.ny * (rows - 3));
      const cx =
        Math.floor((craft.nx * cols + tick * craft.speed * craft.direction + cols * 100) % cols);
      craft.sprite.forEach((line, rowOffset) => {
        const ry = baseRow + rowOffset;
        if (ry >= 0 && ry < rows) {
          for (let i = 0; i < line.length; i++) {
            if (line[i] !== ' ') {
              const rx = (cx + i) % cols;
              grid[ry][rx] = line[i];
            }
          }
        }
      });
    }

    // The only addition to the original sky: a passing asteroid shower.
    const storm = (tick * 0.09) % 32;
    if (storm < 10) {
      const put = (x: number, y: number, glyph: string) => {
        const col = Math.round(x), row = Math.round(y);
        if (col >= 0 && col < cols && row >= 0 && row < rows) grid[row][col] = glyph;
      };
      for (let i = 0; i < (cols < 90 ? 4 : 10); i++) {
        const progress = (storm - i * 0.45) / 5;
        if (progress < 0 || progress > 1.3) continue;
        const x = cols * (1.1 - progress) + (i % 4 - 1.5) * cols * 0.17;
        const y = rows * (-0.15 + progress) - (i % 3) * 3;
        for (let tail = 1; tail <= 4; tail++) {
          put(x + tail, y - tail * 0.5, tail > 2 ? '·' : '/');
        }
        Array.from(i % 2 ? '<#>' : '(@)').forEach((glyph, offset) => put(x - 1 + offset, y, glyph));
      }
    }

    // 4. Subtle Space Force Delta emblem in top-right sky
    const deltaLines = [
      '      ▲      ',
      '     / \\     ',
      '    / ◊ \\    ',
      '   / _ _ \\   ',
      '  ◄       ►  ',
    ];
    if (cols >= 40 && rows >= 14) {
      const deltaX = Math.max(2, cols - 18);
      const deltaY = 3;
      deltaLines.forEach((line, rIdx) => {
        const ry = deltaY + rIdx;
        if (ry < rows) {
          for (let i = 0; i < line.length; i++) {
            if (line[i] !== ' ') {
              const rx = deltaX + i;
              if (rx < cols) grid[ry][rx] = line[i];
            }
          }
        }
      });
    }

    // 5. Quiet orbital sector tag in bottom-left corner with guaranteed bottom clearance
    const fullTag = `[ ORBITAL SECTOR · ${installation.name.toUpperCase()} · ${installation.geographicElevationFt.toLocaleString()} FT MSL ]`;
    const compactTag = `[ ORBITAL SECTOR · ${installation.name.toUpperCase()} ]`;
    const maxTagLen = Math.max(12, cols - 4);
    const stationTag =
      fullTag.length <= maxTagLen
        ? fullTag
        : compactTag.length <= maxTagLen
          ? compactTag
          : `${compactTag.slice(0, maxTagLen - 2)} ]`;
    const tagRow = Math.min(rows - 1, Math.max(0, visibleRows - 2));
    for (let i = 0; i < Math.min(cols - 4, stationTag.length); i++) {
      grid[tagRow][i + 2] = stationTag[i];
    }

    return grid.map((r) => r.join('')).join('\n');
  }, [gridDims, tick, mouseOffset, installation.name, installation.geographicElevationFt]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-testid="ascii-orbital-canvas"
      data-alert-state={isLowScore ? 'red' : 'normal'}
      className={`fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden select-none transition-colors duration-300 ${
        isLowScore ? 'bg-rose-500/[0.06] dark:bg-rose-950/30' : ''
      }`}
    >
      {/* Hidden 10-row x 10-col probe to measure exact rendered glyph and line height */}
      <pre
        ref={probeRef}
        className="absolute invisible m-0 p-0 font-mono text-[13px] leading-[20px] tracking-[0.06em] whitespace-pre"
      >
        {'MMMMMMMMMM\n'.repeat(9) + 'M✦·▲♦◄►╬∆M'}
      </pre>
      <pre
        className={`w-full h-full m-0 p-0 font-mono text-[13px] leading-[20px] tracking-[0.06em] whitespace-pre overflow-hidden transition-colors duration-300 ${
          isLowScore
            ? 'text-rose-600/65 dark:text-rose-500/65'
            : 'text-slate-500/40 dark:text-cyan-400/40'
        }`}
      >
        {asciiFrame}
      </pre>
    </div>
  );
};
