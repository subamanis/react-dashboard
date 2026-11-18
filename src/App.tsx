import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_CARD_COUNT,
  buildCards,
  parseCardCount,
  type LayoutMode,
} from "./data";
import Bar from "./Bar";
import Grid from "./Grid";
import PerfHud from "./PerfHud";
import Scrollbar from "./Scrollbar";
import styles from "./Dashboard.module.css";

interface Modes {
  cardCount: number;
  layout: LayoutMode;
  live: boolean;
  cv: boolean;
  virtual: boolean;
  hud: boolean;
}

function getInitialModes(): Modes {
  const params = new URLSearchParams(window.location.search);
  const parsedCount = parseCardCount(params.get("count") ?? "");
  const cardCount = parsedCount ?? DEFAULT_CARD_COUNT;
  const layout: LayoutMode =
    params.get("layout") === "masonry" ? "masonry" : "grid";
  const live = params.get("live") === "1";
  const virtual = params.get("virtual") === "1";
  const cv = !virtual && params.get("cv") === "1";
  const hud = params.get("hud") === "1";
  return { cardCount, layout, live, cv, virtual, hud };
}

export default function App() {
  const [modes, setModes] = useState<Modes>(getInitialModes);
  const [step, setStep] = useState(0);
  const [clicks, setClicks] = useState(0);

  const cards = useMemo(
    () => buildCards(modes.cardCount, step),
    [modes.cardCount, step],
  );

  const handleOpen = useCallback((_id: number) => {
    setClicks((c) => c + 1);
  }, []);

  const handleCommitCount = useCallback((nextCount: number) => {
    setModes((m) =>
      m.cardCount === nextCount ? m : { ...m, cardCount: nextCount },
    );
  }, []);

  const handleSelectGrid = useCallback(() => {
    setModes((m) => (m.layout === "grid" ? m : { ...m, layout: "grid" }));
  }, []);

  const handleSelectMasonry = useCallback(() => {
    setModes((m) => (m.layout === "masonry" ? m : { ...m, layout: "masonry" }));
  }, []);

  const handleToggleLive = useCallback(() => {
    setModes((m) => ({ ...m, live: !m.live }));
  }, []);

  const handleToggleCv = useCallback(() => {
    setModes((m) => {
      if (m.layout === "masonry") return m;
      const nextCv = !m.cv;
      return { ...m, cv: nextCv, virtual: nextCv ? false : m.virtual };
    });
  }, []);

  const handleToggleVirtual = useCallback(() => {
    setModes((m) => {
      const nextVirtual = !m.virtual;
      return { ...m, virtual: nextVirtual, cv: nextVirtual ? false : m.cv };
    });
  }, []);

  const handleToggleHud = useCallback(() => {
    setModes((m) => ({ ...m, hud: !m.hud }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleToggleHud();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleHud]);

  useEffect(() => {
    if (!modes.live) return undefined;
    let frameId = 0;
    const tick = () => {
      setStep((s) => (s + 1) >>> 0);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [modes.live]);

  const effectiveCv = modes.cv && modes.layout === "grid" && !modes.virtual;

  return (
    <main className={styles.page}>
      <Bar
        cardCount={modes.cardCount}
        layout={modes.layout}
        live={modes.live}
        cv={effectiveCv}
        virtual={modes.virtual}
        hud={modes.hud}
        clicks={clicks}
        onCommitCount={handleCommitCount}
        onSelectGrid={handleSelectGrid}
        onSelectMasonry={handleSelectMasonry}
        onToggleLive={handleToggleLive}
        onToggleCv={handleToggleCv}
        onToggleVirtual={handleToggleVirtual}
        onToggleHud={handleToggleHud}
      />
      <Grid
        cards={cards}
        layout={modes.layout}
        cv={effectiveCv}
        virtual={modes.virtual}
        onOpen={handleOpen}
      />
      <PerfHud visible={modes.hud} />
      <Scrollbar />
    </main>
  );
}
