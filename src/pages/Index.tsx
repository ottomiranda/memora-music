import { useState } from "react";
import Hero from "@/components/memora/Hero";
import HowItWorks from "@/components/memora/HowItWorks";
import PlanSection from "@/components/memora/PlanSection";
import ExamplesGrid from "@/components/memora/ExamplesGrid";
import ArtistsSection from "@/components/memora/ArtistsSection";
import TestimonialSection from "@/components/memora/TestimonialSection";
import FAQSection from "@/components/memora/FAQSection";
import FinalCTA from "@/components/memora/FinalCTA";

import CookieBanner from "@/components/memora/CookieBanner";
import AuthModal from "@/components/memora/AuthModal";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-body">
      <main>
        <Hero />
        <HowItWorks />
        <PlanSection />
        <ExamplesGrid />
        <ArtistsSection />
        <TestimonialSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <CookieBanner />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;