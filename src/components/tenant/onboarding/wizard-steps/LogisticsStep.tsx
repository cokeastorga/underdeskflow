"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Truck, MapPin, BadgeDollarSign, Building2 } from "lucide-react";
import { Store } from "@/types/store";
import { CARRIER_META } from "@/types/shipping";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const logisticsSchema = z.object({
    mainZoneName: z.string().min(2, "Mínimo 2 caracteres"),
    baseShippingCost: z.number().min(0),
    enabledCarriers: z.array(z.string()),
});

type LogisticsFormValues = z.infer<typeof logisticsSchema>;

interface LogisticsStepProps {
    store: Store;
    onNext: (data: Partial<Store>) => void;
}

export function LogisticsStep({ store, onNext }: LogisticsStepProps) {
    const form = useForm<LogisticsFormValues>({
        resolver: zodResolver(logisticsSchema),
        defaultValues: {
            mainZoneName: "Región Metropolitana",
            baseShippingCost: 0,
            enabledCarriers: Object.entries(store.carriers || {})
                .filter(([_, config]) => config.enabled)
                .map(([id]) => id),
        },
    });

    const onSubmit = (data: LogisticsFormValues) => {
        // Prepare carriers object for store update
        const carriersUpdate: any = {};
        CARRIER_META.forEach(c => {
            if (c.id !== "ownFleet") {
                carriersUpdate[c.id] = {
                    enabled: data.enabledCarriers.includes(c.id),
                    config: {}
                };
            }
        });

        onNext({
            // Note: We might want to create a zone doc too, but for onboarding 
            // we'll just store the preference or let the parent handle it.
            // For now, we update carriers in the store doc.
            carriers: carriersUpdate
        });
    };

    const toggleCarrier = (id: string) => {
        const current = form.getValues("enabledCarriers");
        if (current.includes(id)) {
            form.setValue("enabledCarriers", current.filter(c => c !== id));
        } else {
            form.setValue("enabledCarriers", [...current, id]);
        }
    };

    return (
        <Form {...form}>
            <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                {/* Zones */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Zonas de Despacho</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border">
                        <FormField
                            control={form.control}
                            name="mainZoneName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zona Principal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Santiago Poniente" className="h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="baseShippingCost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Costo de Envío Base</FormLabel>
                                    <div className="relative">
                                        <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="h-12 pl-10"
                                                value={field.value}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Carriers */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Transportistas Integrados</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {CARRIER_META.filter(c => c.id !== "ownFleet").map((carrier) => (
                            <div
                                key={carrier.id}
                                className={`flex items-center justify-between p-4 border rounded-2xl transition-all cursor-pointer hover:border-primary/50 ${form.watch("enabledCarriers").includes(carrier.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}
                                onClick={() => toggleCarrier(carrier.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{carrier.name}</p>
                                        <p className="text-[10px] text-muted-foreground">SLA: {carrier.defaultSla}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.watch("enabledCarriers").includes(carrier.id)}
                                // onClick handles the toggle
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl flex items-start gap-3 border border-amber-100 dark:border-amber-900/30">
                    <Truck className="h-5 w-5 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        La configuración de **Flota Propia** y asignación de choferes se encuentra en el siguiente paso para planes Intermedios y Enterprise.
                    </p>
                </div>
            </form>
        </Form>
    );
}
