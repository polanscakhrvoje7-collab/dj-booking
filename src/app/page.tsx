import { HeroSection } from "@/components/HeroSection";
import { BookingSection } from "@/components/BookingSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <BookingSection />
      <Footer />
    </main>
  );
}
