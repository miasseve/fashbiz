import LandingHeader from "@/components/landing/LandingHeader";
import FAQSection from "@/components/landing/FAQSection";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata = {
  title: "FAQ — REe",
  description: "Common questions answered about REe retail automation consulting.",
};

export default function FAQPage() {
  return (
    <div className="landing-page">
      <LandingHeader />
      <div className="h-[56px]" />
      <FAQSection />
      <LandingFooter />
    </div>
  );
}
