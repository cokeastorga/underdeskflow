"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Store } from "@/types/store";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OnboardingProgressProps {
    store: Store;
}

export function OnboardingProgress({ store }: OnboardingProgressProps) {
    if (store.onboardingStatus === "completed") return null;

    return (
        <div className="mx-4 mt-6 mb-4 p-4 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-2xl border border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <h4 className="text-sm font-bold text-primary">Configuración Inicial</h4>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                Completa los pasos restantes para activar todas las funciones de tu tienda.
            </p>
            <Button asChild size="sm" className="w-full h-8 text-xs font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/tenant/onboarding" className="flex items-center justify-center gap-2">
                    Ir al Setup Wizard
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </Button>
        </div>
    );
}
