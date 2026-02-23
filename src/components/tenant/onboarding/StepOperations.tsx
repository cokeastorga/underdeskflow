"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Store } from "@/types/store";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowRight, Truck, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const operationsSchema = z.object({
    pickup: z.boolean(),
    delivery: z.boolean(),
});

type OperationsValues = z.infer<typeof operationsSchema>;

interface StepOperationsProps {
    store: Store;
    onComplete: () => void;
    loading: boolean;
}

export function StepOperations({ store, onComplete, loading }: StepOperationsProps) {
    const form = useForm<OperationsValues>({
        resolver: zodResolver(operationsSchema),
        defaultValues: {
            pickup: store.fulfillment?.pickup ?? true,
            delivery: store.fulfillment?.delivery ?? false,
        },
    });

    const onSubmit = async (data: OperationsValues) => {
        try {
            await updateDoc(doc(db, "stores", store.id), {
                fulfillment: {
                    pickup: data.pickup,
                    delivery: data.delivery,
                }
            });

            // Onboarding Progression: Step 2 -> 3
            if (store?.onboardingStatus === 2) {
                await updateDoc(doc(db, "stores", store.id), {
                    onboardingStatus: 3
                });
                toast.success("¡Configuración guardada! Continuando...");
                // Orchestrator will handle redirect
            } else {
                onComplete();
                toast.success("Configuración guardada correctamente.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar configuración.");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-xl font-semibold">¿Cómo entregas tus productos?</h3>
                <p className="text-muted-foreground">Selecciona los métodos de entrega que tendrás disponibles.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="pickup"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Card className={`p-4 flex items-center justify-between cursor-pointer border-2 transition-all ${field.value ? "border-primary bg-primary/5" : "border-muted"}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${field.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                    <StoreIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <FormLabel className="text-base cursor-pointer">Retiro en Tienda</FormLabel>
                                                    <FormDescription>
                                                        Tus clientes podrán buscar sus compras en tu sucursal.
                                                    </FormDescription>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </Card>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="delivery"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Card className={`p-4 flex items-center justify-between cursor-pointer border-2 transition-all ${field.value ? "border-primary bg-primary/5" : "border-muted"}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${field.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                    <Truck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <FormLabel className="text-base cursor-pointer">Despacho a Domicilio</FormLabel>
                                                    <FormDescription>
                                                        Envía los pedidos a la dirección de tus clientes.
                                                    </FormDescription>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </Card>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" size="lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Siguiente Paso <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
