"use client";

import { useEffect } from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import VideoSection from "@/components/landing/VideoSection";
import HeroSection from "@/components/landing/HeroSection";
import RetailerCTA from "@/components/landing/RetailerCTA";
import ProblemCarousel from "@/components/landing/ProblemCarousel";
import ProcessSection from "@/components/landing/ProcessSection";
import ToolsSection from "@/components/landing/ToolsSection";
import TeamSection from "@/components/landing/TeamSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function TheProblemPage() {
  useEffect(() => {
    const el = document.getElementById("problem");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="landing-page">
      <LandingHeader />
      <div className="h-[56px]" />
      <VideoSection />
      <HeroSection />
      <RetailerCTA />
      <ProblemCarousel />
      <ProcessSection />
      <ToolsSection />
      <TeamSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
