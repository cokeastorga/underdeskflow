"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, RefreshCw, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

export default function VerifyEmailPage() {
    const { user, role, logout } = useAuth();
    const router = useRouter();
    const [isResending, setIsResending] = useState(false);

    // Initial check: if already verified or not a tenant_admin, redirect out
    useEffect(() => {
        if (user && user.emailVerified) {
            router.push("/tenant/onboarding");
        }
    }, [user, router]);

    const handleResend = async () => {
        if (!user) return;
        setIsResending(true);
        try {
            const { sendEmailVerification } = await import("firebase/auth");
            const actionCodeSettings = {
                url: `${window.location.origin}/login?verify=success`,
                handleCodeInApp: true,
            };
            await sendEmailVerification(user, actionCodeSettings);
            toast.success("Correo de verificación re-enviado. Revisa tu spam.");
        } catch (error: any) {
            console.error("Resend error:", error);
            toast.error("Error al re-enviar el correo.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-zinc-950 overflow-hidden relative font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full flex flex-col items-center justify-center p-6 bg-zinc-950/50 backdrop-blur-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md space-y-8 text-center"
                >
                    {/* Brand */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl">
                            <LayoutTemplate className="h-10 w-10 text-violet-400" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                            UnderDesk <span className="text-violet-400">Flow</span>
                        </h1>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
                            <Mail className="h-6 w-6 text-violet-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
                            Verifica tu cuenta
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-[280px] mx-auto">
                            Hemos enviado un enlace de activación a:
                            <span className="block text-white font-medium mt-1">{user?.email}</span>
                        </p>
                    </div>

                    {/* Action Card */}
                    <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Para acceder a tu infraestructura operativa, debes confirmar que eres el dueño de esta dirección de correo electrónico.
                        </p>

                        <div className="space-y-3">
                            <Button 
                                onClick={handleResend}
                                disabled={isResending}
                                className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all hover:scale-[1.02]"
                            >
                                {isResending ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Re-enviar Correo"
                                )}
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="w-full h-12 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl transition-all"
                            >
                                Ya lo verifiqué, continuar
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="flex items-center justify-center gap-6 pt-4">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                        Awaiting Activation
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
