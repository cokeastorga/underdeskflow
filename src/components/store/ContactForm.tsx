"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
    message: z.string().min(10, "el mensaje debe tener al menos 10 caracteres"),
    honeypot: z.string().optional(), // Spam prevention
});

type FormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
    storeId: string;
    primaryColor: string;
}

export function ContactForm({ storeId, primaryColor }: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (data: FormValues) => {
        // If honeypot is filled, it's likely a bot
        if (data.honeypot) {
            console.log("Bot detected");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "store_messages"), {
                storeId,
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message,
                status: "new",
                createdAt: serverTimestamp(),
            });

            setIsSuccess(true);
            toast.success("Mensaje enviado correctamente");
            reset();

            // Reset success state after 5 seconds to allow new messages
            setTimeout(() => setIsSuccess(false), 5000);
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Hubo un error al enviar el mensaje. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">¡Mensaje Enviado!</h3>
                <p className="text-muted-foreground max-w-sm">
                    Hemos recibido tu consulta correctamente. Nuestro equipo te responderá a la brevedad posible.
                </p>
                <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 rounded-xl"
                >
                    Enviar otro mensaje
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-950 p-8 md:p-12 rounded-3xl border border-border/50 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <h2 className="text-2xl font-bold mb-8">Envíanos un Mensaje</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Honeypot field - hidden from users */}
                <input type="text" {...register("honeypot")} className="hidden" tabIndex={-1} autoComplete="off" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Tu nombre"
                            className={`rounded-xl ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            {...register("name")}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            className={`rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            {...register("email")}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                        id="subject"
                        placeholder="¿En qué podemos ayudarte?"
                        className={`rounded-xl ${errors.subject ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        {...register("subject")}
                    />
                    {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                        id="message"
                        placeholder="Escribe tu mensaje aquí..."
                        className={`min-h-[150px] rounded-xl resize-none ${errors.message ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        {...register("message")}
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl py-6 text-base font-bold group transition-all duration-300"
                    style={{ backgroundColor: primaryColor }}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            Enviar Mensaje
                            <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                    )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    Responderemos en menos de 24 horas hábiles.
                </p>
            </form>
        </div>
    );
}
