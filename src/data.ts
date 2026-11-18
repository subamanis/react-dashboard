export const DEFAULT_CARD_COUNT = 10_000;
export const MAX_CARD_COUNT = 25_000;

export function parseCardCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 1) return null;
  return Math.min(MAX_CARD_COUNT, Math.floor(num));
}

export type StatusTone = "ok" | "watch" | "alert";

export type LayoutMode = "grid" | "masonry";

export interface CardData {
  id: number;
  title: string;
  note: string;
  value: number;
  permille: number;
  status: StatusTone;
  delta: string;
  rising: boolean;
}

const TITLES = [
  "Requests",
  "Latency p99",
  "Disk Usage",
  "Active Worker Connections",
  "Gateway Error Disconnects",
  "Edge Cache Aggregations",
  "Active Stream Subscriptions Backpressure",
  "Replica Write Transactions Checkpoints",
] as const;

const NOTES = [
  "",
  "Upstream tail latency spike isolated on shard four ingress worker pool during regional failover drill and retry budget drain.",
  "Write ahead log compaction queued behind active checkpoint flush.",
  "",
  "TLS session ticket rotation increased handshake retries across edge listener pools before route convergence.",
  "",
  "Consumer lag crossed high watermark on partition twelve while downstream sink acknowledgements throttled batch commits across standby brokers.",
  "Read replica checkpoint sync completed after snapshot hash check.",
] as const;

const RISING_DELTAS = ["+0.4%", "+1.2%", "+3.8%", "+9.1%"] as const;
const FALLING_DELTAS = ["-0.3%", "-1.7%", "-4.2%", "-8.6%"] as const;

export function buildCards(count: number, step: number): CardData[] {
  return Array.from({ length: count }, (_, index) => {
    const slotIdx = index % 8;
    const title = TITLES[slotIdx];
    const note = NOTES[slotIdx];
    const seed = (index + step) >>> 0;
    const value = (Math.imul(seed, 7919) >>> 0) % 100_000;
    const permille = (Math.imul(seed, 37) >>> 0) % 1001;
    const status: StatusTone =
      permille < 600 ? "ok" : permille < 850 ? "watch" : "alert";
    const slot = seed % 4;
    const rising = seed % 3 !== 0;
    const delta = rising ? RISING_DELTAS[slot] : FALLING_DELTAS[slot];

    return {
      id: index,
      title,
      note,
      value,
      permille,
      status,
      delta,
      rising,
    };
  });
}
