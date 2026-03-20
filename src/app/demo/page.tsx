"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    LayoutTemplate, 
    BarChart3, 
    ShoppingBag, 
    Users, 
    CreditCard, 
    Globe, 
    TrendingUp, 
    TrendingDown, 
    Zap, 
    ShieldCheck, 
    Cpu, 
    ArrowRight,
    Search,
    Bell,
    CheckCircle2,
    Activity,
    LogOut,
    ExternalLink,
    Puzzle,
    PlusCircle,
    Loader2,
    Package,
    Settings,
    Shield,
    Sparkles,
    MousePointer2,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- Types & Constants ---

type ModuleId = "dashboard" | "orders" | "products" | "customers" | "payments" | "analytics" | "domains" | "integrations" | "create-store";

interface NavItem {
    id: ModuleId;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard Real-time", icon: LayoutTemplate },
    { id: "orders", label: "Ventas Directas", icon: ShoppingBag },
    { id: "products", label: "Catálogo Pro", icon: Package },
    { id: "customers", label: "Tus Clientes", icon: Users },
    { id: "payments", label: "Pasarela Segura", icon: CreditCard },
    { id: "analytics", label: "Inteligencia de Datos", icon: BarChart3 },
    { id: "domains", label: "Tu Marca Local", icon: Globe },
    { id: "integrations", label: "Conecta tus Ventas", icon: Puzzle },
    { id: "create-store", label: "Lanzar Nueva Tienda", icon: PlusCircle },
];

// --- Shared UI Components ---

const DashboardCard = ({ children, className = "", delay = 0, id = "" }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) => (
    <motion.div
        id={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.01 }}
        className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

const ModuleHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-1 uppercase tracking-tighter">{title}</h2>
            <p className="text-zinc-500 text-sm font-medium">{subtitle}</p>
        </div>
        {action}
    </div>
);

// --- Tooltip Component ---

const OnboardingTooltip = ({ text, step, currentStep, onNext, onSkip }: { text: string; step: number; currentStep: number; onNext: () => void; onSkip: () => void }) => {
    if (step !== currentStep) return null;
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute z-[60] bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 p-4 bg-violet-600 rounded-2xl shadow-2xl text-white pointer-events-auto"
        >
            <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-white animate-pulse" />
                <div className="space-y-2">
                    <p className="text-xs font-bold leading-relaxed">{text}</p>
                    <div className="flex items-center justify-between pt-1">
                        <button onClick={onSkip} className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity">Saltar guía</button>
                        <Button onClick={onNext} size="sm" className="h-7 px-3 bg-white text-violet-600 hover:bg-zinc-100 rounded-lg text-[10px] font-black uppercase">
                            Entendido
                        </Button>
                    </div>
                </div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-violet-600" />
        </motion.div>
    );
};

// --- Modules Implementation ---

