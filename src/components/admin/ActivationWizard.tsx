"use client";

import { CheckCircle2, Circle, ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { ActivationSteps, ActivationStatus } from "@/domains/tenants/types";

interface ActivationWizardProps {
    status: ActivationStatus;
    steps: ActivationSteps;
}

export function ActivationWizard({ status, steps }: ActivationWizardProps) {
    if (status === "ACTIVE") {
        return null; // Don't show the wizard if they've already succeeded
    }

    const completedCount = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progressPerc = Math.round((completedCount / totalSteps) * 100);

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">🚀 Activa tu tienda</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                            Completa estos pasos para configurar tu cuenta y recibir tu primer pago a través de UnderDeskFlow.
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{progressPerc}%</span>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Completado</div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2.5 mt-6 overflow-hidden">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressPerc}%` }}></div>
                </div>
            </div>
            
            <div className="divide-y divide-border">
                <StepRow 
                    isCompleted={steps.logoUploaded} 
                    title="Sube el logo de tu tienda" 
                    description="Personaliza tu E-commerce y tus comprobantes de caja física."
                    actionHref="/admin/settings"
                    actionLabel="Ir a Configuración"
                />
                
                <StepRow 
                    isCompleted={steps.firstProductCreated} 
                    title="Crea tu primer producto propio" 
                    description="Elige de qué se trata tu negocio. Agrega precios, variantes y fotos."
                    actionHref="/admin/products/new"
                    actionLabel="Crear Producto"
                />
                
                <StepRow 
                    isCompleted={steps.paymentsConnected} 
                    title="Configura tus retiros de dinero" 
                    description="Conecta tu cuenta bancaria o billetera para recibir el dinero de tus ventas."
                    actionHref="/admin/settings/payouts"
                    actionLabel="Conectar Cuenta"
                />

                <StepRow 
                    isCompleted={steps.testOrderCompleted} 
                    title="Haz una compra de prueba" 
                    description="Experimenta el flujo exacto que verán tus clientes en el sitio web."
                    actionHref="/storefront"
                    actionLabel="Ir a mi tienda online"
                />
            </div>
            
            {completedCount === totalSteps && (
                <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                            <PartyPopper className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-emerald-800">¡Tu tienda está lista para vender!</p>
                            <p className="text-sm text-emerald-600">Has completado toda la configuración básica.</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors">
                        Activar Cuenta Oficialmente
                    </button>
                </div>
            )}
        </div>
    );
}

function StepRow({ 
    isCompleted, 
    title, 
    description, 
    actionHref, 
    actionLabel 
}: { 
    isCompleted: boolean, 
    title: string, 
    description: string, 
    actionHref: string, 
    actionLabel: string 
}) {
    return (
        <div className={`p-5 flex items-center gap-4 transition-colors ${isCompleted ? 'bg-muted/10' : 'hover:bg-muted/30'}`}>
            <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1">
                <p className={`font-medium ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            {!isCompleted && (
                <Link href={actionHref} className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    {actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            )}
        </div>
    );
}
