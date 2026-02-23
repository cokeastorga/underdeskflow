"use client";

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
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
    return (
        <div className="bg-background text-foreground overflow-x-hidden">
            <LandingNav />
            <HeroSection />
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
            <LandingFooter />
        </div>
    );
}
