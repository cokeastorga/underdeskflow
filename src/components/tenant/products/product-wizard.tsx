"use client";

import { useEffect } from "react";
import { useProductFormLogic } from "@/hooks/useProductFormLogic";
import { useProductWizard } from "@/hooks/useProductWizard";
import { WizardSteps } from "./wizard/wizard-steps";
import { ContextHelper } from "./wizard/context-helper";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Store } from "@/types/store";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Wizard Steps Content
import { GeneralSection } from "./form-sections/general-section";
import { MediaSection } from "./form-sections/media-section";
import { PricingSection } from "./form-sections/pricing-section";
import { InventorySection } from "./form-sections/inventory-section";
import { VariantsSection } from "./form-sections/VariantsSection";
import { SeoSection } from "./form-sections/seo-section";
import { OrganizationSection } from "./form-sections/organization-section";
import { SpecificationsSection } from "./form-sections/specifications-section";
import { StatusTagsSection } from "./form-sections/status-tags-section";

const STEPS = [
    { id: 0, label: "Información Básica" },
    { id: 1, label: "Multimedia" },
    { id: 2, label: "Precios e Inventario" },
    { id: 3, label: "Variantes" },
    { id: 4, label: "Especificaciones" },
    { id: 5, label: "SEO y Publicación" },
];

export function ProductWizard() {
    const { form, onSubmit, loading, router } = useProductFormLogic({ initialData: null }) as any;

    // Auth & Store Context for Onboarding
    const { storeId } = useAuth();
    const [store, setStore] = useState<Store | null>(null);

    useEffect(() => {
        if (storeId) {
            getDoc(doc(db, "stores", storeId)).then(snap => {
                if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
            });
        }
    }, [storeId]);

    const handleCompleteOnboarding = async () => {
        if (store && store.onboardingStatus === 3) {
            await updateDoc(doc(db, "stores", store.id), {
                onboardingStatus: "completed"
            });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            toast.success("¡Felicidades! Has completado la configuración inicial.");
            setTimeout(() => { window.location.href = "/tenant"; }, 2000);
        }
    };

    const originalOnSubmit = onSubmit;
    const handleFinalSubmit = async (data: any) => {
        await originalOnSubmit(data);
        await handleCompleteOnboarding();
    };

    // Wizard State
    const { currentStep, setStep, isGuidedMode, toggleGuidedMode, markStepComplete } = useProductWizard();

    // Navigation
    const handleNext = async () => {
        let fieldsToValidate: string[] = [];

        switch (currentStep) {
            case 0: fieldsToValidate = ["title", "description", "category"]; break;
            case 1: fieldsToValidate = ["media"]; break;
            case 2: fieldsToValidate = ["price", "costPrice", "stock", "sku"]; break;
            case 3:
                const variants = form.getValues("variants");
                const hasVariants = form.getValues("hasVariants");
                if (hasVariants && (!variants || variants.length === 0)) {
                    form.setError("variants", {
                        type: "manual",
                        message: "Debes generar las variantes antes de continuar."
                    });
                    return;
                }
                fieldsToValidate = ["hasVariants", "options", "variants"];
                break;
            case 4: fieldsToValidate = []; break; // Specs are optional
            case 5: fieldsToValidate = ["slug", "status"]; break;
        }

        const isValid = await form.trigger(fieldsToValidate as any);
        if (isValid) {
            markStepComplete(currentStep);
            setStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setStep(currentStep - 1);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <GeneralSection form={form as any} />
                        <OrganizationSection form={form as any} />
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <MediaSection form={form as any} />
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <PricingSection form={form as any} />
                        <InventorySection form={form as any} />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <VariantsSection form={form as any} />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <SpecificationsSection form={form as any} />
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <StatusTagsSection form={form as any} />
                        <SeoSection form={form as any} />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* LEFT: Steps */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-muted/10 p-6 overflow-y-auto">
                <Button variant="ghost" className="mb-8 pl-0 justify-start" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <WizardSteps steps={STEPS} currentStep={currentStep} />
            </aside>

            {/* CENTER: Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b flex items-center justify-between bg-background z-10">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm">Paso {currentStep + 1} de {STEPS.length}</span>
                    <Button variant="ghost" size="icon" onClick={toggleGuidedMode}>?</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto pb-24">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold tracking-tight">{STEPS[currentStep].label}</h2>
                            <p className="text-muted-foreground">Completa la información requerida.</p>
                        </div>

                        <Form {...form}>
                            <form>
                                {renderStepContent()}
                            </form>
                        </Form>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20 flex justify-between items-center max-w-5xl mx-auto w-full px-6 md:px-10">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || loading}
                    >
                        Atrás
                    </Button>

                    {currentStep === STEPS.length - 1 ? (
                        <Button
                            onClick={form.handleSubmit(handleFinalSubmit, (errors: any) => {
                                console.error("Validation Errors:", errors);
                                toast.error("Por favor, revisa los errores en el formulario antes de publicar.");
                            })}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Publicar Producto <Check className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleNext} disabled={loading}>
                            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>

            {/* RIGHT: Context Helper */}
            {isGuidedMode && (
                <aside className="hidden xl:flex w-80 flex-col border-l bg-muted/10 p-6 overflow-y-auto transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold">Guía Rápida</h3>
                        <Button variant="ghost" size="sm" onClick={toggleGuidedMode} className="h-8 text-xs">Ocultar</Button>
                    </div>
                    <ContextHelper currentStep={currentStep} />
                </aside>
            )}
        </div>
    );
}
