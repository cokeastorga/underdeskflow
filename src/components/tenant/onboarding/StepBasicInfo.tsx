"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Store } from "@/types/store";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "../settings/ImageUpload";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const basicInfoSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    currency: z.string().min(3).max(3),
    logo: z.string().optional(),
    phoneNumber: z.string().optional(),
    instagram: z.string().optional(),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

interface StepBasicInfoProps {
    store: Store;
    onComplete: () => void;
    loading: boolean;
}

export function StepBasicInfo({ store, onComplete, loading }: StepBasicInfoProps) {
    const form = useForm<BasicInfoValues>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            name: store.name || "",
            currency: store.currency || "CLP",
            logo: store.logo || "",
            phoneNumber: store.phoneNumber || "",
            instagram: store.socialLinks?.instagram || "",
        },
    });

    const onSubmit = async (data: BasicInfoValues) => {
        try {
            await updateDoc(doc(db, "stores", store.id), {
                name: data.name,
                currency: data.currency,
                logo: data.logo,
                phoneNumber: data.phoneNumber,
                socialLinks: {
                    ...store.socialLinks,
                    instagram: data.instagram,
                }
            });
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar información.");
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-xl font-semibold">Comencemos por lo básico</h3>
                <p className="text-muted-foreground">Dale identidad a tu tienda para que tus clientes te reconozcan.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center justify-center">
                                <FormLabel className="mb-2">Logo de la Tienda</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        onRemove={() => field.onChange("")}
                                        folder={`stores/${store.id}/logos`}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la Tienda</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mi Tienda Genial" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moneda (ISO)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="CLP" {...field} maxLength={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>WhatsApp / Teléfono</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+56 9 1234 5678" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instagram"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instagram (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="@mitienda" {...field} />
                                    </FormControl>
                                    <FormMessage />
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
