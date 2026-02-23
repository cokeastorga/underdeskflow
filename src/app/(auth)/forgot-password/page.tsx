"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
            toast.success("¡Email de recuperación enviado!");
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No hay cuenta registrada con este correo.");
            } else {
                toast.error("Error al enviar el correo.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 relative overflow-hidden font-sans">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-yellow-100/40 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 relative z-10 p-10 card-enterprise"
            >
                <div className="text-center">
                    <motion.div
                        initial={{ rotate: -45, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 mb-6"
                    >
                        <KeyRound className="h-8 w-8" />
                    </motion.div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 font-serif">
                        Recuperar Contraseña
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {sent
                            ? "Revisa tu correo para el enlace de reinicio"
                            : "Ingresa tu correo para recibir un enlace"
                        }
                    </p>
                </div>

                {!sent ? (
                    <form className="mt-8 space-y-6" onSubmit={handleReset}>
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                                    placeholder="Ingresa tu correo"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full flex justify-center btn-accent py-3 rounded-lg"
                                disabled={loading}
                            >
                                {loading ? "Enviando..." : "Enviar Enlace"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-8">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                            <p className="text-green-700 text-sm">
                                Si existe una cuenta para <strong>{email}</strong>, recibirás un correo pronto.
                            </p>
                        </div>
                        <Button
                            className="w-full flex justify-center mt-6 bg-slate-100/50 hover:bg-slate-100 text-slate-600"
                            onClick={() => setSent(false)}
                            variant="ghost"
                        >
                            Probar con otro correo
                        </Button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link href="/admin/login" className="flex items-center justify-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
