import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import PricingHero from "@/components/landing/PricingHero";
import FeaturesSlider from "@/components/landing/FeaturesSlider";
import PricingCards from "@/components/landing/PricingCards";
import CalculatorSection from "@/components/landing/CalculatorSection";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Pricing Plan | REe",
    description: "Automate every part of your resell operation. Pick the plan that fits.",
};

export default function PricingPage() {
    return (
        <div className="font-[family-name:var(--font-space-grotesk)] w-full overflow-x-hidden">
            <LandingHeader />
            <PricingHero />
            <FeaturesSlider />
            <PricingCards />
            <CalculatorSection />
            <LandingFooter />
        </div>
    );
}
