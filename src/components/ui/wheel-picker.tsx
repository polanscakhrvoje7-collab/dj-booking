"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface WheelPickerProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}

const ITEM_H = 44;
const VISIBLE = 7;

function itemStyle(distance: number): React.CSSProperties {
  switch (distance) {
    case 0:
      return { color: "#09090b", fontSize: "1.35rem", fontWeight: 700, opacity: 1 };
    case 1:
      return { color: "#52525b", fontSize: "1.05rem", fontWeight: 400, opacity: 0.7 };
    case 2:
      return { color: "#a1a1aa", fontSize: "0.9rem", fontWeight: 400, opacity: 0.45 };
    default:
      return { color: "#d4d4d8", fontSize: "0.85rem", fontWeight: 400, opacity: 0.3 };
  }
}

export function WheelPicker({ items, value, onChange }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(Math.max(0, items.indexOf(value)));
  const [centeredIndex, setCenteredIndex] = useState(centeredRef.current);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * ITEM_H, behavior });
  }, []);

  useEffect(() => {
    const index = items.indexOf(value);
    if (index >= 0) {
      centeredRef.current = index;
      setCenteredIndex(index);
      scrollToIndex(index, "instant");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Non-passive wheel: exactly one item per scroll tick
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(items.length - 1, centeredRef.current + direction));
      if (next === centeredRef.current) return;
      centeredRef.current = next;
      setCenteredIndex(next);
      onChange(items[next]);
      scrollToIndex(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [items, onChange, scrollToIndex]);

  // Track touch scroll in real-time so visual effects (color/zoom) follow the finger
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const index = Math.max(
          0,
          Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H))
        );
        if (index !== centeredRef.current) {
          centeredRef.current = index;
          setCenteredIndex(index);
          onChange(items[index]);
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [items, onChange]);

  const pad = Math.floor(VISIBLE / 2);

  return (
    <div className="relative overflow-hidden" style={{ height: ITEM_H * VISIBLE, width: "4.5rem" }}>
      {/* Center highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10"
        style={{ top: pad * ITEM_H, height: ITEM_H, borderTop: "1px solid #d4d4d8", borderBottom: "1px solid #d4d4d8" }}
      />

      {/* Scroll list */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: pad * ITEM_H,
          paddingBottom: pad * ITEM_H,
          scrollbarWidth: "none",
          userSelect: "none",
        }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - centeredIndex);
          return (
            <div
              key={item}
              style={{ scrollSnapAlign: "center", height: ITEM_H, transition: "all 0.15s ease", ...itemStyle(dist) }}
              className="flex items-center justify-center cursor-pointer"
              onClick={() => {
                centeredRef.current = i;
                setCenteredIndex(i);
                onChange(item);
                scrollToIndex(i);
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
