import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ForWhoSection from "@/components/landing/ForWhoSection";
import TechStackSection from "@/components/landing/TechStackSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import ScrollProgress from "@/components/landing/ScrollProgress";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ForWhoSection />
      <TechStackSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
