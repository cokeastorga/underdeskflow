"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { Zap, Lock, Plus, Check } from "lucide-react";
import { Store } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_DISPLAY, ChannelType } from "@/types/channels";

const AVAILABLE_CHANNELS: { type: ChannelType; comission: string }[] = [
    { type: "shopify", comission: "Varía por plan" },
    { type: "mercadolibre", comission: "~12% por venta" },
    { type: "pedidosya", comission: "~25% por venta" },
    { type: "tiendanube", comission: "Varía por plan" },
];

interface IntegrationsStepProps {
    store: Store;
    onNext: (data?: Partial<Store>) => void;
}

export function IntegrationsStep({ store, onNext }: IntegrationsStepProps) {
    const isEnterprise = store.plan === "enterprise";

    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">Conectar Canales Externos</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    Sincroniza stock y órdenes automáticamente con los marketplaces más importantes.
                </p>
            </div>

            {!isEnterprise ? (
                <Card className="border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/10 overflow-hidden">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-violet-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold">Módulo Enterprise</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                La sincronización con canales externos es exclusiva de nuestro plan **Enterprise**.
                                Actualiza tu plan para desbloquear estas integraciones.
                            </p>
                        </div>
                        <Button variant="outline" className="border-violet-500/30 text-violet-600 hover:bg-violet-500/5">
                            Ver Planes & Beneficios
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_CHANNELS.map((ch) => {
                        const info = CHANNEL_DISPLAY[ch.type];
                        return (
                            <Card key={ch.type} className="bg-white dark:bg-zinc-900 overflow-hidden border-slate-200 dark:border-zinc-800 hover:border-primary/30 transition-all group">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <span className="text-4xl group-hover:scale-110 transition-transform">{info.icon}</span>
                                    <div className="flex-1">
                                        <p className="font-bold">{info.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Comisión: {ch.comission}</p>
                                    </div>
                                    <Button size="sm" variant="secondary" className="gap-2 shrink-0">
                                        <Plus className="h-3 w-3" />
                                        Conectar
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-2xl border text-center space-y-4">
                <p className="text-xs text-muted-foreground italic">
                    "Puedes omitir este paso y conectar tus canales en cualquier momento desde el Panel de Control."
                </p>
            </div>

            <form id="wizard-form" onSubmit={(e) => { e.preventDefault(); onNext(); }} />
        </div>
    );
}
