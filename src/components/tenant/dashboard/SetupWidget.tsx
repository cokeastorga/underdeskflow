"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, Store, Palette, Package, CreditCard } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Store as StoreType } from "@/types/store";

export function SetupWidget() {
    const { storeId } = useAuth();
    const [store, setStore] = useState<StoreType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;
        const fetchStore = async () => {
            try {
                const docRef = doc(db, "stores", storeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setStore({ id: docSnap.id, ...docSnap.data() } as StoreType);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [storeId]);

    if (loading || !store) return null;

    // Determine progress based on store data
    // This logic can be refined. For now:
    // 1. Store Created (Always true if we are here)
    // 2. Design customized (Check if design object exists and is modified - simplified check)
    // 3. Product added (We might need to check products collection, but for now let's use onboardingStatus or flags)
    // 4. Domain/Settings (Optional)

    const steps = [
        {
            id: 1,
            label: "Tienda Creada",
            description: "Tu tienda ha sido registrada exitosamente.",
            icon: Store,
            completed: true,
            href: "/tenant/settings"
        },
        {
            id: 2,
            label: "Personalizar Diseño",
            description: "Define lógos, colores y estructura.",
            icon: Palette,
            completed: store.design?.template !== undefined || (typeof store.onboardingStatus === 'number' && store.onboardingStatus >= 2) || store.onboardingStatus === 'completed',
            href: "/tenant/design"
        },
        {
            id: 3,
            label: "Agregar Primer Producto",
            description: "Sube tu primer producto al catálogo.",
            icon: Package,
            completed: (typeof store.onboardingStatus === 'number' && store.onboardingStatus >= 3) || store.onboardingStatus === 'completed', // Assuming 3 is set after first product
            href: "/tenant/products/new"
        },
        {
            id: 4,
            label: "Configurar Pagos",
            description: "Conecta Stripe o MercadoPago.",
            icon: CreditCard,
            completed: !!store.apiKeys?.stripe || !!store.apiKeys?.mercadoPago,
            href: "/tenant/settings"
        }
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    if (progress === 100) return null; // Don't show if fully set up

    return (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-white to-primary/5 dark:from-zinc-900 dark:to-zinc-900 overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Configuración de tu Tienda</CardTitle>
                        <CardDescription>Completa estos pasos para lanzar tu tienda.</CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                        <p className="text-xs text-muted-foreground">Completado</p>
                    </div>
                </div>
                <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isNext = !step.completed && (index === 0 || steps[index - 1].completed);

                        return (
                            <Link
                                key={step.id}
                                href={step.href}
                                className={`
                                    relative flex flex-col p-4 rounded-xl transition-all
                                    ${step.completed
                                        ? 'bg-primary/5 border border-primary/10'
                                        : isNext
                                            ? 'bg-white dark:bg-zinc-800 border-2 border-primary shadow-lg scale-105 z-10'
                                            : 'bg-white dark:bg-zinc-800 border opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-full ${step.completed ? 'bg-primary text-white' : 'bg-muted'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    {step.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <h3 className={`font-semibold ${isNext ? 'text-primary' : ''}`}>{step.label}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.description}</p>

                                {isNext && (
                                    <Button size="sm" className="mt-4 w-full" variant="default">
                                        Continuar <ArrowRight className="w-3 h-3 ml-2" />
                                    </Button>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
