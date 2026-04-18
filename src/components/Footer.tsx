import { Mail, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const CONTACT_ITEMS = [
  { icon: Mail, text: "polanscakhrvoje@gmail.com", href: "mailto:polanscakhrvoje@gmail.com" },
  { icon: Phone, text: "+385 99 041 802 402", href: "tel:+38599041802402" },
  { icon: InstagramIcon, text: "@dj.purger", href: "https://www.instagram.com/dj.purger" },
];

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-500">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:justify-items-center">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="text-base font-bold tracking-tight text-white">DJ Hrcoy</span>
            <p className="text-sm leading-relaxed max-w-[240px] text-zinc-500">
              Profesionalne DJ usluge za vjenčanja, korporativne događaje, privatne zabave i klupske noći.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
              Kontakt
            </h4>
            <div className="flex flex-col gap-3">
              {CONTACT_ITEMS.map(({ icon: Icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  {text}
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-zinc-900" />

        <div className="flex justify-center text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} DJ Hrcoy. Sva prava pridržana.</p>
        </div>
      </div>
    </footer>
  );
}
