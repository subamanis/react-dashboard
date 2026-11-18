import { memo, type CSSProperties } from "react";
import clsx from "clsx";
import type { CardData } from "./data";
import styles from "./Dashboard.module.css";

interface CardProps {
  card: CardData;
  cv?: boolean;
  positioned?: boolean;
  style?: CSSProperties;
  cardRef?: (node: HTMLDivElement | null) => void;
  dataIndex?: number;
  onOpen: (id: number) => void;
}

const BADGE_TONE = {
  ok: styles.badgeOk,
  watch: styles.badgeWatch,
  alert: styles.badgeAlert,
} as const;

const FILL_TONE = {
  ok: styles.fillOk,
  watch: styles.fillWatch,
  alert: styles.fillAlert,
} as const;

const Card = memo(function Card({
  card,
  cv = false,
  positioned = false,
  style,
  cardRef,
  dataIndex,
  onOpen,
}: CardProps) {
  return (
    <div
      ref={cardRef}
      data-index={dataIndex}
      className={clsx(
        styles.card,
        cv && styles.cardCv,
        positioned && styles.cardAbs,
      )}
      style={style}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.title}</div>
        <span className={clsx(styles.cardBadge, BADGE_TONE[card.status])}>
          {card.status}
        </span>
      </div>
      <div className={styles.cardValue}>{String(card.value)}</div>
      <div
        className={clsx(
          styles.cardDelta,
          card.rising ? styles.deltaUp : styles.deltaDown,
        )}
      >
        {card.delta}
      </div>
      <div className={styles.cardTrack}>
        <div
          className={clsx(styles.cardFill, FILL_TONE[card.status])}
          style={{ width: `${card.permille / 10}%` }}
        />
      </div>
      {card.note && <div className={styles.cardNote}>{card.note}</div>}
      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.cardOpen}
          onClick={() => onOpen(card.id)}
        >
          Open
        </button>
      </div>
    </div>
  );
});

export default Card;
