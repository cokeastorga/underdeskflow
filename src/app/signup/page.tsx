"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // In Production: We would use react-hook-form + zod here.
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        storeName: "",
        slug: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSlugify = () => {
        if (!formData.slug && formData.storeName) {
            setFormData(prev => ({
                ...prev,
                slug: prev.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. In Production: Call Auth Provider (Firebase Auth / Supabase Auth)
            // await auth.createUserWithEmailAndPassword(formData.email, formData.password)
            
            // 2. Trigger Auto-Provisioning
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    storeName: formData.storeName,
                    slug: formData.slug
                })
            });

            if (!res.ok) throw new Error("Error provisionando la tienda.");
            
            const data = await res.json();
            
            toast.success("Tienda creada exitosamente", {
                description: `Dominio temporal: ${data.domain} (${data.durationMs}ms)`
            });
            
            // 3. Autologin and redirect to their Admin Workspace
            router.push("/admin");

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
            <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24">
                <div className="max-w-md w-full mx-auto space-y-8">
                    <div>
                        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                            <Store className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Abre tu tienda hoy</h2>
                        <p className="text-muted-foreground mt-2">
                            Únete a UnderDeskFlow y centraliza tus ventas físicas y online en 5 segundos.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre Completo</label>
                                <input 
                                    name="name" 
                                    onChange={handleChange} 
                                    required 
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Correo Electrónico</label>
                                <input 
                                    name="email" 
                                    type="email" 
                                    onChange={handleChange} 
                                    required 
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contraseña Secure</label>
                            <input 
                                name="password" 
                                type="password" 
                                onChange={handleChange} 
                                required 
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                            />
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre de la Tienda</label>
                                <input 
                                    name="storeName" 
                                    onChange={handleChange} 
                                    onBlur={handleSlugify}
                                    required 
                                    placeholder="Ej. Delicias Porteñas"
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dominio Web Temporal</label>
                            <div className="flex rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                                <input 
                                    name="slug" 
                                    value={formData.slug} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="delicias-portenas"
                                    className="flex h-10 w-full bg-transparent px-3 py-2 text-sm focus-visible:outline-none border-0" 
                                />
                                <span className="flex items-center px-4 bg-muted text-muted-foreground text-sm border-l border-input rounded-r-md">
                                    .udf.cl
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Podrás agregar dominios .cl o .com más tarde.</p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-11 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 mt-4 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? "Provisionando Servidores..." : "Crear mi tienda ahora"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>
                </div>
            </div>

            <div className="hidden md:flex flex-col bg-muted p-12 justify-center items-center border-l border-border">
                <div className="max-w-md text-center space-y-4">
                    <h3 className="text-2xl font-bold">Unifica tu Retail</h3>
                    <p className="text-muted-foreground">
                        Punto de Venta físico, Tienda en línea, e integraciones con MercadoLibre, Shopify, Rappi. Todo sincronizado en el mismo milisegundo.
                    </p>
                </div>
            </div>
        </div>
    );
}
