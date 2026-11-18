import { useEffect, useRef } from 'react';

function delayBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** One decorative pass in front of the console, using a pre-rendered 3D rock. */
export function ForegroundAsteroid() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = layerRef.current;
    if (!container) return;
    const layer = container;

    let timer = 0;
    let animation: Animation | null = null;
    let sprite: HTMLImageElement | null = null;

    function clear() {
      window.clearTimeout(timer);
      animation?.cancel();
      animation = null;
      sprite?.remove();
      sprite = null;
    }

    function schedule(first = false) {
      if (document.hidden) return;
      const delay = first ? delayBetween(20_000, 32_000) : delayBetween(48_000, 85_000);
      timer = window.setTimeout(launch, delay);
    }

    function finish() {
      clear();
      schedule();
    }

    async function launch() {
      const rock = new Image();
      sprite = rock;
      rock.alt = '';
      rock.draggable = false;
      rock.src = '/foreground-asteroid.webp';

      try {
        await rock.decode();
      } catch {
        if (sprite === rock) finish();
        return;
      }
      if (sprite !== rock || document.hidden) return;

      const start = delayBetween(19, 34);
      const end = start + delayBetween(16, 29);
      layer.append(rock);
      animation = rock.animate([
        { transform: `translate3d(105vw, ${start}vh, 0) rotate(-35deg) scale(.63)`, opacity: .55 },
        { transform: `translate3d(-14rem, ${end}vh, 0) rotate(92deg) scale(1.12)`, opacity: .94 },
      ], { duration: delayBetween(2300, 2900), fill: 'both', easing: 'linear' });
      animation.onfinish = finish;
    }

    function onVisibilityChange() {
      clear();
      schedule(true);
    }

    schedule(true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <div ref={layerRef} className="flight-flyby" aria-hidden="true" />;
}
