"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 [touch-action:manipulation]">
      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        {/* Eyebrow */}
        <p className="animate-fade-up animation-delay-100 mb-6 text-[0.7rem] font-medium tracking-[0.35em] text-zinc-500 uppercase">
          Rezervacije 2026
        </p>

        {/* Main heading */}
        <h1 className="animate-fade-up animation-delay-200 mb-0">
          <span className="block text-[clamp(1rem,2.5vw,1.1rem)] font-light tracking-[0.5em] text-zinc-500 uppercase mb-5">
            Profesionalne DJ Usluge
          </span>
          <span className="block text-[clamp(5rem,16vw,11rem)] font-bold leading-none tracking-tighter text-white">
            DJ Hrchoy
          </span>
        </h1>

        {/* Thin rule */}
        <div className="animate-fade-up animation-delay-300 mx-auto my-8 h-px w-24 bg-zinc-700" />

        {/* Subtitle */}
        <p className="animate-fade-up animation-delay-300 mb-3 text-sm font-light tracking-[0.3em] text-zinc-400 uppercase">
          Rezervacije &amp; Dostupnost
        </p>

        {/* Tagline */}
        <p className="animate-fade-up animation-delay-400 mx-auto mb-12 max-w-md text-base text-zinc-500 leading-relaxed">
          Vjenčanja · Korporativni događaji · Privatne zabave · Klupske noći.
        </p>

        {/* CTA */}
        <div className="animate-fade-up animation-delay-500 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={scrollToBooking}
            className="min-w-[180px] rounded-none bg-white px-8 py-3 text-sm font-semibold tracking-wide text-zinc-950 hover:bg-zinc-100 transition-colors duration-200"
          >
            Provjeri Dostupnost
          </Button>
          <a
            href="https://www.instagram.com/dj.purger"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-w-[180px] rounded-none border border-zinc-700 bg-transparent px-8 py-3 text-sm font-medium tracking-wide text-zinc-400 hover:border-zinc-400 hover:text-white transition-colors duration-200"
          >
            Instagram
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToBooking}
        aria-label="Skrolaj prema dolje"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <span className="text-[0.65rem] tracking-[0.3em] uppercase">Skrolaj</span>
        <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
      </button>

    </section>
  );
}
