import { useEffect, useRef } from "react";
import styles from "./Dashboard.module.css";

const MIN_THUMB_PX = 32;

interface DragState {
  pointerId: number;
  startY: number;
  startScrollY: number;
}

export default function Scrollbar() {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const band = bandRef.current;
    const thumb = thumbRef.current;
    if (!band || !thumb) return undefined;

    let rafId = 0;

    const sync = () => {
      rafId = 0;
      const viewH = window.innerHeight;
      const contentH = document.documentElement.scrollHeight;
      if (contentH <= viewH || viewH <= MIN_THUMB_PX) {
        band.style.display = "none";
        return;
      }
      band.style.display = "";
      const length = Math.max(
        MIN_THUMB_PX,
        Math.floor((viewH * viewH) / contentH),
      );
      const maxScroll = contentH - viewH;
      const clampedScroll = Math.min(maxScroll, Math.max(0, window.scrollY));
      const offset = Math.floor((clampedScroll * (viewH - length)) / maxScroll);
      thumb.style.height = `${length}px`;
      thumb.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const scheduleSync = () => {
      if (rafId === 0) {
        rafId = requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    const ro = new ResizeObserver(scheduleSync);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const viewH = window.innerHeight;
      const contentH = document.documentElement.scrollHeight;
      if (contentH <= viewH || viewH <= MIN_THUMB_PX) return;

      const length = Math.max(
        MIN_THUMB_PX,
        Math.floor((viewH * viewH) / contentH),
      );
      const track = viewH - length;
      const range = contentH - viewH;
      if (track <= 0 || range <= 0) return;

      const currentOffset = Math.floor(
        (Math.min(range, Math.max(0, window.scrollY)) * track) / range,
      );
      let startScrollY = window.scrollY;
      const clickY = e.clientY;

      if (clickY < currentOffset || clickY > currentOffset + length) {
        const centeredOffset = Math.min(
          track,
          Math.max(0, clickY - length / 2),
        );
        startScrollY = Math.round((centeredOffset * range) / track);
        window.scrollTo(0, startScrollY);
        sync();
      }

      dragRef.current = {
        pointerId: e.pointerId,
        startY: clickY,
        startScrollY,
      };
      band.classList.add(styles.scrollbarDragging);
      band.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const viewH = window.innerHeight;
      const contentH = document.documentElement.scrollHeight;
      const length = Math.max(
        MIN_THUMB_PX,
        Math.floor((viewH * viewH) / contentH),
      );
      const track = viewH - length;
      const range = contentH - viewH;
      if (track <= 0 || range <= 0) return;
      const shiftPx = e.clientY - drag.startY;
      const target = Math.min(
        range,
        Math.max(0, drag.startScrollY + (shiftPx * range) / track),
      );
      window.scrollTo(0, target);
      sync();
    };

    const endDrag = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      band.classList.remove(styles.scrollbarDragging);
      if (band.hasPointerCapture(e.pointerId)) {
        band.releasePointerCapture(e.pointerId);
      }
    };

    band.addEventListener("pointerdown", onPointerDown);
    band.addEventListener("pointermove", onPointerMove);
    band.addEventListener("pointerup", endDrag);
    band.addEventListener("pointercancel", endDrag);

    return () => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      ro.disconnect();
      band.removeEventListener("pointerdown", onPointerDown);
      band.removeEventListener("pointermove", onPointerMove);
      band.removeEventListener("pointerup", endDrag);
      band.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  return (
    <div ref={bandRef} className={styles.scrollbar} aria-hidden="true">
      <div ref={thumbRef} className={styles.scrollbarThumb} />
    </div>
  );
}
