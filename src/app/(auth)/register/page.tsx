"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Mail, Chrome, User, Phone, Building2, LayoutTemplate, Check } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        phone: "",
        email: "",
        password: "",
        terms: false
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.terms) {
            toast.error("Debes aceptar los términos y condiciones.");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Force session creation
            const idToken = await user.getIdToken();
            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            // Create user document with enhanced profile
            await setDoc(doc(db, "users", user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName,
                phone: formData.phone,
                email: user.email,
                createdAt: Date.now(),
                role: "owner", // Owner of the new tenant
                onboardingComplete: false
            });

            toast.success("¡Cuenta creada! Redirigiendo a la configuración...");
            router.push("/tenant/onboarding");
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Este correo ya está registrado.");
            } else {
                toast.error("Error al crear la cuenta.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const idToken = await user.getIdToken();
            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            // Check if user doc exists, if not create it
            // Logic handled in onboarding or subsequent checks usually, 
            // but for registration flow we can assume basic setup if new.
            // For Google Auth, we might miss phone/company initially.
            // We can redirect to a specific "complete profile" step in onboarding.

            router.push("/tenant/onboarding");
        } catch (error: any) {
            console.error("Google register error:", error);
            toast.error("Falló el registro con Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background overflow-hidden relative">

            {/* Left Section - Branding & Visuals (Matches Login/Landing) */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative z-10 bg-gradient-to-br from-primary/5 to-background border-r border-border"
            >
                <Link href="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <LayoutTemplate className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">EnterpriseOS</span>
                </Link>

                <div className="max-w-md">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground font-serif leading-tight">
                        Construye tu <br />
                        <span className="text-gradient">Legado Digital</span>
                    </h2>
                    <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                        Únete a miles de empresas que escalan sin límites. Tu infraestructura de clase mundial comienza aquí.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                        Prueba gratuita de 14 días
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                        Sin tarjeta de crédito requerida
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                        Soporte prioritario 24/7
                    </div>
                </div>
            </motion.div>

            {/* Right Section - Registration Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Crear una cuenta</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Comienza tu viaje empresarial en segundos.
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Nombre</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        name="firstName"
                                        required
                                        className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                        placeholder="Juan"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Apellido</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        name="lastName"
                                        required
                                        className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                        placeholder="Pérez"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Empresa</label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="companyName"
                                    required
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="Mi Empresa S.A."
                                    value={formData.companyName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Teléfono</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="+52 55 1234 5678"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="juan@empresa.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="block w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2.5 text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                name="terms"
                                id="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                                Acepto los <Link href="/terms" className="text-primary hover:underline">términos y condiciones</Link> y la <Link href="/privacy" className="text-primary hover:underline">política de privacidad</Link>.
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    Creando cuenta...
                                </span>
                            ) : (
                                "Crear Cuenta"
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
                        onClick={handleGoogleRegister}
                        disabled={loading}
                    >
                        <Chrome className="mr-2 h-5 w-5" />
                        Registrarse con Google
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                            Iniciar Sesión
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
