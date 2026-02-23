"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import { Banner } from "@/types";

const formSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    subtitle: z.string().optional(),
    image: z.string().min(1, "La imagen es requerida"),
    link: z.string().optional(),
    position: z.enum(["home", "collection", "checkout"]),
    isActive: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof formSchema>;

interface BannerFormProps {
    initialData: Banner | null;
}

export const BannerForm = ({ initialData }: BannerFormProps) => {
    const { storeId } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Editar Banner" : "Crear Banner";
    const description = initialData ? "Edita los detalles del banner." : "Añade un nuevo banner a tu tienda.";
    const action = initialData ? "Guardar cambios" : "Crear banner";

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            title: "",
            subtitle: "",
            image: "",
            link: "",
            position: "home",
            isActive: true,
        },
    });

    const onSubmit = async (data: BannerFormValues) => {
        if (!storeId) return;
        setLoading(true);
        try {
            const bannerData = {
                ...data,
                storeId,
                updatedAt: Date.now(),
            };

            if (initialData) {
                await setDoc(doc(db, "banners", initialData.id), bannerData, { merge: true });
                toast.success("Banner actualizado");
            } else {
                await addDoc(collection(db, "banners"), {
                    ...bannerData,
                    createdAt: Date.now(),
                });
                toast.success("Banner creado");
            }
            router.push("/tenant/marketing/banners");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Algo salió mal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>
            </div>
            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl">

                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL de Imagen</FormLabel>
                                <FormControl>
                                    <div className="flex gap-4 items-end">
                                        <div className="relative aspect-video w-40 bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                                            {field.value ? (
                                                <img src={field.value} alt="Preview" className="object-cover w-full h-full" />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <Input
                                            placeholder="https://ejemplo.com/banner.jpg"
                                            disabled={loading}
                                            {...field}
                                            className="flex-1"
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Pega la URL de tu imagen promocional.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título Principal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Oferta de Verano" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="subtitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subtítulo (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Hasta 50% OFF" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Posición</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona ubicación" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="home">Inicio (Home)</SelectItem>
                                            <SelectItem value="collection">Colecciones</SelectItem>
                                            <SelectItem value="checkout">Checkout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enlace de destino (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="/products/oferta" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Activo</FormLabel>
                                    <FormDescription>
                                        Mostrar este banner en la tienda.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {action}
                    </Button>
                </form>
            </Form>
        </div>
    );
};
