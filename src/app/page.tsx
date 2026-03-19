import { adminDb } from "@/lib/firebase/admin-config";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import StoreSetupSection from "@/components/landing/modules/StoreSetupSection";
import DesignSection from "@/components/landing/modules/DesignSection";
import ProductsSection from "@/components/landing/modules/ProductsSection";
import ShippingSection from "@/components/landing/modules/ShippingSection";
import PaymentsSection from "@/components/landing/modules/PaymentsSection";
import AnalyticsSection from "@/components/landing/modules/AnalyticsSection";
import CrmSection from "@/components/landing/modules/CrmSection";
import MarketingSection from "@/components/landing/modules/MarketingSection";
import CategoriesSection from "@/components/landing/modules/CategoriesSection";
import PricingSection from "@/components/landing/PricingSection";
import SecurityHardeningSection from "@/components/landing/modules/SecurityHardeningSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default async function LandingPage() {
    // Check if the system is in "First Run" state (no stores)
    const storesSnap = await adminDb.collection("stores").limit(1).get();
    const isFirstRun = storesSnap.empty;

    return (
        <div className="relative bg-zinc-950 text-foreground overflow-x-hidden selection:bg-primary/30">
            {/* ── Premium Background System ────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Global Grain Texture */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
                />
                
                {/* Deep Gradient Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[5%] w-[30%] h-[30%] bg-violet-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col gap-24 md:gap-32 pb-24 md:pb-32">
                <LandingNav />
                <HeroSection isFirstRun={isFirstRun} />
                
                {/* Enterprise Hardening Proof */}
                <SecurityHardeningSection />
                
                {!isFirstRun && (
                    <div className="flex flex-col gap-24 md:gap-32">
                        <StoreSetupSection />
                        <DesignSection />
                        <ProductsSection />
                        <ShippingSection />
                        <PaymentsSection />
                        <AnalyticsSection />
                        <CrmSection />
                        <MarketingSection />
                        <CategoriesSection />
                        <PricingSection />
                    </div>
                )}
                
                <LandingFooter />
            </div>
        </div>
    );
}
