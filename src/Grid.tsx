import { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { CardData, LayoutMode } from "./data";
import Card from "./Card";
import styles from "./Dashboard.module.css";

const SUPPORTS_GRID_LANES =
  typeof CSS !== "undefined" && CSS.supports("display", "grid-lanes");

interface Point {
  x: number;
  y: number;
}

interface MasonryState {
  positions: Point[];
  totalHeight: number;
}

function computeMasonryColumns(innerW: number) {
  const cols = Math.min(16, Math.max(1, Math.floor((innerW + 12) / 232)));
  const colW = Math.max(220, Math.floor((innerW - (cols - 1) * 12) / cols));
  return { cols, colW };
}

function useContainerMetrics(wrapperRef: React.RefObject<HTMLDivElement | null>) {
  const [metrics, setMetrics] = useState({ innerW: 0, scrollMargin: 0 });

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;

    const update = () => {
      const nextInnerW = el.clientWidth;
      const nextScrollMargin = Math.round(
        el.getBoundingClientRect().top + window.scrollY,
      );
      setMetrics((prev) =>
        prev.innerW === nextInnerW && prev.scrollMargin === nextScrollMargin
          ? prev
          : { innerW: nextInnerW, scrollMargin: nextScrollMargin },
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, [wrapperRef]);

  return metrics;
}

interface JsMasonryProps {
  cards: CardData[];
  onOpen: (id: number) => void;
}

const JsMasonryBoard = memo(function JsMasonryBoard({
  cards,
  onOpen,
}: JsMasonryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { innerW } = useContainerMetrics(containerRef);
  const [fontTick, setFontTick] = useState(0);
  const [masonry, setMasonry] = useState<MasonryState>({
    positions: [],
    totalHeight: 0,
  });

  const { cols, colW } =
    innerW > 0 ? computeMasonryColumns(innerW) : { cols: 1, colW: 220 };

  useEffect(() => {
    if (!document.fonts || document.fonts.status === "loaded") return undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || innerW <= 0) return;

    const children = Array.from(el.children) as HTMLElement[];
    const heights = children.map((child) => child.offsetHeight);
    const colHeights = new Array<number>(cols).fill(0);
    const stride = colW + 12;

    const positions = heights.map((h) => {
      let best = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[best]) {
          best = c;
        }
      }
      const point = { x: best * stride, y: colHeights[best] };
      colHeights[best] += h + 12;
      return point;
    });

    const totalHeight = Math.max(0, Math.max(...colHeights) - 12);
    setMasonry({ positions, totalHeight });
  }, [cards, cols, colW, innerW, fontTick]);

  return (
    <div
      ref={containerRef}
      className={styles.masonryJs}
      style={
        masonry.totalHeight > 0
          ? { height: `${masonry.totalHeight}px` }
          : undefined
      }
    >
      {innerW > 0 &&
        cards.map((card, index) => {
          const pos = masonry.positions[index];
          return (
            <Card
              key={card.id}
              card={card}
              positioned
              style={{
                width: `${colW}px`,
                transform: pos
                  ? `translate3d(${pos.x}px, ${pos.y}px, 0)`
                  : undefined,
              }}
              onOpen={onOpen}
            />
          );
        })}
    </div>
  );
});

interface VirtualBoardProps {
  cards: CardData[];
  onOpen: (id: number) => void;
}

const VirtualGrid = memo(function VirtualGrid({
  cards,
  onOpen,
}: VirtualBoardProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { innerW, scrollMargin } = useContainerMetrics(wrapperRef);
  const cols = innerW > 0 ? Math.max(1, Math.floor((innerW + 12) / 232)) : 1;
  const cardCount = cards.length;
  const rowCount = Math.ceil(cardCount / cols);

  const virtualizer = useWindowVirtualizer({
    count: innerW > 0 ? rowCount : 0,
    estimateSize: () => 315,
    gap: 12,
    overscan: 3,
    scrollMargin,
  });

  const prevSpecRef = useRef(`${cols}:${cardCount}`);
  useLayoutEffect(() => {
    const spec = `${cols}:${cardCount}`;
    if (prevSpecRef.current !== spec) {
      prevSpecRef.current = spec;
      virtualizer.measure();
    }
  }, [virtualizer, cols, cardCount]);

  const rows = virtualizer.getVirtualItems();

  return (
    <div
      ref={wrapperRef}
      className={styles.virtualList}
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {rows.map((row) => {
        const startIdx = row.index * cols;
        const rowCards = cards.slice(startIdx, startIdx + cols);
        return (
          <div
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            className={styles.virtualRow}
            style={{
              transform: `translate3d(0, ${row.start - scrollMargin}px, 0)`,
            }}
          >
            {rowCards.map((card) => (
              <Card key={card.id} card={card} onOpen={onOpen} />
            ))}
          </div>
        );
      })}
    </div>
  );
});

const VirtualMasonry = memo(function VirtualMasonry({
  cards,
  onOpen,
}: VirtualBoardProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { innerW, scrollMargin } = useContainerMetrics(wrapperRef);
  const { cols, colW } =
    innerW > 0 ? computeMasonryColumns(innerW) : { cols: 1, colW: 220 };
  const cardCount = cards.length;

  const virtualizer = useWindowVirtualizer({
    count: innerW > 0 ? cardCount : 0,
    lanes: cols,
    laneAssignmentMode: "measured",
    estimateSize: () => 235,
    gap: 12,
    overscan: 5,
    scrollMargin,
  });

  const prevSpecRef = useRef(`${cols}:${colW}:${cardCount}`);
  useLayoutEffect(() => {
    const spec = `${cols}:${colW}:${cardCount}`;
    if (prevSpecRef.current !== spec) {
      prevSpecRef.current = spec;
      virtualizer.measure();
    }
  }, [virtualizer, cols, colW, cardCount]);

  const items = virtualizer.getVirtualItems();
  const stride = colW + 12;

  return (
    <div
      ref={wrapperRef}
      className={styles.virtualList}
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {items.map((item) => (
        <Card
          key={item.key}
          card={cards[item.index]}
          positioned
          cardRef={virtualizer.measureElement}
          dataIndex={item.index}
          style={{
            width: `${colW}px`,
            transform: `translate3d(${item.lane * stride}px, ${item.start - scrollMargin}px, 0)`,
          }}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
});

interface GridProps {
  cards: CardData[];
  layout: LayoutMode;
  cv: boolean;
  virtual: boolean;
  onOpen: (id: number) => void;
}

const Grid = memo(function Grid({
  cards,
  layout,
  cv,
  virtual,
  onOpen,
}: GridProps) {
  if (virtual) {
    return layout === "masonry" ? (
      <VirtualMasonry cards={cards} onOpen={onOpen} />
    ) : (
      <VirtualGrid cards={cards} onOpen={onOpen} />
    );
  }

  if (layout === "masonry") {
    if (SUPPORTS_GRID_LANES) {
      return (
        <div className={styles.masonryLanes}>
          {cards.map((card) => (
            <Card key={card.id} card={card} onOpen={onOpen} />
          ))}
        </div>
      );
    }
    return <JsMasonryBoard cards={cards} onOpen={onOpen} />;
  }

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <Card key={card.id} card={card} cv={cv} onOpen={onOpen} />
      ))}
    </div>
  );
});

export default Grid;
