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
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

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

      {/* Calendar card */}
      <div
        className={cn(
          "border bg-white p-4 transition-colors duration-200",
          selected ? "border-zinc-900" : "border-zinc-200"
        )}
        onTouchStart={(e) => {
          const t = e.touches[0];
          swipeRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!swipeRef.current) return;
          const dx = e.changedTouches[0].clientX - swipeRef.current.x;
          const dy = e.changedTouches[0].clientY - swipeRef.current.y;
          swipeRef.current = null;
          if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
          if (dx < 0) {
            setMonth((m) => addMonths(m, 1));
          } else {
            const prev = subMonths(month, 1);
            if (prev >= today || prev.getMonth() === today.getMonth()) return;
            setMonth(prev);
          }
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
