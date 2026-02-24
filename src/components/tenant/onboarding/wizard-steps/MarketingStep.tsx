"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Megaphone, Image as ImageIcon, Sparkles, Send } from "lucide-react";
import { Store } from "@/types/store";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { ImageUpload } from "@/components/tenant/settings/ImageUpload";
import { Button } from "@/components/ui/button";

const marketingSchema = z.object({
    bannerTitle: z.string().min(2, "Mínimo 2 caracteres"),
    bannerSubtitle: z.string().optional(),
    bannerImage: z.string().optional(),
    bannerCta: z.string().min(1, "Texto del botón requerido"),
});

type MarketingFormValues = z.infer<typeof marketingSchema>;

interface MarketingStepProps {
    store: Store;
    onNext: (data?: Partial<Store>) => void;
}

export function MarketingStep({ store, onNext }: MarketingStepProps) {
    const form = useForm<MarketingFormValues>({
        resolver: zodResolver(marketingSchema),
        defaultValues: {
            bannerTitle: "¡Bienvenidos a nuestra nueva tienda!",
            bannerSubtitle: "Descubre nuestra colección exclusiva",
            bannerImage: "",
            bannerCta: "Comprar ahora",
        },
    });

    const onSubmit = async (data: MarketingFormValues) => {
        try {
            await addDoc(collection(db, "stores", store.id, "banners"), {
                title: data.bannerTitle,
                subtitle: data.bannerSubtitle,
                imageUrl: data.bannerImage,
                buttonText: data.bannerCta,
                buttonLink: "/products",
                position: 0,
                isActive: true,
                createdAt: serverTimestamp(),
            });
            toast.success("Banner promocional creado");
            onNext();
        } catch (error) {
            console.error("Error creating banner:", error);
            toast.error("Error al crear el banner");
        }
    };

    return (
        <Form {...form}>
            <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Lanza tu primera promoción</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Capta la atención de tus clientes con un banner profesional en la página de inicio.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="bannerImage"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormLabel className="text-center font-semibold mb-4">Imagen del Banner</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange("")}
                                            folder={`stores/${store.id}/marketing`}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-center mt-2">
                                        Recomendado: 1920x600px o similar.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="bannerTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Banner</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Título llamativo..." className="h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bannerSubtitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subtítulo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Descripción breve..." className="h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bannerCta"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Texto del Botón</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Comprar, Ver más, etc." className="h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-primary text-sm font-medium">
                        <Sparkles className="h-5 w-5" />
                        <span>Este banner se activará automáticamente al finalizar.</span>
                    </div>
                </div>
            </form>
        </Form>
    );
}
