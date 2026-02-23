"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
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
import { Coupon } from "@/types";

const formSchema = z.object({
    code: z.string().min(3, "Mínimo 3 caracteres").toUpperCase(),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().min(0.01, "El valor debe ser mayor a 0"),
    minOrderAmount: z.coerce.number().optional(),
    maxUses: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof formSchema>;

interface CouponFormProps {
    initialData: Coupon | null;
}

export const CouponForm = ({ initialData }: CouponFormProps) => {
    const { storeId } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Editar Cupón" : "Crear Cupón";
    const description = initialData ? "Edita las reglas del descuento." : "Crea un nuevo código de descuento.";
    const action = initialData ? "Guardar cambios" : "Crear cupón";

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData || {
            code: "",
            type: "percentage",
            value: 0,
            minOrderAmount: 0,
            maxUses: 0, // 0 means infinite in this context logic, or undefined
            isActive: true,
        },
    });

    const onSubmit = async (data: CouponFormValues) => {
        if (!storeId) return;
        setLoading(true);
        try {
            const couponData = {
                ...data,
                storeId,
                updatedAt: Date.now(),
            };

            if (initialData) {
                await setDoc(doc(db, "coupons", initialData.id), couponData, { merge: true });
                toast.success("Cupón actualizado");
            } else {
                await addDoc(collection(db, "coupons"), {
                    ...couponData,
                    usedCount: 0,
                    createdAt: Date.now(),
                });
                toast.success("Cupón creado");
            }
            router.push("/tenant/marketing/coupons");
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
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 w-full max-w-2xl">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control as any}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <FormControl>
                                        <Input placeholder="VERANO2024" disabled={loading} {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                                    </FormControl>
                                    <FormDescription>Se guardará en mayúsculas.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Descuento</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="10" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        {form.watch("type") === "percentage" ? "Porcentaje de descuento (ej. 10 para 10%)" : "Monto a descontar (ej. 5000)"}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="minOrderAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Compra Mínima (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="maxUses"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Límite de Usos (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormDescription>Deja en 0 para ilimitado.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control as any}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Activo</FormLabel>
                                    <FormDescription>
                                        Habilitar este cupón para su uso inmediato.
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
