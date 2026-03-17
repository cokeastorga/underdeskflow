"use client";

import React from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { PlanId, PLANS } from "@/domains/subscriptions/types";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FeatureGuardProps {
    feature: keyof typeof PLANS.Basic.features;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showIneligible?: boolean;
}

export function FeatureGuard({ 
    feature, 
    children, 
    fallback, 
    showIneligible = false 
}: FeatureGuardProps) {
    const { user, store, role } = useAuth();
    
    // Si es platfrom_admin, tiene acceso a todo (opcional)
    if (role === "platform_admin") return <>{children}</>;

    // Si no hay tienda todavía (onboarding), permitimos ver todo lo básico
    if (!store) return <>{children}</>;

    const planId = (store.planId || "Basic") as PlanId;
    const plan = PLANS[planId];
    
    const isEligible = plan.features[feature];

    if (isEligible) {
        return <>{children}</>;
    }

    if (fallback) return <>{fallback}</>;

    if (showIneligible) {
        return (
            <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30 flex flex-col items-center text-center gap-4">
                <AlertCircle className="h-10 w-10 text-amber-600" />
                <div>
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Módulo no disponible</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        Tu plan actual ({plan.name}) no incluye esta funcionalidad.
                    </p>
                </div>
                <Link href="/tenant/upgrade">
                    <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                        Mejorar Plan
                    </Button>
                </Link>
            </div>
        );
    }

    return null;
}
