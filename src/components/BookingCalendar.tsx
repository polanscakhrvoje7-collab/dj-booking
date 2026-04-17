"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { isDateAvailable, getAvailabilityLabel, MIN_ADVANCE_DAYS } from "@/lib/availability";
import { addMonths, format, subMonths } from "date-fns";
import { hr } from "date-fns/locale/hr";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export function BookingCalendar({ selected, onSelect }: BookingCalendarProps) {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());

  // Swipe / drag state (refs = no re-render during drag)
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const isFirstMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();

  /** Apply a resisted (sqrt-damped) offset when dragging toward a blocked direction */
  const resist = (raw: number) =>
    raw > 0 && isFirstMonth ? Math.sqrt(raw) * 7 : raw;

  const setTransform = (x: number, transition = "none") => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = x === 0 ? "" : `translateX(${x}px)`;
  };

  const slideToMonth = (direction: -1 | 1) => {
    const el = cardRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    // slide out
    setTransform(direction * -w, "transform 0.22s ease-in");
    setTimeout(() => {
      setMonth((m) =>
        direction === -1 ? addMonths(m, 1) : subMonths(m, 1)
      );
      // snap to opposite side instantly, then slide in
      setTransform(direction * w);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setTransform(0, "transform 0.22s ease-out")
        )
      );
    }, 220);
  };

  const fetchAvailability = () => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data: { busyDates: string[] }) => {
        setBusyDates(new Set(data.busyDates ?? []));
      })
      .catch(() => {});
  };

  // Fetch on mount
  useEffect(() => {
    fetchAvailability();
  }, []);

  // Deselect if the selected date becomes unavailable after a refresh
  useEffect(() => {
    if (selected && isDisabled(selected)) {
      onSelect(undefined);
    }
  }, [busyDates]);

  // Refresh when user comes back to the tab (e.g. after approving a booking)
  useEffect(() => {
    const onFocus = () => fetchAvailability();
    const onVisible = () => { if (document.visibilityState === "visible") fetchAvailability(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const isDisabled = (date: Date) => {
    if (!isDateAvailable(date)) return true;
    const str = format(date, "yyyy-MM-dd");
    return busyDates.has(str);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Odaberi Datum</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Dostupni dani: {getAvailabilityLabel()}</p>
      </div>

      {/* Calendar card — outer clips overflow during slide animation */}
      <div
        className={cn(
          "overflow-hidden border transition-colors duration-200",
          selected ? "border-zinc-900" : "border-zinc-200"
        )}
      >
        {/* Inner div moves during swipe/slide */}
        <div
          ref={cardRef}
          className="bg-white p-4"
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setTransform(0);
          }}
          onTouchMove={(e) => {
            if (!touchStart.current) return;
            const dx = e.touches[0].clientX - touchStart.current.x;
            const dy = e.touches[0].clientY - touchStart.current.y;
            if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll — ignore
            setTransform(resist(dx));
          }}
          onTouchEnd={(e) => {
            if (!touchStart.current) return;
            const dx = e.changedTouches[0].clientX - touchStart.current.x;
            const dy = e.changedTouches[0].clientY - touchStart.current.y;
            touchStart.current = null;

            const isSwipe = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy);

            if (!isSwipe || (dx > 0 && isFirstMonth)) {
              // Spring back with bounce
              setTransform(0, "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)");
              return;
            }

            slideToMonth(dx < 0 ? -1 : 1);
          }}
        >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={isDisabled}
          month={month}
          onMonthChange={(m) => { setMonth(m); fetchAvailability(); }}
          fromMonth={today}
          captionLayout="label"
          locale={hr}
          weekStartsOn={1}
          className="p-0"
          classNames={{
            root: "w-full",
            months: "relative w-full",
            month: "w-full",
            table: "w-full",
            weekdays: "flex",
            weekday: "flex-1 text-center text-[0.75rem] font-medium text-zinc-400 select-none py-1",
            week: "mt-1 flex w-full",
            day: "flex-1 text-center",
            disabled: "opacity-100",
            day_button: "w-full h-full min-h-[2.75rem]",
          }}
        />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-900" />
          <span className="text-xs text-zinc-500">Odabrano</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-400" />
          <span className="text-xs text-zinc-500">Nedostupno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-zinc-900 bg-white" />
          <span className="text-xs text-zinc-500">Dostupno</span>
        </div>
      </div>

      {/* Status notice */}
      {selected ? (
        <div className="border-l-2 border-zinc-900 bg-zinc-50 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">
            {format(selected, "EEEE, d. MMMM yyyy.", { locale: hr })}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ispunite obrazac za rezervaciju.
          </p>
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Potrebno je minimalno {MIN_ADVANCE_DAYS} dana unaprijed. Pet–Ned su obično dostupni.
        </p>
      )}
    </div>
  );
}
