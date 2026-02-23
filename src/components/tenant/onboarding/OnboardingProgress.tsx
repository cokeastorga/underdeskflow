"use client";

import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Store } from "@/types/store";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
    store: Store;
}

export function OnboardingProgress({ store }: OnboardingProgressProps) {
    const currentStep = store.onboardingStatus === "completed" ? 4 : (store.onboardingStatus as number) || 0;

    if (currentStep === 4) return null; // Hide when completed

    const steps = [
        { id: 0, label: "Inicio" },
        { id: 1, label: "Diseño" },
        { id: 2, label: "Operación" },
        { id: 3, label: "Productos" },
    ];

    return (
        <div className="mx-4 mt-6 mb-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
                <PartyPopper className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-primary">Tu Progreso</h4>
            </div>
            <div className="space-y-3 relative">
                {/* Vertical Line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-muted -z-10" />

                {steps.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={cn(
                                "relative z-10 rounded-full bg-background transition-all duration-300",
                                isCompleted ? "text-primary" : isCurrent ? "text-primary animate-pulse" : "text-muted-foreground"
                            )}>
                                {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : isCurrent ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-primary bg-background" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                            </div>
                            <span className={cn(
                                "text-sm transition-colors duration-300",
                                isCompleted || isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
