"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/lib/firebase/auth-context";
import { auth, googleProvider, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Mail, Chrome, LayoutTemplate, ArrowRight } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // We can use local loading state for the form, but redirection is handled by effect
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading, storeId } = useAuth();

    // Automatic redirect when authenticated
    useEffect(() => {
        if (!authLoading && user) {
            if (storeId) {
                router.push("/tenant");
            } else {
                router.push("/tenant/onboarding");
            }
            toast.success("¡Bienvenido de nuevo!");
        }
    }, [user, authLoading, storeId, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // No need to fetch or redirect here; AuthContext + useEffect handles it
        } catch (error: any) {
            console.error(error);
            toast.error("Credenciales inválidas.");
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Ensure user document exists (defensive for new Google users)
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                lastLogin: Date.now(),
            }, { merge: true });

            // AuthContext handles the rest
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast.info("Inicio de sesión cancelado.");
            } else {
                toast.error("Falló el inicio de sesión con Google.");
            }
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">

            {/* Left Section - Branding (Matches Landing) */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative z-10 bg-gradient-to-br from-primary/5 to-background border-r border-border"
            >
                <Link href="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <LayoutTemplate className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">UnderDesk Flow</span>
                </Link>

                <div className="max-w-md">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground font-serif leading-tight">
                        UnderDesk <br />
                        <span className="text-gradient font-sans">Flow</span>
                    </h2>
                    <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                        Infraestructura operativa invisible para el comercio digital.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    UDF Engine
                </div>
            </motion.div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm space-y-8"
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="Correo corporativo"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                                Crear cuenta
                            </Link>
                            <Link href="/forgot-password" className="font-medium text-muted-foreground hover:text-foreground transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            disabled={isLoggingIn || authLoading}
                        >
                            {isLoggingIn || authLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    Accediendo...
                                </span>
                            ) : (
                                "Acceder al Panel"
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">O</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all hover:scale-[1.02]"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn || authLoading}
                    >
                        <Chrome className="mr-2 h-5 w-5" />
                        Continuar con Google
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
