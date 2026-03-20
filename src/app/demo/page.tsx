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
    X,
    Filter,
    MoreVertical,
    Eye
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
    const kpis = [
        { label: "Crecimiento Hoy", value: "$4.821.200", trend: "+12.4%", up: true },
        { label: "Nuevos Pedidos", value: "1.284", trend: "+5.1%", up: true },
        { label: "Conversión Promedio", value: "3.4%", trend: "+0.2%", up: true },
        { label: "Ticket de Venta", value: "$3.740", trend: "+2.8%", up: true },
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
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-20 font-bold uppercase tracking-wider">
                                    ${(height * 100000).toLocaleString('es-CL')}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest px-2">
                        <span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SA</span><span>DO</span>
                    </div>
                </DashboardCard>

                <DashboardCard className="space-y-6" delay={0.5}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Alertas Proactivas</h3>
                        <Activity className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="space-y-6">
                        {[
                            { id: 1, text: "Pago 100% Protegido (HMAC Secure)", icon: ShieldCheck, color: "text-emerald-400" },
                            { id: 2, text: "Nuevo cliente registrado en Tienda", icon: Users, color: "text-blue-400" },
                            { id: 3, text: "Venta Mayorista completada exitosamente", icon: ShoppingBag, color: "text-emerald-400" },
                            { id: 4, text: "Optimización de Latitud: Edge activado", icon: Zap, color: "text-amber-400" },
                        ].map((item) => (
                            <div key={item.id} className="flex gap-4 items-start">
                                <div className={`mt-1 h-2 w-2 rounded-full ${item.color.replace('text', 'bg')} flex-shrink-0 animate-pulse`} />
                                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <Link href="/register" className="block pt-4">
                        <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-2xl group">
                            Ver historial de logs
                            <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </DashboardCard>
            </div>
        </div>
    );
};

const ProductsMock = () => {
    const products = [
        { id: 1, name: "Polera Oversize Negra", price: "$19.990", stock: 42, status: "Activo", color: "bg-zinc-800" },
        { id: 2, name: "Zapatillas Urban Pro", price: "$59.990", stock: 12, status: "Activo", color: "bg-blue-600/20" },
        { id: 3, name: "Mochila Tech Waterproof", price: "$34.990", stock: 0, status: "Sin stock", color: "bg-violet-600/20" },
        { id: 4, name: "Hoodie Minimal Gray", price: "$29.990", stock: 28, status: "Activo", color: "bg-zinc-700/50" },
        { id: 5, name: "Gorra Snapback Classic", price: "$14.990", stock: 85, status: "Activo", color: "bg-amber-600/20" },
        { id: 6, name: "Joggers Essential Slim", price: "$24.990", stock: 5, status: "Stock bajo", color: "bg-emerald-600/20" },
    ];

    return (
        <div className="space-y-8">
            <ModuleHeader title="Catálogo de Productos" subtitle="Gestiona tu inventario con precisión quirúrgica." action={
                <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2">
                    <PlusCircle className="h-4 w-4" /> Agregar Producto
                </Button>
            } />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p, i) => (
                    <DashboardCard key={p.id} delay={i * 0.05} className="p-0 overflow-hidden flex flex-col bg-zinc-900/40 border-white/5">
                        <div className={`h-40 ${p.color} flex items-center justify-center relative group`}>
                            <Package className="h-12 w-12 text-white/20 group-hover:scale-110 transition-transform" />
                            <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase text-white border border-white/10">
                                {p.status}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{p.name}</h3>
                                <span className="text-sm font-black text-violet-400">{p.price}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-zinc-500">Stock disponible:</span>
                                <span className={p.stock === 0 ? "text-rose-400" : p.stock < 10 ? "text-amber-400" : "text-emerald-400"}>{p.stock} unidades</span>
                            </div>
                            <div className="pt-4 flex gap-2">
                                <Button variant="secondary" className="flex-1 h-10 rounded-xl text-xs font-bold bg-white/5 border border-white/5 hover:bg-white/10 text-white">Editar</Button>
                                <Button variant="secondary" className="w-10 h-10 p-0 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white"><Eye className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </DashboardCard>
                ))}
            </div>
        </div>
    );
};

