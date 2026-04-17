"use client";

import { useState } from "react";
import { BookingCalendar } from "./BookingCalendar";
import { BookingForm } from "./BookingForm";


export function BookingSection() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <section id="booking" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mb-14 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Provjeri Dostupnost i Rezerviraj Datum
          </h2>
          <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
            Slobodni termini za 2026. — rezervirajte dok su dostupni.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16 items-start">
          {/* Left: Calendar + perks */}
          <div className="flex flex-col gap-8">
            <BookingCalendar selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          {/* Right: Form */}
          <div>
            <BookingForm selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </section>
  );
}
