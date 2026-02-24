"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/tenant/settings/ImageUpload";
import { Store } from "@/types/store";
import { CardContent } from "@/components/ui/card";

const identitySchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    legalName: z.string().min(2, "La razón social es obligatoria"),
    taxId: z.string().min(7, "RUT/Tax ID inválido"),
    contactEmail: z.string().email("Email inválido"),
    phoneNumber: z.string().min(8, "Teléfono inválido"),
    address: z.string().min(5, "Dirección incompleta"),
    currency: z.string().min(3).max(3),
    logo: z.string().optional(),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

interface IdentityStepProps {
    store: Store;
    onNext: (data: Partial<Store>) => void;
}

export function IdentityStep({ store, onNext }: IdentityStepProps) {
    const form = useForm<IdentityFormValues>({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            name: store.name || "",
            legalName: store.legalName || "",
            taxId: store.taxId || "",
            contactEmail: store.contactEmail || "",
            phoneNumber: store.phoneNumber || "",
            address: store.address || "",
            currency: store.currency || "CLP",
            logo: store.logo || "",
        },
    });

    const onSubmit = (data: IdentityFormValues) => {
        onNext(data);
    };

    return (
        <Form {...form}>
            <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormLabel className="text-lg font-semibold mb-4 text-center">Logo de tu Marca</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange("")}
                                            folder={`stores/${store.id}/logos`}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-center mt-2">
                                        Sube un logo en formato PNG o SVG para mejor calidad.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moneda de la Tienda</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Selecciona moneda" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CLP">Pesos Chilenos (CLP)</SelectItem>
                                            <SelectItem value="USD">Dólares (USD)</SelectItem>
                                            <SelectItem value="MXN">Pesos Mexicanos (MXN)</SelectItem>
                                            <SelectItem value="EUR">Euros (EUR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Comercial</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: UnderDesk Studio" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="taxId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RUT / Tax ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 77.123.456-7" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="legalName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Razón Social (Nombre Legal)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Comercializadora UnderDesk SpA" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Soporte</FormLabel>
                                        <FormControl>
                                            <Input placeholder="hola@tumarcas.com" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono de Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+56 9 1234 5678" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección Comercial</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Calle Ejemplo 123, Oficina 402, Santiago" className="h-11" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Esta dirección aparecerá en tus facturas y envíos.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </form>
        </Form>
    );
}
