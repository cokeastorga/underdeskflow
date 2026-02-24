"use client";

import { useState, useEffect, Suspense } from "react";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [oobCode, setOobCode] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const code = searchParams.get("oobCode");
        if (!code) {
            setError("El enlace de recuperación es inválido o ha expirado.");
            setVerifying(false);
            return;
        }

        setOobCode(code);
        // Verify the code with Firebase
        verifyPasswordResetCode(auth, code)
            .then(() => {
                setVerifying(false);
            })
            .catch((err) => {
                console.error(err);
                setError("El código de recuperación es inválido o ya fue utilizado.");
                setVerifying(false);
            });
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oobCode || newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
            toast.success("Contraseña actualizada con éxito.");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            console.error(err);
            toast.error("Hubo un error al actualizar la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
                <p className="text-slate-500 text-sm">Verificando enlace...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Enlace Inválido</h2>
                    <p className="mt-2 text-sm text-slate-500">{error}</p>
                </div>
                <Link href="/forgot-password">
                    <Button variant="outline" className="w-full mt-4">
                        Solicitar nuevo enlace
                    </Button>
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">¡Contraseña Actualizada!</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login en unos segundos.
                    </p>
                </div>
                <Link href="/login">
                    <Button className="w-full mt-4 btn-accent">
                        Ir al Login ahora
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                        type="password"
                        required
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        placeholder="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                        type="password"
                        required
                        className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                        placeholder="Confirmar Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full flex justify-center btn-accent py-3 rounded-lg"
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 mb-6">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 font-serif">
                        Nueva Contraseña
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Crea una contraseña segura para tu cuenta.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
                        <p className="text-slate-500 text-sm">Cargando...</p>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
