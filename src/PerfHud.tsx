import { useEffect, useRef } from "react";
import styles from "./Dashboard.module.css";

interface PerformanceMemory {
  usedJSHeapSize: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface LoafScriptEntry {
  duration: number;
}

interface LoafEntry extends PerformanceEntry {
  blockingDuration: number;
  renderStart: number;
  styleAndLayoutStart: number;
  scripts?: LoafScriptEntry[];
}

interface PerfHudProps {
  visible: boolean;
}

export default function PerfHud({ visible }: PerfHudProps) {
  const fpsRef = useRef<HTMLSpanElement | null>(null);
  const frameRef = useRef<HTMLSpanElement | null>(null);
  const loafRef = useRef<HTMLSpanElement | null>(null);
  const clickRef = useRef<HTMLSpanElement | null>(null);
  const resizeRef = useRef<HTMLSpanElement | null>(null);
  const domRef = useRef<HTMLSpanElement | null>(null);
  const cardsRef = useRef<HTMLSpanElement | null>(null);
  const heapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!visible) return undefined;

    const perf = performance as PerformanceWithMemory;

    const updateCounts = () => {
      if (domRef.current) {
        domRef.current.textContent = String(
          document.getElementsByTagName("*").length,
        );
      }
      if (cardsRef.current) {
        cardsRef.current.textContent = String(
          document.getElementsByClassName(styles.card).length,
        );
      }
      if (heapRef.current) {
        if (perf.memory) {
          const mb = perf.memory.usedJSHeapSize / 1048576;
          heapRef.current.textContent = `${mb.toFixed(1)} MB`;
        } else {
          heapRef.current.textContent = "n/a";
        }
      }
    };

    updateCounts();

    let rafId = 0;
    let frameCount = 0;
    let sumDt = 0;
    let maxDt = 0;
    let prevTs = performance.now();
    let windowStartTs = prevTs;
    const timeouts = new Set<number>();

    const tick = (now: number) => {
      const dt = now - prevTs;
      prevTs = now;
      if (dt > 0 && dt < 5000) {
        frameCount += 1;
        sumDt += dt;
        if (dt > maxDt) maxDt = dt;
      }
      if (now - windowStartTs >= 500 && frameCount > 0) {
        const avgDt = sumDt / frameCount;
        const fps = 1000 / avgDt;
        if (fpsRef.current) {
          fpsRef.current.textContent = `${fps.toFixed(1)} fps`;
        }
        if (frameRef.current) {
          frameRef.current.textContent = `${avgDt.toFixed(1)} / ${maxDt.toFixed(1)} ms`;
        }
        updateCounts();
        frameCount = 0;
        sumDt = 0;
        maxDt = 0;
        windowStartTs = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    let loafCount = 0;
    let loafObserver: PerformanceObserver | null = null;
    if (
      typeof PerformanceObserver !== "undefined" &&
      Array.isArray(PerformanceObserver.supportedEntryTypes) &&
      PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")
    ) {
      loafObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as LoafEntry[];
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          let scriptMs = 0;
          if (entry.scripts && entry.scripts.length > 0) {
            for (let j = 0; j < entry.scripts.length; j++) {
              scriptMs += entry.scripts[j].duration;
            }
          } else if (
            entry.blockingDuration > 0 &&
            entry.renderStart > entry.startTime
          ) {
            scriptMs = entry.renderStart - entry.startTime;
          }
          const styleLayoutMs =
            entry.styleAndLayoutStart > 0
              ? Math.max(
                  0,
                  entry.startTime + entry.duration - entry.styleAndLayoutStart,
                )
              : 0;
          if (
            entry.blockingDuration === 0 &&
            scriptMs < 1 &&
            styleLayoutMs < 1
          ) {
            continue;
          }
          loafCount += 1;
          if (loafRef.current) {
            loafRef.current.textContent = `${entry.duration.toFixed(0)} ms (js ${scriptMs.toFixed(0)} / lyt ${styleLayoutMs.toFixed(0)}) #${loafCount}`;
          }
        }
      });
      loafObserver.observe({ type: "long-animation-frame", buffered: false });
    }

    let clickT0 = 0;
    const onClickCapture = () => {
      clickT0 = performance.now();
    };
    const onClick = () => {
      const t0 = clickT0;
      const jsMs = performance.now() - t0;
      requestAnimationFrame(() => {
        const id = window.setTimeout(() => {
          timeouts.delete(id);
          const paintMs = performance.now() - t0;
          if (clickRef.current) {
            clickRef.current.textContent = `js ${jsMs.toFixed(1)} / paint ${paintMs.toFixed(1)} ms`;
          }
          updateCounts();
        }, 0);
        timeouts.add(id);
      });
    };
    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("click", onClick, false);

    let resizePending = false;
    let resizeT0 = 0;
    const onResize = () => {
      if (resizePending) return;
      resizePending = true;
      resizeT0 = performance.now();
      requestAnimationFrame(() => {
        const id = window.setTimeout(() => {
          timeouts.delete(id);
          const paintMs = performance.now() - resizeT0;
          resizePending = false;
          if (resizeRef.current) {
            resizeRef.current.textContent = `${paintMs.toFixed(1)} ms`;
          }
          updateCounts();
        }, 0);
        timeouts.add(id);
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      if (loafObserver) loafObserver.disconnect();
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("click", onClick, false);
      window.removeEventListener("resize", onResize);
      for (const id of timeouts) {
        clearTimeout(id);
      }
      timeouts.clear();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <aside className={styles.hud} aria-label="Performance">
      <div className={styles.hudHeader}>
        <span className={styles.hudTitle}>Performance</span>
        <span className={styles.hudKey}>F2</span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>FPS</span>
        <span ref={fpsRef} className={styles.hudVal}>
          ...
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>Frame avg / max</span>
        <span ref={frameRef} className={styles.hudVal}>
          ...
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>LoAF (&gt;=50ms)</span>
        <span ref={loafRef} className={styles.hudVal}>
          0
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>Last click</span>
        <span ref={clickRef} className={styles.hudVal}>
          n/a
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>Last resize</span>
        <span ref={resizeRef} className={styles.hudVal}>
          n/a
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>Cards mounted</span>
        <span ref={cardsRef} className={styles.hudVal}>
          0
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>DOM elements</span>
        <span ref={domRef} className={styles.hudVal}>
          0
        </span>
      </div>
      <div className={styles.hudRow}>
        <span className={styles.hudLabel}>JS heap</span>
        <span ref={heapRef} className={styles.hudVal}>
          n/a
        </span>
      </div>
    </aside>
  );
}