const DashboardMock = () => {
    // KPI Data with business focus
    const kpis = [
        { label: "Crecimiento Hoy", value: "$4.8M", trend: "+12.4%", up: true },
        { label: "Nuevos Pedidos", value: "1,284", trend: "+5.1%", up: true },
        { label: "Retorno (ROI)", value: "3.4%", trend: "+0.2%", up: true },
        { label: "Ticket de Venta", value: "$3,740", trend: "+2.8%", up: true },
    ];

    return (
        <div className="space-y-10">
            <ModuleHeader 
                title="Centro de Operaciones" 
                subtitle="Monitorea el escalamiento de tu negocio en tiempo real." 
            />
            
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <DashboardCard key={i} className="group overflow-hidden relative" delay={i * 0.1}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-[40px] rounded-full group-hover:bg-violet-600/10 transition-colors" />
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">{kpi.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-2xl font-bold text-white tracking-tighter">{kpi.value}</h3>
                            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}>
                                {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {kpi.trend}
                            </div>
                        </div>
                    </DashboardCard>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardCard className="lg:col-span-2 space-y-6" delay={0.4}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Crecimiento de Ventas (7D)</h3>
                        <BarChart3 className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="w-full h-48 flex items-end gap-1 px-2 pt-4">
                        {[40, 65, 45, 90, 75, 85, 60].map((height, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                className="flex-1 bg-gradient-to-t from-violet-600/50 to-violet-400/80 rounded-t-md relative group"
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-20">
                                    Ventas: ${(height * 1000).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </DashboardCard>

                <DashboardCard className="space-y-6" delay={0.5}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Alertas de Venta</h3>
                        <Activity className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="space-y-6">
                        {[
                            { id: 1, text: "Pago 100% Protegido (HMAC Secure)", icon: ShieldCheck, color: "text-emerald-400" },
                            { id: 2, text: "Nuevo cliente registrado en Tienda", icon: Users, color: "text-blue-400" },
                            { id: 3, text: "Venta Mayorista completada", icon: ShoppingBag, color: "text-emerald-400" },
                        ].map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <item.icon className={`h-5 w-4 ${item.color} flex-shrink-0 mt-0.5`} />
                                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <Link href="/register" className="block">
                        <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-violet-400 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl">
                            Escalar infraestructura
                        </Button>
                    </Link>
                </DashboardCard>
            </div>
        </div>
    );
};

const IntegrationsMock = ({ step, onNext, onSkip }: { step?: number; onNext?: () => void; onSkip?: () => void }) => {
    const [connecting, setConnecting] = useState<string | null>(null);
    const [connected, setConnected] = useState<string[]>(["shopify"]);

    const handleConnect = (id: string) => {
        setConnecting(id);
        setTimeout(() => {
            setConnected(prev => [...prev, id]);
            setConnecting(null);
            if (id === "mercadolibre" && step === 0 && onNext) onNext();
        }, 1200);
    };

    const integrations = [
        { id: "shopify", name: "Shopify Store", desc: "Ventas centralizadas automáticamente.", icon: "https://cdn.worldvectorlogo.com/logos/shopify.svg" },
        { id: "mercadolibre", name: "MercadoLibre", desc: "Sincroniza stock en tiempo real.", icon: "https://cdn.worldvectorlogo.com/logos/mercadolibre-1.svg" },
        { id: "woocommerce", name: "WooCommerce", desc: "Para tu tienda WordPress nativa.", icon: "https://cdn.worldvectorlogo.com/logos/woocommerce.svg" },
        { id: "vtex", name: "VTEX Cloud", desc: "Infraestructura Enterprise unificada.", icon: "https://cdn.worldvectorlogo.com/logos/vtex.svg" },
    ];

    return (
        <div className="space-y-8 relative">
            <OnboardingTooltip 
                text="Conecta tus canales de venta (Shopify, ML) para unificar tus operaciones en segundos." 
                step={0} 
                currentStep={step || -1} 
                onNext={onNext || (() => {})} 
                onSkip={onSkip || (() => {})} 
            />
            <ModuleHeader 
                title="Unifica tus Canales" 
                subtitle="Vende en todas partes, gestiona en un solo lugar." 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((app, i) => {
                    const isConnected = connected.includes(app.id);
                    const isConnecting = connecting === app.id;
                    return (
                        <DashboardCard key={app.id} delay={i * 0.1} className={`flex flex-col h-full bg-zinc-900/40 relative ${step === 0 && app.id === "mercadolibre" ? "ring-2 ring-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]" : ""}`}>
                            <div className="flex items-start justify-between mb-6">
                                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center p-2.5">
                                    <img src={app.icon} alt={app.name} className="h-full w-full object-contain" />
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                                    {isConnected ? "Sincronizado" : "Disponible"}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                            <p className="text-sm text-zinc-500 mb-8 flex-1 leading-relaxed">{app.desc}</p>
                            <Button
                                onClick={() => !isConnected && handleConnect(app.id)}
                                disabled={isConnecting}
                                className={`w-full h-12 rounded-xl font-bold transition-all ${
                                    isConnected 
                                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" 
                                    : "bg-white text-black hover:bg-zinc-200"
                                }`}
                            >
                                {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected ? "Gestionar Venta" : "Conectar Canal"}
                            </Button>
                        </DashboardCard>
                    );
                })}
            </div>
        </div>
    );
};

const StoreCreationMock = ({ step, onNext, onSkip }: { step?: number; onNext?: () => void; onSkip?: () => void }) => {
    const [subStep, setSubStep] = useState<"form" | "loading" | "success">("form");
    const [loadingMsg, setLoadingMsg] = useState("Configurando infraestructura...");
    const [subdomain, setSubdomain] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubStep("loading");
        
        // Sequential loading flow
        setTimeout(() => setLoadingMsg("Asignando nombre de marca..."), 800);
        setTimeout(() => setLoadingMsg("Instalando seguridad HMAC..."), 1600);
        setTimeout(() => setSubStep("success"), 2500);
    };

    return (
        <div className="max-w-2xl mx-auto py-12 relative">
            <OnboardingTooltip 
                text="Crea tu instancia operativa. Tendrás un dominio listo para vender en segundos." 
                step={1} 
                currentStep={step || -1} 
                onNext={onNext || (() => {})} 
                onSkip={onSkip || (() => {})} 
            />
            <AnimatePresence mode="wait">
                {subStep === "form" && (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold text-white tracking-tighter uppercase">Lanza tu Tienda</h2>
                            <p className="text-zinc-500 font-medium">Infraestructura comercial de clase mundial a un clic.</p>
                        </div>
                        <DashboardCard className={`p-8 bg-zinc-900/40 ${step === 1 ? "ring-2 ring-violet-500 shadow-2xl" : ""}`}>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] pl-1">Nombre Comercial</label>
                                    <input required placeholder="Ej: Boutique Luxury Santiago" className="w-full h-14 bg-zinc-950 border border-white/5 rounded-2xl px-5 text-white focus:border-violet-500 outline-none transition-all placeholder:text-zinc-700 font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] pl-1">ID Único (Dominio)</label>
                                    <div className="relative">
                                        <input required value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="mi-marca" className="w-full h-14 bg-zinc-950 border border-white/5 rounded-2xl pl-5 pr-32 text-white focus:border-violet-500 outline-none transition-all font-medium" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm">.udf.io</span>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-16 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xl shadow-2xl shadow-violet-600/20 uppercase tracking-tighter">
                                    Comenzar a Vender Ahora
                                </Button>
                            </form>
                        </DashboardCard>
                    </motion.div>
                )}

                {subStep === "loading" && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center space-y-8 py-20 text-center">
                        <div className="relative">
                            <Loader2 className="h-20 w-20 text-violet-500 animate-spin" />
                            <div className="absolute inset-0 blur-2xl bg-violet-500/20 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">{loadingMsg}</h3>
                            <p className="text-zinc-500 font-medium italic">Preparando tu entorno UnderDesk Flow...</p>
                        </div>
                    </motion.div>
                )}

                {subStep === "success" && (
                    <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center space-y-8 text-center py-10">
                        <div className="h-24 w-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-bold text-white uppercase tracking-tighter">🚀 ¡Tu Tienda está ONLINE!</h3>
                            <p className="text-zinc-500 text-lg font-medium">Dominio activado y seguridad verificada.</p>
                        </div>
                        <DashboardCard className="w-full max-w-sm p-5 bg-zinc-900 border-white/10 flex items-center justify-between border-2 border-emerald-500/20">
                            <span className="text-sm font-black text-violet-400">{subdomain}.udf.io</span>
                            <Link href="/register"><Button size="sm" className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase text-[10px]">Lanzar Real</Button></Link>
                        </DashboardCard>
                        <Button onClick={() => setSubStep("form")} variant="link" className="text-zinc-600 font-black hover:text-zinc-400 uppercase tracking-widest text-[10px]">Crear otra instancia demo</Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DomainsMock = () => (
    <div className="space-y-8">
        <ModuleHeader 
            title="Soberanía de Marca" 
            subtitle="Tus clientes confían en tu nombre, nosotros lo hacemos brillar." 
        />
        <div className="space-y-4">
            {[
                { domain: "boutique-luxury.cl", type: "Personalizado", status: "VENDIENDO", secure: true },
                { domain: "tienda-demo.udf.io", type: "Infraestructura Cloud", status: "ACTivo", secure: true },
            ].map((d, i) => (
                <DashboardCard key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-zinc-900/40" delay={i * 0.1}>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-zinc-400"><Globe className="h-6 w-6" /></div>
                        <div>
                            <p className="text-md font-bold text-white tracking-tight">{d.domain}</p>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{d.type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 mt-4 sm:mt-0">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Listo para vender</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{d.status}</div>
                    </div>
                </DashboardCard>
            ))}
        </div>
    </div>
);

// --- Main Page Component ---

export default function DemoPage() {
    const [activeModule, setActiveModule] = useState<ModuleId>("integrations");
    const [demoStep, setDemoStep] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<string[]>([]);

    // Simulated Live Activity
    useEffect(() => {
        const interval = setInterval(() => {
            const msgs = ["Nueva orden procesada", "Pago confirmado via HMAC", "Stock actualizado"];
            const msg = `${msgs[Math.floor(Math.random() * msgs.length)]} • Recién ahora`;
            setNotifications(prev => [msg, ...prev].slice(0, 1));
            
            setTimeout(() => setNotifications([]), 3000);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const nextStep = () => {
        const flow = ["integrations", "create-store", "dashboard"];
        const nextIdx = demoStep + 1;
        if (nextIdx < flow.length) {
            setDemoStep(nextIdx);
            setActiveModule(flow[nextIdx] as ModuleId);
        } else {
            setDemoStep(-1); // Finish tour
        }
    };

    const renderModule = () => {
        switch (activeModule) {
            case "dashboard": return <DashboardMock />;
            case "integrations": return <IntegrationsMock step={demoStep} onNext={nextStep} onSkip={() => setDemoStep(-1)} />;
            case "create-store": return <StoreCreationMock step={demoStep} onNext={nextStep} onSkip={() => setDemoStep(-1)} />;
            case "domains": return <DomainsMock />;
            default: return <div className="flex items-center justify-center py-20 text-zinc-700 font-black uppercase tracking-[1em] text-lg animate-pulse">Cargando Módulo de Venta</div>;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-violet-500/30 overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed top-[-10%] left-[-5%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Persistent CTA Floating */}
            <div className="fixed bottom-10 right-10 z-[70] hidden sm:block">
                <Link href="/register">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex flex-col items-end"
                    >
                        <div className="bg-violet-600 text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(139,92,246,0.5)] flex items-center gap-4 font-black uppercase tracking-tighter text-lg transition-all border-b-4 border-violet-800 active:border-b-0 active:translate-y-1">
                            Crear mi tienda 
                            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                        </div>
                        <span className="mt-3 text-[10px] font-black text-violet-400 uppercase tracking-widest bg-zinc-950/80 backdrop-blur px-3 py-1.5 rounded-full border border-violet-500/20">Acelera tus ventas hoy</span>
                    </motion.div>
                </Link>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 h-screen z-50 flex flex-col w-72 border-r border-white/5 bg-zinc-950/80 backdrop-blur-3xl transition-transform duration-300
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="p-10 flex items-center gap-4">
                    <div className="bg-violet-600 p-2.5 rounded-2xl shadow-xl shadow-violet-600/30">
                        <LayoutTemplate className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tighter uppercase italic">UnderDesk</span>
                        <span className="text-[10px] uppercase font-black text-violet-400 tracking-[0.2em] -mt-1">Control HQ</span>
                    </div>
                </div>

                <nav className="flex-1 px-5 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            onClick={() => {
                                setActiveModule(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-tight transition-all group relative overflow-hidden ${
                                activeModule === item.id 
                                ? "bg-white/10 text-white shadow-xl" 
                                : "text-zinc-600 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                        >
                            <item.icon className={`h-4.5 w-4.5 ${activeModule === item.id ? "text-violet-400" : "group-hover:text-zinc-300"}`} />
                            {item.label}
                            {activeModule === item.id && <motion.div layoutId="side-nav-glow" className="absolute right-0 w-1 h-6 bg-violet-500 rounded-full" />}
                        </button>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5">
                    <Link href="/register" className="block p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors group">
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Instancia Premium</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Prueba Real</span>
                            <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-h-screen relative">
                {/* Notification Area */}
                <AnimatePresence>
                    {notifications.map((note, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-zinc-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3"
                        >
                            <Sparkles className="h-4 w-4" />
                            {note}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Header */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <div className="px-4 py-1.5 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-spin-slow" />
                            Modo Demo Interactivo
                        </div>
                        <div className="hidden xl:flex items-center gap-3 text-zinc-700 font-black text-[10px] uppercase tracking-widest">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            Entorno de Venta Protegido
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="h-11 px-6 rounded-2xl text-zinc-500 font-bold hover:text-white">Ver Precios</Button>
                        <Link href="/register">
                            <Button className="h-12 px-8 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-tight shadow-xl">
                                Crear Tienda Ahora
                            </Button>
                        </Link>
                    </div>
                    
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white"><LayoutTemplate className="h-6 w-6" /></button>
                </header>

                {/* Router Content */}
                <div className="p-8 lg:p-16 max-w-7xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeModule} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                            {renderModule()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom Sales Footer */}
                <section className="mt-auto px-10 py-20 border-t border-white/5 bg-gradient-to-t from-violet-600/5 to-transparent text-center space-y-8">
                    <div className="max-w-xl mx-auto space-y-3">
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">¿Listo para lanzar tu propia tienda?</h2>
                        <p className="text-zinc-500 text-xl font-medium italic">Configura tu imperio digital en menos de 5 minutos.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-16 px-12 rounded-3xl bg-violet-600 hover:bg-violet-500 text-white text-xl font-black uppercase shadow-2xl shadow-violet-600/40">
                                Crear mi tienda gratis
                            </Button>
                        </Link>
                        <Button variant="outline" className="w-full sm:w-auto h-16 px-12 rounded-3xl border-white/10 hover:bg-white/5 text-lg font-bold">Ver planes pro</Button>
                    </div>
                </section>

                <footer className="p-8 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] bg-zinc-950">
                    <span>© 2026 UnderDeskFlow OS</span>
                    <div className="flex gap-6">
                        <span>Latency: 8ms</span>
                        <span>Security: Active</span>
                        <span>Region: Santiago-CL</span>
                    </div>
                </footer>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
}
