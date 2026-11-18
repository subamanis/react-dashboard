import { useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { parseCardCount, type LayoutMode } from "./data";
import styles from "./Dashboard.module.css";

interface ToggleProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function Toggle({ label, checked, disabled = false, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      className={clsx(styles.toggle, disabled && styles.toggleDisabled)}
      disabled={disabled}
      aria-pressed={checked}
      onClick={onToggle}
    >
      <span
        className={clsx(styles.toggleTrack, checked && styles.toggleTrackOn)}
      >
        <span className={styles.toggleKnob} />
      </span>
      <span className={styles.toggleLabel}>{label}</span>
    </button>
  );
}

interface BarProps {
  cardCount: number;
  layout: LayoutMode;
  live: boolean;
  cv: boolean;
  virtual: boolean;
  hud: boolean;
  clicks: number;
  onCommitCount: (nextCount: number) => void;
  onSelectGrid: () => void;
  onSelectMasonry: () => void;
  onToggleLive: () => void;
  onToggleCv: () => void;
  onToggleVirtual: () => void;
  onToggleHud: () => void;
}

export default function Bar({
  cardCount,
  layout,
  live,
  cv,
  virtual,
  hud,
  clicks,
  onCommitCount,
  onSelectGrid,
  onSelectMasonry,
  onToggleLive,
  onToggleCv,
  onToggleVirtual,
  onToggleHud,
}: BarProps) {
  const [draft, setDraft] = useState(() => String(cardCount));
  const isMasonry = layout === "masonry";

  const commit = () => {
    const parsed = parseCardCount(draft);
    if (parsed === null) {
      setDraft(String(cardCount));
      return;
    }
    setDraft(String(parsed));
    if (parsed !== cardCount) {
      onCommitCount(parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };

  return (
    <header className={styles.bar}>
      <h1 className={styles.barTitle}>Dashboard</h1>
      <div className={styles.barCount}>
        <input
          type="text"
          name="count"
          inputMode="numeric"
          aria-label="Card count"
          className={styles.countInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <span className={styles.barMeta}>cards</span>
      </div>
      <div className={styles.pillGroup}>
        <button
          type="button"
          className={clsx(styles.pill, layout === "grid" && styles.pillActive)}
          onClick={onSelectGrid}
        >
          Grid
        </button>
        <button
          type="button"
          className={clsx(styles.pill, isMasonry && styles.pillActive)}
          onClick={onSelectMasonry}
        >
          Masonry
        </button>
      </div>
      <Toggle label="Live" checked={live} onToggle={onToggleLive} />
      <span className={styles.barCounter}>clicks: {clicks}</span>
      <div className={styles.browserToggles}>
        <Toggle
          label="content-visibility"
          checked={!isMasonry && cv}
          disabled={isMasonry}
          onToggle={onToggleCv}
        />
        <Toggle label="virtual" checked={virtual} onToggle={onToggleVirtual} />
        <Toggle label="Performance" checked={hud} onToggle={onToggleHud} />
      </div>
    </header>
  );
}
