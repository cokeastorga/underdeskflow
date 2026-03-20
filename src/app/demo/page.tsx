"use client";

import React, { useState } from "react";
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
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Mock Data ---

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutTemplate },
    { id: "orders", label: "Órdenes", icon: ShoppingBag },
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "payments", label: "Pagos", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "domains", label: "Dominios", icon: Globe },
];

const kpiData = [
    { label: "GMV Hoy", value: "$4,821,200", trend: "+12.4%", up: true },
    { label: "Órdenes", value: "1,284", trend: "+5.1%", up: true },
    { label: "Conversión", value: "3.4%", trend: "-0.2%", up: false },
    { label: "Ticket Promedio", value: "$3,740", trend: "+2.8%", up: true },
];

const activityFeed = [
    { id: 1, text: "Pago procesado (Webhook verificado HMAC)", time: "2 min ago", icon: ShieldCheck, color: "text-emerald-400" },
    { id: 2, text: "Nuevo dominio conectado: tienda.miempresa.cl", time: "15 min ago", icon: Globe, color: "text-blue-400" },
    { id: 3, text: "Orden #8429 completada exitosamente", time: "1h ago", icon: CheckCircle2, color: "text-emerald-400" },
    { id: 4, text: "Edge Proxy: Tráfico desviado a región Virginia-US", time: "3h ago", icon: Zap, color: "text-amber-400" },
];

const infraStatus = [
    { label: "Edge Proxy", status: "Active", icon: Zap, color: "bg-emerald-500/10 text-emerald-500" },
    { label: "DNS Nodes", status: "Verified", icon: Globe, color: "bg-blue-500/10 text-blue-500" },
    { label: "HMAC Vault", status: "Secure", icon: ShieldCheck, color: "bg-violet-500/10 text-violet-500" },
];

// --- Subcomponents ---

const DashboardCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        whileHover={{ scale: 1.01 }}
        className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

const ChartMock = () => (
    <div className="w-full h-48 flex items-end gap-1 px-2 pt-4">
        {[40, 65, 45, 90, 75, 85, 60].map((height, i) => (
            <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className="flex-1 bg-gradient-to-t from-violet-600/50 to-violet-400/80 rounded-t-md relative group"
            >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-20">
                    Day {i + 1}: ${(height * 1000).toLocaleString()}
                </div>
            </motion.div>
        ))}
    </div>
);

// --- Main Page ---

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-violet-500/30">
            {/* Background Orbs */}
            <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Floating Tooltip */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium text-zinc-400"
                >
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Estás viendo un entorno de demostración
                </motion.div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-zinc-950/50 backdrop-blur-3xl sticky top-0 h-screen z-40">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-violet-600 p-2 rounded-xl">
                        <LayoutTemplate className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">UDF <span className="text-violet-400">Flow</span></span>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                                activeTab === item.id 
                                ? "bg-white/10 text-white shadow-lg" 
                                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                        >
                            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-violet-400" : "group-hover:text-zinc-300"}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <button className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                        <LogOut className="h-5 w-5" />
                        Salir del Demo
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold lg:hidden">UDF Demo</span>
                        <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold text-amber-500 animate-pulse">
                            Demo Mode
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-zinc-400">
                            <Search className="h-3.5 w-3.5" />
                            <span>Quick Search CMD+K</span>
                        </div>
                        <Button className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/20">
                            Crear mi tienda
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {/* Dashboard Scrollable Area */}
                <div className="p-6 lg:p-10 space-y-10">
                    {/* Hero Welcome */}
                    <motion.section 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Jorge</h1>
                        <p className="text-zinc-500 text-sm">Resumen operativo de tu instancia en tiempo real.</p>
                    </motion.section>

                    {/* KPI Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {kpiData.map((kpi, i) => (
                            <DashboardCard key={i} className="group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-[40px] rounded-full group-hover:bg-violet-600/10 transition-colors" />
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">{kpi.label}</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-2xl font-bold">{kpi.value}</h3>
                                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${kpi.up ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}>
                                        {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {kpi.trend}
                                    </div>
                                </div>
                            </DashboardCard>
                        ))}
                    </section>

                    {/* Charts & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart Area */}
                        <DashboardCard className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Revenue últimos 7 días</h3>
                                    <p className="text-zinc-500 text-xs mt-1">Comparado con el periodo anterior</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                        Ventas
                                    </div>
                                    <BarChart3 className="h-5 w-5 text-zinc-500" />
                                </div>
                            </div>
                            <ChartMock />
                            <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2">
                                <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
                            </div>
                        </DashboardCard>

                        {/* Activity Feed */}
                        <DashboardCard className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Actividad Reciente</h3>
                                <Activity className="h-5 w-5 text-zinc-500" />
                            </div>
                            <div className="space-y-6">
                                {activityFeed.map((item) => (
                                    <div key={item.id} className="flex gap-4 relative">
                                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 flex-shrink-0 ${item.color}`}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-zinc-300 leading-snug">{item.text}</p>
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors py-2 flex items-center justify-center gap-2 mt-2 group">
                                Ver todas las logs
                                <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </DashboardCard>
                    </div>

                    {/* Infrastructure Status */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {infraStatus.map((status, i) => (
                            <DashboardCard key={i} className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${status.color}`}>
                                        <status.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{status.label}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{status.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <Cpu className="h-5 w-5 text-zinc-800" />
                            </DashboardCard>
                        ))}
                    </section>

                    {/* Bottom CTA Section */}
                    <motion.section 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="py-16 text-center space-y-8"
                    >
                        <div className="max-w-xl mx-auto space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">¿Listo para tener tu propia instancia?</h2>
                            <p className="text-zinc-500 text-lg">Únete a cientos de empresas que ya operan su comercio con UnderDeskFlow.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-lg font-bold shadow-2xl shadow-violet-600/30 transition-all hover:scale-105 active:scale-95">
                                Crear mi tienda gratis
                            </Button>
                            <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-white/10 hover:bg-white/5 text-lg font-bold backdrop-blur-md">
                                Ver precios
                            </Button>
                        </div>
                    </motion.section>
                </div>

                {/* Footer Style Disclaimer */}
                <footer className="mt-auto p-6 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                    <span>UnderDeskFlow Production Environment</span>
                    <span>No Auth Demo v1.0</span>
                </footer>
            </main>
        </div>
    );
}