const OrdersMock = () => {
    const orders = [
        { id: "#1024", customer: "Juan Pérez", status: "Pagado", amount: "$34.990", date: "Hoy, 14:20", color: "text-emerald-400 bg-emerald-400/10" },
        { id: "#1025", customer: "María Soto", status: "Enviado", amount: "$89.990", date: "Hoy, 12:45", color: "text-blue-400 bg-blue-400/10" },
        { id: "#1026", customer: "Diego Ramos", status: "Pendiente", amount: "$12.490", date: "Ayer, 09:12", color: "text-amber-400 bg-amber-400/10" },
        { id: "#1027", customer: "Ana Lucía", status: "Pagado", amount: "$54.000", date: "Ayer, 18:30", color: "text-emerald-400 bg-emerald-400/10" },
        { id: "#1028", customer: "Pedro Rosselot", status: "Reembolsado", amount: "$19.990", date: "20 Mar 2024", color: "text-zinc-400 bg-zinc-400/10" },
    ];

    return (
        <div className="space-y-8">
            <ModuleHeader title="Órdenes de Venta" subtitle="Seguimiento en tiempo real de cada transacción." action={
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-white/10 text-zinc-400 hover:text-white gap-2"><Filter className="h-4 w-4" /> Filtrar</Button>
                    <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold">Exportar CSV</Button>
                </div>
            } />
            <DashboardCard className="p-0 overflow-hidden bg-zinc-900/40 border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Orden</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cliente</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Monto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o, i) => (
                                <tr key={i} className="group border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 text-xs font-black text-white">{o.id}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-zinc-300">{o.customer}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${o.color}`}>{o.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-white text-right">{o.amount}</td>
                                    <td className="px-6 py-4 text-[10px] font-medium text-zinc-500">{o.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DashboardCard>
        </div>
    );
};

const CustomersMock = () => {
    const customers = [
        { name: "Juan Pérez", email: "juan@example.com", total: "$420.000", orders: 12, city: "Santiago" },
        { name: "María Soto", email: "maria.s@gmail.com", total: "$89.990", orders: 1, city: "Concepción" },
        { name: "Diego Ramos", email: "dramos@outlook.com", total: "$124.500", orders: 4, city: "Viña del mar" },
        { name: "Ana Lucía", email: "alucia@empresa.cl", total: "$1.200.000", orders: 32, city: "Antofagasta" },
    ];

    return (
        <div className="space-y-8">
            <ModuleHeader title="Comunidad de Clientes" subtitle="Entiende el valor de vida (LTV) de tus compradores." />
            <div className="grid grid-cols-1 gap-4">
                {customers.map((c, i) => (
                    <DashboardCard key={i} delay={i * 0.1} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-zinc-900/40 border-white/5 hover:border-violet-500/30">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10 uppercase font-black text-violet-400">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-white tracking-tight">{c.name}</h3>
                                <p className="text-xs text-zinc-500">{c.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10 mt-6 sm:mt-0">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Total Gastado</span>
                                <span className="text-sm font-black text-emerald-400">{c.total}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Órdenes</span>
                                <span className="text-sm font-black text-white">{c.orders}</span>
                            </div>
                            <Button variant="ghost" className="h-10 w-10 p-0 text-zinc-700 hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                    </DashboardCard>
                ))}
            </div>
        </div>
    );
};

const PaymentsMock = () => (
    <div className="space-y-8 text-white">
        <ModuleHeader title="Pasarela de Pagos" subtitle="Logs de transacciones y estados de salud bancaria." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard delay={0}>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Total Procesado</p>
                <h3 className="text-3xl font-black tracking-tighter text-emerald-400">$124.890.300</h3>
                <p className="text-[10px] text-zinc-600 mt-2">Sincronizado vía Transbank</p>
            </DashboardCard>
            <DashboardCard delay={0.1}>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Transacciones</p>
                <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-black tracking-tighter text-white">4.829</h3>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-emerald-400">98% Éxito</span>
                        <span className="text-[10px] font-bold text-rose-400">2% Rechazo</span>
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard delay={0.2} className="bg-violet-600/10 border-violet-500/20">
                <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-2">Costo por Recaudación</p>
                <h3 className="text-3xl font-black tracking-tighter text-white">2.8% + IVA</h3>
                <p className="text-[10px] text-zinc-600 mt-2">Tarifa Enterprise asignada</p>
            </DashboardCard>
        </div>

        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 pl-2">Logs de Redirección</h3>
            {[
                { type: "Pago aprobado", method: "Webpay Plus", amount: "$34.990", time: "Hace 2 min" },
                { type: "Pago aprobado", method: "Mercado Pago", amount: "$15.000", time: "Hace 15 min" },
                { type: "Pago RECHAZADO", method: "Webpay Plus", amount: "$240.000", time: "Hace 21 min", error: "Fondos insuficientes" },
                { type: "Pago aprobado", method: "PayPal Latam", amount: "$3.400", time: "Hace 45 min" },
            ].map((p, i) => (
                <DashboardCard key={i} className="flex items-center justify-between p-4 bg-zinc-900/40 border-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.error ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {p.error ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${p.error ? "text-rose-400" : "text-white"}`}>{p.type}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase">{p.method} • {p.time}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-black">{p.amount}</span>
                        {p.error && <span className="text-[8px] text-rose-500 uppercase font-black">{p.error}</span>}
                    </div>
                </DashboardCard>
            ))}
        </div>
    </div>
);

const AnalyticsMock = () => (
    <div className="space-y-10">
        <ModuleHeader title="Inteligencia de Datos" subtitle="Pulsaciones operativas de tu ecosistema comercial." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DashboardCard className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Revenue Estimado (30D)</p>
                        <h4 className="text-3xl font-black text-white">$242.000.000</h4>
                    </div>
                    <div className="h-10 px-3 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center gap-1 text-[10px] font-black uppercase">
                        <TrendingUp className="h-3 w-3" /> +15.5%
                    </div>
                </div>
                <div className="h-40 w-full flex items-center justify-center text-zinc-800 uppercase font-black text-xs tracking-[1em]">
                    [ Chart Integration Pulse ]
                    <div className="absolute inset-x-6 h-32 flex items-end gap-1 opacity-20">
                        {Array.from({length: 30}).map((_, i) => (
                            <div key={i} className="flex-1 bg-violet-500 rounded-t" style={{ height: `${20 + Math.random() * 80}%` }} />
                        ))}
                    </div>
                </div>
            </DashboardCard>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Abandono de Carrito", value: "24%", trend: "-5%", up: true, color: "text-amber-400" },
                    { label: "Ticket Promedio", value: "$34.400", trend: "+2%", up: true, color: "text-emerald-400" },
                    { label: "Nuevos Clientes", value: "842", trend: "+12%", up: true, color: "text-blue-400" },
                    { label: "Satisfacción (CSAT)", value: "4.9/5", trend: "+0.1", up: true, color: "text-indigo-400" },
                ].map((m, i) => (
                    <DashboardCard key={i} className="flex flex-col justify-center text-center">
                        <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1">{m.label}</p>
                        <h4 className={`text-2xl font-black tracking-tighter ${m.color}`}>{m.value}</h4>
                        <span className="text-[9px] font-bold text-zinc-700 mt-2 uppercase tracking-widest">{m.trend} este mes</span>
                    </DashboardCard>
                ))}
            </div>
        </div>
    </div>
);

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
            setDemoStep(-1);
        }
    };

    const renderModule = () => {
        switch (activeModule) {
            case "dashboard": return <DashboardMock />;
            case "products": return <ProductsMock />;
            case "orders": return <OrdersMock />;
            case "customers": return <CustomersMock />;
            case "payments": return <PaymentsMock />;
            case "analytics": return <AnalyticsMock />;
            case "integrations": return <IntegrationsMock step={demoStep} onNext={nextStep} onSkip={() => setDemoStep(-1)} />;
            case "create-store": return <StoreCreationMock step={demoStep} onNext={nextStep} onSkip={() => setDemoStep(-1)} />;
            case "domains": return <DomainsMock />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-violet-500/30 overflow-x-hidden">
            <div className="fixed top-[-10%] left-[-5%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="fixed bottom-10 right-10 z-[70] hidden sm:block">
                <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-end">
                        <div className="bg-violet-600 text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(139,92,246,0.5)] flex items-center gap-4 font-black uppercase tracking-tighter text-lg transition-all border-b-4 border-violet-800 active:border-b-0 active:translate-y-1">
                            Crear mi tienda <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                        </div>
                        <span className="mt-3 text-[10px] font-black text-violet-400 uppercase tracking-widest bg-zinc-950/80 backdrop-blur px-3 py-1.5 rounded-full border border-violet-500/20">Acelera tus ventas hoy</span>
                    </motion.div>
                </Link>
            </div>

            <aside className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col w-72 border-r border-white/5 bg-zinc-950/80 backdrop-blur-3xl transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="p-10 flex items-center gap-4">
                    <div className="bg-violet-600 p-2.5 rounded-2xl shadow-xl shadow-violet-600/30"><LayoutTemplate className="h-6 w-6 text-white" /></div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tighter uppercase italic">UnderDesk</span>
                        <span className="text-[10px] uppercase font-black text-violet-400 tracking-[0.2em] -mt-1">Control HQ</span>
                    </div>
                </div>
                <nav className="flex-1 px-5 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-tight transition-all group relative overflow-hidden ${activeModule === item.id ? "bg-white/10 text-white shadow-xl" : "text-zinc-600 hover:text-zinc-200 hover:bg-white/5"}`}>
                            <item.icon className={`h-4.5 w-4.5 ${activeModule === item.id ? "text-violet-400" : "group-hover:text-zinc-300"}`} />
                            {item.label}
                            {activeModule === item.id && <motion.div layoutId="side-nav-glow" className="absolute right-0 w-1 h-6 bg-violet-500 rounded-full" />}
                        </button>
                    ))}
                </nav>
                <div className="p-8 border-t border-white/5">
                    <Link href="/register" className="block p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors group">
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Instancia Premium</p>
                        <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Prueba Real</span><ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform" /></div>
                    </Link>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-screen relative">
                <AnimatePresence>
                    {notifications.map((note, idx) => (
                        <motion.div key={idx} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-zinc-950 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
                            <Sparkles className="h-4 w-4" />{note}
                        </motion.div>
                    ))}
                </AnimatePresence>

                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <div className="px-4 py-1.5 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-spin-slow" /> Modo Demo Interactivo
                        </div>
                        <div className="hidden xl:flex items-center gap-3 text-zinc-700 font-black text-[10px] uppercase tracking-widest">
                            <Shield className="h-4 w-4 text-emerald-500" /> Entorno de Venta Protegido
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="h-11 px-6 rounded-2xl text-zinc-500 font-bold hover:text-white">Ver Precios</Button>
                        <Link href="/register"><Button className="h-12 px-8 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-tight shadow-xl">Crear Tienda Ahora</Button></Link>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white"><LayoutTemplate className="h-6 w-6" /></button>
                </header>

                <div className="p-8 lg:p-16 max-w-7xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeModule} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                            {renderModule()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <section className="mt-auto px-10 py-20 border-t border-white/5 bg-gradient-to-t from-violet-600/5 to-transparent text-center space-y-8">
                    <div className="max-w-xl mx-auto space-y-3">
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">¿Listo para lanzar tu propia tienda?</h2>
                        <p className="text-zinc-500 text-xl font-medium italic">Configura tu imperio digital en menos de 5 minutos.</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link href="/register"><Button className="h-16 px-12 rounded-3xl bg-violet-600 hover:bg-violet-500 text-white text-xl font-black uppercase shadow-2xl shadow-violet-600/40">Crear mi tienda gratis</Button></Link>
                        <Button variant="outline" className="h-16 px-12 rounded-3xl border-white/10 hover:bg-white/5 text-lg font-bold">Ver planes pro</Button>
                    </div>
                </section>

                <footer className="p-8 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] bg-zinc-950">
                    <span>© 2026 UnderDeskFlow OS</span>
                    <div className="flex gap-6"><span>Latency: 8ms</span><span>Security: Active</span><span>Region: Santiago-CL</span></div>
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
