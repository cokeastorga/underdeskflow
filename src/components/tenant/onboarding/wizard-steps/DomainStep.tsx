"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Globe, ShieldCheck, Link2 } from "lucide-react";
import { Store } from "@/types/store";

const domainSchema = z.object({
    id: z.string().min(3, "Mínimo 3 caracteres").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
    customDomain: z.string().optional().or(z.literal("")),
});

type DomainFormValues = z.infer<typeof domainSchema>;

interface DomainStepProps {
    store: Store;
    onNext: (data: Partial<Store>) => void;
}

export function DomainStep({ store, onNext }: DomainStepProps) {
    const form = useForm<DomainFormValues>({
        resolver: zodResolver(domainSchema),
        defaultValues: {
            id: store.id || "",
            customDomain: store.customDomain || "",
        },
    });

    const onSubmit = (data: DomainFormValues) => {
        onNext(data);
    };

    const storeId = form.watch("id");

    return (
        <Form {...form}>
            <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                            <FormItem className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-primary/20">
                                <FormLabel className="flex items-center gap-2 text-lg font-bold mb-4">
                                    <Link2 className="h-5 w-5 text-primary" />
                                    Tu dirección gratis
                                </FormLabel>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden px-4 h-14 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                        <span className="text-muted-foreground font-medium md:block hidden">underdesk.flow/</span>
                                        <FormControl>
                                            <input
                                                className="flex-1 bg-transparent border-none outline-none font-bold text-primary placeholder:text-muted-foreground/50 h-full min-w-0"
                                                placeholder="mi-tienda"
                                                {...field}
                                            />
                                        </FormControl>
                                    </div>
                                </div>
                                <FormDescription className="mt-4">
                                    Esta será la dirección pública de tu tienda. Puedes cambiarla más tarde si no está ocupada.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="relative py-4 flex items-center">
                        <div className="flex-grow border-t"></div>
                        <span className="flex-shrink mx-4 text-muted-foreground text-sm font-medium">O usa tu propio dominio</span>
                        <div className="flex-grow border-t"></div>
                    </div>

                    <FormField
                        control={form.control}
                        name="customDomain"
                        render={({ field }) => (
                            <FormItem className="p-6 rounded-3xl border border-dashed">
                                <FormLabel className="flex items-center gap-2 font-semibold">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    Dominio Personalizado
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="www.midominio.com" className="h-12" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Configura un dominio .com, .cl o .net que ya poseas.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-900/30">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        Todas las tiendas cuentan con **Certificado SSL (HTTPS)** gratuito incluido, incluso en subdominios.
                    </p>
                </div>
            </form>
        </Form>
    );
}
