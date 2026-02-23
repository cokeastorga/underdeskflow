"use client";

import { useEffect, useState } from "react";
import { Store } from "@/types/store";
import { useRouter, usePathname } from "next/navigation";
import { WelcomeModal } from "./WelcomeModal";
import { useGuide } from "../guides/GuideContext";
import { toast } from "sonner";

interface OnboardingOrchestratorProps {
    store: Store;
}

export function OnboardingOrchestrator({ store }: OnboardingOrchestratorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [step, setStep] = useState<number | "completed" | "pending">(store.onboardingStatus || 0);

    // Sync local state with store prop changes
    useEffect(() => {
        if (store.onboardingStatus !== undefined) {
            setStep(store.onboardingStatus);
        }
    }, [store.onboardingStatus]);

    useEffect(() => {
        if (step === "completed") return;

        // Step 0: Welcome Modal (Handled by component render)
        if (step === 0 || step === "pending") {
            // No redirect, just show modal
        }
        // Step 1: Design
        else if (step === 1) {
            if (pathname !== "/tenant/design") {
                router.push("/tenant/design");
                toast.info("Paso 2: Personaliza el diseño de tu tienda.");
            }
        }
        // Step 2: Settings (Operations/Locations)
        else if (step === 2) {
            if (pathname !== "/tenant/settings") {
                router.push("/tenant/settings");
                toast.info("Paso 3: Configura tus envíos y sucursales.");
            }
        }
        // Step 3: Products
        else if (step === 3) {
            if (pathname !== "/tenant/products") {
                router.push("/tenant/products");
                toast.info("Paso 4: Crea tu primer producto.");
            }
        }

    }, [step, pathname, router]);

    if (step === 0 || step === "pending") {
        return <WelcomeModal store={store} onComplete={() => { }} />;
    }

    // For other steps, the Orchestrator is invisible but manages state/redirects.
    // We could render specific overlays here too if needed.
    return null;
}
