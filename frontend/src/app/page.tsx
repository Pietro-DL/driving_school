import { 
  HeroSection, 
  StatsSection, 
  AboutUsSection, 
  PricingSection 
} from "@/components/landing";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex flex-col w-full flex-1">
        <HeroSection />
        <StatsSection />
        <AboutUsSection />
        <PricingSection />
      </main>
    </div>
  );
}
