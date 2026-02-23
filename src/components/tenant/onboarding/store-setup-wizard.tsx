"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Building2, Mail, MapPin, Truck, Rocket, Phone, Globe, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Store } from "@/types/store";
import { PlanId } from "@/types/billing";
import confetti from "canvas-confetti";
import { canCreateStore, planLimitMessage } from "@/lib/billing/plans";

const STEPS = [
    { id: 0, label: "Identidad de Marca", icon: Building2 },
    { id: 1, label: "Contacto y Redes", icon: Mail },
    { id: 2, label: "Sucursal Principal", icon: MapPin },
    { id: 3, label: "Operaciones", icon: Truck },
    { id: 4, label: "¡Todo Listo!", icon: Rocket },
];

interface StoreSetupWizardProps {
    store: Store;
}

export function StoreSetupWizard({ store }: StoreSetupWizardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(
        typeof store.onboardingStatus === "number" ? store.onboardingStatus : 0
    );
    const [saving, setSaving] = useState(false);
    const [planBlocked, setPlanBlocked] = useState(false);
    const [userPlan, setUserPlan] = useState<PlanId>("basic");
    const [userStoreCount, setUserStoreCount] = useState(0);

    // Load user plan + storeCount to enforce limits
    useEffect(() => {
        if (!user) return;
        getDoc(doc(db, "users", user.uid)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setUserPlan((data.plan as PlanId) ?? "basic");
                setUserStoreCount(data.storeCount ?? 0);
            }
        });
    }, [user]);

    // Step 0: Identity
    const [identity, setIdentity] = useState({
        name: store.name || "",
        description: store.description || "",
        currency: store.currency || "CLP",
    });

    // Step 1: Contact
    const [contact, setContact] = useState({
        contactEmail: store.contactEmail || "",
        phoneNumber: store.phoneNumber || "",
        instagram: store.socialLinks?.instagram || "",
        facebook: store.socialLinks?.facebook || "",
        whatsapp: store.socialLinks?.whatsapp || "",
    });

    // Step 2: Location
    const [location, setLocation] = useState({
        name: "Casa Matriz",
        address: "",
        hours: "Lun-Vie 09:00 - 18:00",
    });

    // Step 3: Operations
    const [ops, setOps] = useState({
        pickup: store.fulfillment?.pickup ?? true,
        delivery: store.fulfillment?.delivery ?? false,
    });

    const saveStep = async (step: number) => {
        if (!store) return;

        // Step 0: Check plan limit before creating a store
        if (step === 0 && !canCreateStore(userStoreCount, userPlan)) {
            setPlanBlocked(true);
            return;
        }

        setSaving(true);
        try {
            const storeRef = doc(db, "stores", store.id);
            switch (step) {
                case 0:
                    await updateDoc(storeRef, {
                        name: identity.name,
                        description: identity.description,
                        currency: identity.currency,
                        onboardingStatus: 1,
                    });
                    break;
                case 1:
                    await updateDoc(storeRef, {
                        contactEmail: contact.contactEmail,
                        phoneNumber: contact.phoneNumber,
                        socialLinks: {
                            instagram: contact.instagram,
                            facebook: contact.facebook,
                            whatsapp: contact.whatsapp,
                        },
                        onboardingStatus: 2,
                    });
                    break;
                case 2:
                    if (location.address.trim()) {
                        await addDoc(collection(db, "locations"), {
                            storeId: store.id,
                            name: location.name,
                            address: location.address,
                            hours: location.hours,
                            isActive: true,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        });
                    }
                    await updateDoc(storeRef, { onboardingStatus: 3 });
                    break;
                case 3:
                    await updateDoc(storeRef, {
                        fulfillment: { pickup: ops.pickup, delivery: ops.delivery },
                        onboardingStatus: 4,
                    });
                    break;
                case 4:
                    await updateDoc(storeRef, { onboardingStatus: "completed" });
                    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
                    toast.success("¡Tienda configurada exitosamente! 🚀");
                    setTimeout(() => { window.location.href = "/tenant"; }, 2500);
                    return;
            }
            setCurrentStep(step + 1);
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar. Intenta nuevamente.");
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Comercial *</Label>
                            <Input id="name" value={identity.name} onChange={e => setIdentity(p => ({ ...p, name: e.target.value }))} placeholder="Mi Tienda Inc." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Descripción Corta</Label>
                            <Textarea id="desc" value={identity.description} onChange={e => setIdentity(p => ({ ...p, description: e.target.value }))} placeholder="Somos líderes en..." className="resize-none min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda (ISO) *</Label>
                            <select
                                id="currency"
                                value={identity.currency}
                                onChange={e => setIdentity(p => ({ ...p, currency: e.target.value }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="CLP">CLP — Peso Chileno</option>
                                <option value="USD">USD — Dólar Americano</option>
                                <option value="ARS">ARS — Peso Argentino</option>
                                <option value="EUR">EUR — Euro</option>
                            </select>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email"><Mail className="inline h-3.5 w-3.5 mr-1" />Email de Contacto</Label>
                                <Input id="email" type="email" value={contact.contactEmail} onChange={e => setContact(p => ({ ...p, contactEmail: e.target.value }))} placeholder="contacto@tienda.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone"><Phone className="inline h-3.5 w-3.5 mr-1" />Teléfono</Label>
                                <Input id="phone" value={contact.phoneNumber} onChange={e => setContact(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+56 9 1234 5678" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Instagram</Label>
                                <Input value={contact.instagram} onChange={e => setContact(p => ({ ...p, instagram: e.target.value }))} placeholder="@tienda" />
                            </div>
                            <div className="space-y-2">
                                <Label>Facebook</Label>
                                <Input value={contact.facebook} onChange={e => setContact(p => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/tienda" />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input value={contact.whatsapp} onChange={e => setContact(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+56 9 1234 5678" />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-sm text-muted-foreground">Agrega tu sucursal o bodega principal. Puedes agregar más en Configuración → Sucursales.</p>
                        <div className="space-y-2">
                            <Label htmlFor="locname">Nombre de la Sucursal *</Label>
                            <Input id="locname" value={location.name} onChange={e => setLocation(p => ({ ...p, name: e.target.value }))} placeholder="Casa Matriz" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección *</Label>
                            <Input id="address" value={location.address} onChange={e => setLocation(p => ({ ...p, address: e.target.value }))} placeholder="Av. Principal 123, Santiago" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hours">Horario de Atención</Label>
                            <Input id="hours" value={location.hours} onChange={e => setLocation(p => ({ ...p, hours: e.target.value }))} placeholder="Lun-Vie 09:00 - 18:00" />
                        </div>
                        <p className="text-xs text-muted-foreground">Puedes omitir este paso si aún no tienes una dirección.</p>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-sm text-muted-foreground">¿Cómo entregas tus productos a los clientes?</p>
                        {[
                            { key: "pickup", icon: "🏪", label: "Retiro en Tienda", desc: "Los clientes buscan sus pedidos en tu sucursal." },
                            { key: "delivery", icon: "🚚", label: "Despacho a Domicilio", desc: "Envías los pedidos a la dirección del cliente." },
                        ].map(opt => (
                            <Card key={opt.key} className={`p-4 flex items-center justify-between cursor-pointer border-2 transition-all ${ops[opt.key as keyof typeof ops] ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                                onClick={() => setOps(p => ({ ...p, [opt.key]: !p[opt.key as keyof typeof ops] }))}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{opt.icon}</span>
                                    <div>
                                        <p className="font-medium text-sm">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                    </div>
                                </div>
                                <Switch checked={ops[opt.key as keyof typeof ops]} onCheckedChange={val => setOps(p => ({ ...p, [opt.key]: val }))} onClick={e => e.stopPropagation()} />
                            </Card>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2">
                            Para configurar transportistas (Blue Express, Starken, etc.) ve al módulo de <strong>Envíos</strong> una vez completada la configuración inicial.
                        </p>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center justify-center space-y-6 py-8 animate-in fade-in duration-500">
                        <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <Rocket className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold">¡Tu tienda está lista!</h3>
                            <p className="text-muted-foreground max-w-md">Has completado la configuración inicial. Ahora puedes agregar productos, personalizar el diseño y empezar a vender.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
                            <Button onClick={() => saveStep(4)} className="w-full" disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Ir al Dashboard
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => { router.push("/tenant/products/new"); }}>
                                Agregar Productos
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Plan limit gate */}
            {planBlocked && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
                    <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl space-y-5 text-center">
                        <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Límite de tiendas alcanzado</h3>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {planLimitMessage(userPlan)}
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                Actualiza tu plan para crear más tiendas.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setPlanBlocked(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={() => router.push("/tenant/billing")}>Ver Planes →</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="hidden md:flex w-72 flex-col border-r bg-muted/10 p-8">
                <div className="mb-8">
                    <h1 className="text-xl font-bold">Configura tu Tienda</h1>
                    <p className="text-sm text-muted-foreground mt-1">Completa los pasos para comenzar a vender.</p>
                </div>
                <nav className="space-y-1">
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const done = currentStep > step.id;
                        const active = currentStep === step.id;
                        return (
                            <div key={step.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-primary/10 text-primary font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold transition-all ${active ? "border-primary bg-primary text-white" : done ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/30"}`}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : step.id + 1}
                                </div>
                                <span>{step.label}</span>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile progress */}
                <div className="md:hidden p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Paso {currentStep + 1} de {STEPS.length}</span>
                        <span className="text-xs text-muted-foreground">{STEPS[currentStep]?.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12">
                    <div className="max-w-xl mx-auto pb-24">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold tracking-tight">{STEPS[currentStep]?.label}</h2>
                        </div>
                        {renderStep()}
                    </div>
                </div>

                {/* Footer nav */}
                {currentStep < 4 && (
                    <div className="border-t bg-background/95 backdrop-blur p-4 flex justify-between items-center max-w-xl mx-auto w-full px-6">
                        <Button variant="ghost" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0 || saving}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                        </Button>
                        <Button onClick={() => saveStep(currentStep)} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {currentStep === 3 ? "Finalizar" : "Siguiente"}
                            {currentStep < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
                            {currentStep === 3 && <Check className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
