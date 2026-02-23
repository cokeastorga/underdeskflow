"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "./ImageUpload";
import { Store } from "@/types/store";
import { Loader2, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const profileSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    logo: z.string().optional(),
    currency: z.string().min(3).max(3),
    contactEmail: z.string().email().optional().or(z.literal("")),
    phoneNumber: z.string().optional(),
    socialLinks: z.object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
    }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface StoreProfileFormProps {
    initialData: Store;
}

export function StoreProfileForm({ initialData }: StoreProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(initialData.id);
        setCopied(true);
        toast.success("ID copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialData.name || "",
            description: initialData.description || "",
            logo: initialData.logo || "",
            currency: initialData.currency || "USD",
            contactEmail: initialData.contactEmail || "",
            phoneNumber: initialData.phoneNumber || "",
            socialLinks: {
                instagram: initialData.socialLinks?.instagram || "",
                facebook: initialData.socialLinks?.facebook || "",
                twitter: initialData.socialLinks?.twitter || "",
            },
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "stores", initialData.id), {
                ...data,
                // Ensure we don't overwrite critical fields like ownerId, createdAt, etc.
            });
            toast.success("Perfil de tienda actualizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Identidad de Marca</CardTitle>
                        <CardDescription>
                            Estos elementos se mostrarán en tu tienda y correos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logo de la Tienda</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange("")}
                                            folder={`stores/${initialData.id}/logos`}
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
                                        <FormLabel>Nombre Comercial</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mi Tienda Inc." {...field} />
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
                                            <Input placeholder="USD" {...field} maxLength={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción Corta</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Somos líderes en..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contacto y Redes</CardTitle>
                        <CardDescription>
                            Información pública para tus clientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>ID de la Tienda</Label>
                            <div className="flex gap-2">
                                <Input value={initialData.id} disabled className="bg-muted font-mono" />
                                <Button type="button" variant="outline" size="icon" onClick={handleCopyId}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Usa este ID para identificar tu tienda en soporte o integraciones.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contacto@tienda.com" {...field} />
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
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+56 9 1234 5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="socialLinks.instagram"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram</FormLabel>
                                        <FormControl>
                                            <Input placeholder="@tutienda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facebook</FormLabel>
                                        <FormControl>
                                            <Input placeholder="facebook.com/tutienda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.twitter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Twitter / X</FormLabel>
                                        <FormControl>
                                            <Input placeholder="@tutienda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </form>
        </Form>
    );
}
