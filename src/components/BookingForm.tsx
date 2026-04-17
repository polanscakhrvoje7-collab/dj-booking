"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { hr } from "date-fns/locale/hr";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WheelPicker } from "@/components/ui/wheel-picker";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// ── Validation schema ─────────────────────────────────────────────────────────
const bookingSchema = z.object({
  name: z.string().min(2, "Unesite ime"),
  location: z.string().min(5, "Unesite točnu adresu događaja"),
  time: z.string().min(1, "Odaberite vrijeme događaja"),
  guestCount: z
    .string()
    .min(1, "Broj gostiju je obavezan")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, "Potreban je najmanje 1 gost")
    .refine((v) => Number(v) <= 500, "Maksimalno 500 gostiju"),
  phone: z
    .string()
    .min(7, "Broj telefona je prekratak")
    .regex(/^[+\d\s().-]+$/, "Neispravan format broja telefona"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface BookingFormProps {
  selectedDate: Date | undefined;
}

export function BookingForm({ selectedDate }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { time: "20:00" },
  });

  const onSubmit = async (data: BookingFormValues) => {
    if (!selectedDate) {
      toast.error("Molimo prvo odaberite datum s kalendara.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: format(selectedDate, "yyyy-MM-dd"),
          guestCount: Number(data.guestCount),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Nešto je pošlo po krivu.");
      setIsSuccess(true);
      toast.success("Zahtjev poslan.", {
        description: `Kontaktirat ćemo vas s potvrdom za ${format(selectedDate, "d. MMMM yyyy.", { locale: hr })}.`,
      });
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Neuspješno slanje rezervacije.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 border border-zinc-200 bg-white p-12 text-center min-h-[420px]">
        <CheckCircle2 className="h-8 w-8 text-zinc-900" strokeWidth={1.5} />
        <div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Zahtjev Primljen</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            Zahtjev je primljen. Kontaktirat ćemo vas s potvrdom u roku od 24 sata.
          </p>
        </div>
        <button
          onClick={() => setIsSuccess(false)}
          className="text-xs text-zinc-400 underline underline-offset-4 hover:text-zinc-700 transition-colors"
        >
          Pošalji još jedan zahtjev
        </button>
      </div>
    );
  }

  // ── Locked state ──────────────────────────────────────────────────────────
  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center min-h-[420px]">
        <p className="text-sm font-medium text-zinc-400">Odaberite datum za nastavak</p>
        <p className="text-xs text-zinc-400 max-w-[200px]">
          Odaberite dostupan datum na kalendaru za otključavanje obrasca.
        </p>
      </div>
    );
  }

  // ── Active form ───────────────────────────────────────────────────────────
  return (
    <div className="border border-zinc-200 bg-white">
      {/* Form header */}
      <div className="border-b border-zinc-100 px-6 py-4">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Detalji Rezervacije</p>
        <p className="text-sm font-semibold text-zinc-900 mt-0.5">
          {format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: hr })}
        </p>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
        <Field label="Puno Ime" error={errors.name?.message}>
          <Input
            {...register("name")}
            placeholder="Ivan Horvat"
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white px-3 text-sm focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors",
              errors.name && "border-red-300"
            )}
          />
        </Field>

        <Field label="Adresa Događaja" error={errors.location?.message}>
          <Input
            {...register("location")}
            placeholder="Ilica 10, Zagreb, Hrvatska"
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white px-3 text-sm focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors",
              errors.location && "border-red-300"
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vrijeme Događaja" error={errors.time?.message}>
            <Controller
              control={control}
              name="time"
              render={({ field }) => {
                const [hh, mm] = (field.value ?? "20:00").split(":") as [string, string];
                return (
                  <div className="flex items-center justify-center gap-2 bg-white py-2" style={{ border: "1px solid #d4d4d8" }}>
                    <WheelPicker
                      items={HOURS}
                      value={hh ?? "20"}
                      onChange={(h) => field.onChange(`${h}:${mm ?? "00"}`)}
                      extraLeft={24}
                    />
                    <span className="text-2xl font-bold text-zinc-300 pb-1">:</span>
                    <WheelPicker
                      items={MINUTES}
                      value={mm ?? "00"}
                      onChange={(m) => field.onChange(`${hh ?? "20"}:${m}`)}
                      extraRight={24}
                    />
                  </div>
                );
              }}
            />
          </Field>

          <Field label="Broj Gostiju" error={errors.guestCount?.message}>
            <Input
              {...register("guestCount")}
              type="number"
              min={1}
              max={500}
              placeholder="150"
              className={cn(
                "h-10 rounded-none border-zinc-200 bg-white px-3 text-sm focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                errors.guestCount && "border-red-300"
              )}
            />
          </Field>
        </div>

        <Field label="Broj Telefona" error={errors.phone?.message}>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="+385 91 123 4567"
            className={cn(
              "h-10 rounded-none border-zinc-200 bg-white px-3 text-sm focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors",
              errors.phone && "border-red-300"
            )}
          />
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-none bg-zinc-950 text-sm font-semibold tracking-wide text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Slanje…
            </>
          ) : (
            "Pošalji Zahtjev za Rezervaciju"
          )}
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Plaćanje nije potrebno. Potvrda u roku od 24 sata.
        </p>
      </form>
    </div>
  );
}
