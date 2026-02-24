"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Store as StoreIcon, Palette, Globe, ShoppingBag, Truck, Zap, Megaphone } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Steps Imports
import { IdentityStep } from "./wizard-steps/IdentityStep";
import { DesignStep } from "./wizard-steps/DesignStep";
import { DomainStep } from "./wizard-steps/DomainStep";
import { CatalogStep } from "./wizard-steps/CatalogStep";
import { LogisticsStep } from "./wizard-steps/LogisticsStep";
import { IntegrationsStep } from "./wizard-steps/IntegrationsStep";
import { MarketingStep } from "./wizard-steps/MarketingStep";

const STEPS = [
    { id: "identity", label: "Identidad", icon: StoreIcon, description: "Nombre y logo de tu marca" },
    { id: "design", label: "Diseño", icon: Palette, description: "Colores y estilo visual" },
    { id: "domain", label: "Dominio", icon: Globe, description: "Tu dirección en internet" },
    { id: "catalog", label: "Catálogo", icon: ShoppingBag, description: "Categorías y productos" },
    { id: "logistics", label: "Logística", icon: Truck, description: "Zonas y costos de envío" },
    { id: "integrations", label: "Conexiones", icon: Zap, description: "Canales externos (ML, Shopify)" },
    { id: "marketing", label: "Crecimiento", icon: Megaphone, description: "Banners y promociones" },
];

export function UniversalWizard({ store: initialStore }: { store: Store }) {
    const { storeId } = useAuth();
    const [currentStepIdx, setCurrentStepIdx] = useState(() => {
        // If onboardingStatus is a number, use it as the starting step index
        if (typeof initialStore.onboardingStatus === 'number') {
            return Math.min(initialStore.onboardingStatus, STEPS.length - 1);
        }
        return 0;
    });
    const [store, setStore] = useState<Store>(initialStore);
    const [loading, setLoading] = useState(false);

    const currentStep = STEPS[currentStepIdx];

    const handleNext = async (data?: Partial<Store>) => {
        if (storeId) {
            setLoading(true);
            try {
                const nextStepIdx = Math.min(currentStepIdx + 1, STEPS.length - 1);
                const isFinalStep = currentStepIdx === STEPS.length - 1;

                const updateData: any = {
                    ...data,
                    // If we're moving forward, update the milestone unless already completed
                    onboardingStatus: isFinalStep ? "completed" : nextStepIdx
                };

                await updateDoc(doc(db, "stores", storeId), updateData);
                // Update local state to keep consistency across steps
                setStore(prev => ({ ...prev, ...updateData } as Store));

                if (isFinalStep) {
                    handleComplete();
                } else {
                    setCurrentStepIdx(nextStepIdx);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            } catch (error) {
                console.error("Error saving step:", error);
                toast.error("Error al guardar el progreso.");
                return;
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(currentStepIdx - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleComplete = async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, "stores", storeId), {
                onboardingStatus: "completed"
            });
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#6366f1", "#a855f7", "#ec4899"]
            });
            toast.success("¡Configuración universal completada!");
            setTimeout(() => {
                window.location.href = "/tenant";
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error("Error al finalizar el onboarding.");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep.id) {
            case "identity":
                return <IdentityStep store={store} onNext={handleNext} />;
            case "design":
                return <DesignStep store={store} onNext={handleNext} />;
            case "domain":
                return <DomainStep store={store} onNext={handleNext} />;
            case "catalog":
                return <CatalogStep store={store} onNext={handleNext} />;
            case "logistics":
                return <LogisticsStep store={store} onNext={handleNext} />;
            case "integrations":
                return <IntegrationsStep store={store} onNext={handleNext} />;
            case "marketing":
                return <MarketingStep store={store} onNext={handleNext} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex flex-col">
            {/* Header / Progress Bar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg hidden md:block italic">UnderDesk Flow Setup</span>
                    </div>

                    <div className="flex-1 max-w-2xl mx-8 hidden sm:block">
                        <div className="relative h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStepIdx + 1) / STEPS.length) * 100}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            Paso {currentStepIdx + 1} de {STEPS.length}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg ring-4 ring-primary/10">
                                    <currentStep.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{currentStep.label}</h1>
                                    <p className="text-muted-foreground">{currentStep.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Step Content Area */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm p-6 md:p-10 min-h-[400px]">
                            {renderStepContent()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStepIdx === 0 || loading}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Atrás
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button
                            form="wizard-form"
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold shadow-xl shadow-primary/20 gap-2 h-11"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {currentStepIdx === STEPS.length - 1 ? "Completar Configuración" : "Siguiente Paso"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
