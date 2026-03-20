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
    Eye,
    Truck,
    Wallet,
    Megaphone,
    Monitor,
    CreditCard as BillingIcon,
    ChevronDown,
    ChevronRight,
    Clock,
    UserPlus,
    History,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- Types & Constants ---

type ModuleId = 
    | "dashboard" | "orders" | "products" 
    | "customers" | "payments" | "fulfillment" | "payouts"
    | "analytics" | "marketing" | "pos"
    | "domains" | "integrations" | "create-store"
    | "team" | "billing" | "settings";

interface NavItem {
    id: ModuleId;
    label: string;
    icon: React.ElementType;
}

const navGroups = [
    {
        label: "Core",
        items: [
            { id: "dashboard", label: "Dashboard", icon: LayoutTemplate },
            { id: "orders", label: "Órdenes", icon: ShoppingBag },
            { id: "products", label: "Catálogo", icon: Package },
        ]
    },
    {
        label: "Operaciones",
        items: [
            { id: "customers", label: "Clientes", icon: Users },
            { id: "payments", label: "Transacciones", icon: CreditCard },
            { id: "fulfillment", label: "Logística", icon: Truck },
            { id: "payouts", label: "Liquidaciones", icon: Wallet },
        ]
    },
    {
        label: "Crecimiento",
        items: [
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "marketing", label: "Promociones", icon: Megaphone },
            { id: "pos", label: "Punto de Venta", icon: Monitor },
        ]
    },
    {
        label: "Ecosistema",
        items: [
            { id: "domains", label: "Dominios", icon: Globe },
            { id: "integrations", label: "Integraciones", icon: Puzzle },
            { id: "create-store", label: "Nueva Tienda", icon: PlusCircle },
        ]
    },
    {
        label: "Administración",
        items: [
            { id: "team", label: "Equipo", icon: Users },
            { id: "billing", label: "Suscripción", icon: BillingIcon },
            { id: "settings", label: "Configuración", icon: Settings },
        ]
    }
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

const OnboardingTooltip = ({ text, step, currentStep, onNext, onSkip }: { text: string; step: number; currentStep: number; onNext: () => void; onSkip: () => void }) => {
    if (step !== currentStep) return null;
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute z-[60] bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 p-4 bg-violet-600 rounded-2xl shadow-2xl text-white pointer-events-auto">
            <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-white animate-pulse" />
                <div className="space-y-2">
                    <p className="text-xs font-bold leading-relaxed">{text}</p>
                    <div className="flex items-center justify-between pt-1">
                        <button onClick={onSkip} className="text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity">Saltar guía</button>
                        <Button onClick={onNext} size="sm" className="h-7 px-3 bg-white text-violet-600 hover:bg-zinc-100 rounded-lg text-[10px] font-black uppercase">Entendido</Button>
                    </div>
                </div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-violet-600" />
        </motion.div>
    );
};

// --- Modules Implementation ---

const DashboardMock = () => (
    <div className="space-y-10">
        <ModuleHeader title="Centro de Mando" subtitle="Visión global de tu infraestructura comercial." />
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
                { label: "GMV Total Mes", value: "$42.8M", trend: "+12.4%", up: true },
                { label: "Órdenes Activas", value: "1.284", trend: "+5.1%", up: true },
                { label: "Margen Operativo", value: "24.2%", trend: "+1.2%", up: true },
                { label: "Satisfacción Cliente", value: "4.9/5", trend: "+0.2%", up: true },
            ].map((kpi, i) => (
                <DashboardCard key={i} delay={i * 0.1}>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">{kpi.label}</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-bold text-white tracking-tighter">{kpi.value}</h3>
                        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}>
                            {kpi.trend}
                        </div>
                    </div>
                </DashboardCard>
            ))}
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCard className="lg:col-span-2 h-64 flex items-center justify-center border-dashed">
                <BarChart3 className="h-12 w-12 text-white/10" />
                <span className="ml-4 text-zinc-600 font-black uppercase tracking-[0.5em] text-xs">Simulación de Tráfico Edge</span>
            </DashboardCard>
            <DashboardCard className="space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Actividad Segura</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-start">
                            <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <p className="text-[10px] text-zinc-400 font-medium">Webhook verificado para Orden #{1024 + i}</p>
                        </div>
                    ))}
                </div>
            </DashboardCard>
        </div>
    </div>
);

const ProductsMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Catálogo Maestro" subtitle="Gestiona tu inventario global." action={<Button className="bg-violet-600 font-bold rounded-xl h-10 px-6 uppercase text-xs">Nuevo Producto</Button>} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { name: "Polera Oversize", price: "$19.990", stock: 42, status: "Activo" },
                { name: "Zapatillas Urban", price: "$59.990", stock: 12, status: "Bajo Stock" },
                { name: "Mochila Tech", price: "$34.990", stock: 0, status: "Agotado" },
            ].map((p, i) => (
                <DashboardCard key={i} className="p-0 overflow-hidden bg-zinc-900/40" delay={i * 0.1}>
                    <div className="h-32 bg-zinc-800 flex items-center justify-center"><Package className="h-8 w-8 text-white/5" /></div>
                    <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-white">{p.name}</h4>
                            <span className="text-violet-400 font-black text-xs">{p.price}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600">
                            <span>Stock: {p.stock}</span>
                            <span className={p.stock === 0 ? "text-rose-500" : "text-emerald-500"}>{p.status}</span>
                        </div>
                    </div>
                </DashboardCard>
            ))}
        </div>
    </div>
);

const OrdersMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Seguimiento de Órdenes" subtitle="Visibilidad total del flujo transaccional." />
        <DashboardCard className="p-0 overflow-hidden bg-zinc-900/40">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Orden</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Estado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 text-right">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { id: "#1024", customer: "Juan Pérez", status: "Pagado", amount: "$34.990" },
                        { id: "#1025", customer: "María Soto", status: "Enviado", amount: "$89.990" },
                        { id: "#1026", customer: "Diego Ramos", status: "Pendiente", amount: "$12.490" },
                    ].map((o, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                            <td className="px-6 py-4 text-xs font-black text-white">{o.id}</td>
                            <td className="px-6 py-4 text-sm text-zinc-400">{o.customer}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400">{o.status}</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-white text-right">{o.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DashboardCard>
    </div>
);

const FulfillmentMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Logística & Despacho" subtitle="Control de última milla y transportistas." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { carrier: "Chilexpress", tracking: "CH8429102", status: "En Tránsito", destination: "Santiago, RM" },
                { carrier: "Starken", tracking: "ST9920145", status: "Recolectado", destination: "Viña del Mar, VAL" },
                { carrier: "Blue Express", tracking: "BE7739221", status: "Entregado", destination: "Concepción, BIO" },
                { carrier: "DHL Global", tracking: "DHL00912X", status: "Aduana", destination: "Miami, US" },
            ].map((f, i) => (
                <DashboardCard key={i} delay={i * 0.1} className="bg-zinc-900/40">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-violet-400" />
                            <h4 className="font-bold text-white uppercase tracking-tight">{f.carrier}</h4>
                        </div>
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase text-zinc-500">{f.status}</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-zinc-600 uppercase">Seguimiento: <span className="text-zinc-300 ml-1">{f.tracking}</span></p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase">Destino: <span className="text-zinc-300 ml-1">{f.destination}</span></p>
                    </div>
                    <Button variant="ghost" className="w-full mt-4 h-9 border border-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-white">Rastrear en tiempo real</Button>
                </DashboardCard>
            ))}
        </div>
    </div>
);

const PayoutsMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Liquidaciones" subtitle="Historial de depósitos en tu cuenta bancaria." />
        <DashboardCard className="p-0 overflow-hidden bg-zinc-900/40 border-emerald-500/10 border-2">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Próximo Depósito</p>
                    <h3 className="text-2xl font-black text-emerald-400 tracking-tighter">$1.240.000</h3>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Fecha Estimada</p>
                    <p className="text-sm font-bold text-white uppercase">Viernes, 22 Marzo</p>
                </div>
            </div>
            <table className="w-full text-left">
                <tbody>
                    {[
                        { date: "15 Mar, 2024", amount: "$840.200", status: "Completado", bank: "Banco Chile" },
                        { date: "08 Mar, 2024", amount: "$1.120.000", status: "Completado", bank: "Banco Chile" },
                        { date: "01 Mar, 2024", amount: "$940.000", status: "Completado", bank: "Banco Chile" },
                    ].map((p, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-zinc-400">{p.date}</td>
                            <td className="px-6 py-4 text-xs font-black text-white">{p.amount}</td>
                            <td className="px-6 py-4 text-[9px] font-black uppercase text-emerald-500">{p.status}</td>
                            <td className="px-6 py-4 text-[9px] font-black uppercase text-zinc-600 text-right">{p.bank}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DashboardCard>
    </div>
);

const MarketingMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Motor de Marketing" subtitle="Campañas, descuentos y fidelización." action={<Button className="bg-emerald-600 font-bold rounded-xl h-10 px-6 uppercase text-xs">Nueva Campaña</Button>} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { name: "CUPON-BIENVENIDA", discount: "15% OFF", active: 242, conversion: "12.4%", color: "text-emerald-400" },
                { name: "CYBER-SALE-2024", discount: "$10.000", active: 1102, conversion: "18.1%", color: "text-violet-400" },
                { name: "VIP-LOYALTY", discount: "20% OFF", active: 42, conversion: "4.2%", color: "text-amber-400" },
                { name: "ABANDONO-CARRITO", discount: "Envío Gratis", active: 89, conversion: "24.2%", color: "text-blue-400" },
            ].map((c, i) => (
                <DashboardCard key={i} delay={i * 0.1} className="bg-zinc-900/40">
                    <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">{c.name}</p>
                    <div className="flex justify-between items-end">
                        <h4 className={`text-2xl font-black tracking-tighter ${c.color}`}>{c.discount}</h4>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-zinc-500">Conversión</p>
                            <p className="text-xs font-bold text-white">{c.conversion}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase text-zinc-700 tracking-widest">
                        <span>{c.active} redesenciones</span>
                        <span>Activa</span>
                    </div>
                </DashboardCard>
            ))}
        </div>
    </div>
);

const POSMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Point of Sale (Retail)" subtitle="Venta presencial sincronizada en tiempo real." />
        <div className="flex gap-8">
            <DashboardCard className="flex-1 min-h-[400px] border-dashed flex flex-col items-center justify-center space-y-4">
                <Monitor className="h-16 w-16 text-zinc-800" />
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-700">Scan Barcode / Search Product</h4>
                <div className="w-full max-w-sm h-12 bg-zinc-950 rounded-2xl border border-white/5 flex items-center px-4 gap-3">
                    <Search className="h-4 w-4 text-zinc-700" />
                    <span className="text-xs text-zinc-700 font-bold italic">Listo para escanear...</span>
                </div>
            </DashboardCard>
            <div className="w-80 space-y-6 text-white">
                <DashboardCard className="bg-zinc-900 shadow-2xl border-violet-500/20">
                    <h4 className="font-black uppercase tracking-tighter mb-4 pb-2 border-b border-white/5">Resumen de Venta</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-zinc-400"><span>Subtotal (Neto)</span><span>$54.000</span></div>
                        <div className="flex justify-between text-xs text-zinc-400"><span>IVA (19%)</span><span>$10.260</span></div>
                        <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-white/10 uppercase"><span>Total</span><span>$64.260</span></div>
                    </div>
                    <Button className="w-full mt-6 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase">Pagar con Transbank</Button>
                </DashboardCard>
            </div>
        </div>
    </div>
);

const TeamMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Equipo & Seguridad" subtitle="Gestiona roles y permisos de acceso." action={<Button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl h-10 px-6 uppercase text-xs gap-2"><UserPlus className="h-4 w-4" /> Invitar Usuario</Button>} />
        <div className="space-y-4">
            {[
                { name: "Jorge Astorga", email: "jorge@udf.cl", role: "Super Admin", lastActive: "Ahora", status: "Active" },
                { name: "Carlos Silva", email: "carlos@ecommerce.cl", role: "Manager", lastActive: "Hace 2h", status: "Active" },
                { name: "Daniela Ruiz", role: "Logística", email: "daniela@warehouse.pro", lastActive: "Hace 1d", status: "Active" },
            ].map((u, i) => (
                <DashboardCard key={i} className="flex items-center justify-between p-5 bg-zinc-900/40" delay={i * 0.1}>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold uppercase">{u.name.charAt(0)}</div>
                        <div>
                            <h4 className="font-bold text-white text-sm">{u.name}</h4>
                            <p className="text-[10px] text-zinc-500">{u.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Rol</p>
                            <p className="text-xs font-bold text-white uppercase">{u.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Actividad</p>
                            <p className="text-xs font-bold text-zinc-400">{u.lastActive}</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[8px] font-black uppercase">{u.status}</span>
                    </div>
                </DashboardCard>
            ))}
        </div>
    </div>
);

const BillingMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Plan & Suscripción" subtitle="Controla tu facturación Enterprise." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DashboardCard className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border-violet-500/30">
                <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-2">Plan Actual</p>
                <div className="flex justify-between items-end mb-8">
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Enterprise OS</h3>
                    <span className="text-xs font-bold text-violet-400">PAGO MENSUAL</span>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sedes Ilimitadas</div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Soporte Dedicado 24/7</div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Certificados SSL Wildcard</div>
                </div>
            </DashboardCard>
            <DashboardCard className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Resumen de Cuenta</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                        <span className="text-zinc-500">Próximo Cobro</span>
                        <span className="font-bold text-white uppercase italic">01 Abril, 2024</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                        <span className="text-zinc-500">Metodo de Pago</span>
                        <span className="font-bold text-white flex items-center gap-2"><CreditCard className="h-4 w-4 text-zinc-600" /> Visa **** 4242</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full rounded-2xl border-white/10 text-xs font-black uppercase h-12">Gestionar Facturación</Button>
            </DashboardCard>
        </div>
    </div>
);

const SettingsMock = () => (
    <div className="space-y-8">
        <ModuleHeader title="Configuración de Instancia" subtitle="Personaliza el cerebro de tu operación." />
        <DashboardCard className="max-w-2xl bg-zinc-900/40">
            <div className="space-y-10">
                <section className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6">Identidad de Marca</h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500">Nombre de Tienda</label>
                            <input readOnly value="Boutique Luxury OS" className="w-full h-11 bg-zinc-950/50 border border-white/5 rounded-xl px-4 text-white text-xs font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500">Subdominio Primary</label>
                            <input readOnly value="boutique-luxury.udf.cl" className="w-full h-11 bg-zinc-950/50 border border-white/5 rounded-xl px-4 text-white text-xs font-medium" />
                        </div>
                    </div>
                </section>
                <section className="space-y-6 pt-10 border-t border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6">Preferencias Operativas</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div><p className="text-sm font-bold text-white">Modo Alta Latencia</p><p className="text-[10px] text-zinc-500">Priorizar velocidad sobre consistencia total.</p></div>
                            <div className="w-10 h-6 bg-emerald-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div><p className="text-sm font-bold text-white">Sincronización Multicanal</p><p className="text-[10px] text-zinc-500">Stock unificado en todas las plataformas.</p></div>
                            <div className="w-10 h-6 bg-emerald-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                        </div>
                    </div>
                </section>
                <Button className="w-full h-14 bg-violet-600 hover:bg-violet-500 rounded-2xl font-black uppercase tracking-widest flex gap-2"><Save className="h-5 w-5" /> Guardar Preferencias</Button>
            </div>
        </DashboardCard>
    </div>
);

// --- Main Page Component ---

export default function DemoPage() {
    const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
    const [demoStep, setDemoStep] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<string[]>([]);
    
    // Module rendering routing
    const renderModule = () => {
        switch (activeModule) {
            case "dashboard": return <DashboardMock />;
            case "orders": return <OrdersMock />;
            case "products": return <ProductsMock />;
            case "fulfillment": return <FulfillmentMock />;
            case "payouts": return <PayoutsMock />;
            case "marketing": return <MarketingMock />;
            case "pos": return <POSMock />;
            case "team": return <TeamMock />;
            case "billing": return <BillingMock />;
            case "settings": return <SettingsMock />;
            case "integrations": return <IntegrationsMock step={demoStep} onNext={() => setDemoStep(1)} onSkip={() => setDemoStep(-1)} />;
            case "create-store": return <StoreCreationMock step={demoStep} onNext={() => setDemoStep(-1)} onSkip={() => setDemoStep(-1)} />;
            default: return <div className="py-20 text-center text-zinc-700 font-black uppercase tracking-widest text-lg animate-pulse">Syncing Data Core...</div>;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-violet-500/30 overflow-x-hidden">
            <div className="fixed top-[-15%] left-[-10%] w-[80%] h-[80%] bg-violet-600/5 blur-[200px] rounded-full pointer-events-none" />
            
            {/* Sidebar with logical grouping */}
            <aside className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col w-72 border-r border-white/5 bg-zinc-950/80 backdrop-blur-3xl transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="p-10 pb-6 flex items-center gap-4">
                    <div className="bg-violet-600 p-2.5 rounded-2xl shadow-xl shadow-violet-600/30"><LayoutTemplate className="h-6 w-6 text-white" /></div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tighter uppercase italic">UnderDesk</span>
                        <span className="text-[10px] uppercase font-black text-violet-400 tracking-[0.2em] -mt-1">Pulse Engine</span>
                    </div>
                </div>

                <nav className="flex-1 px-5 space-y-6 mt-6 overflow-y-auto custom-scrollbar pb-10">
                    {navGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            <h5 className="px-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-2">{group.label}</h5>
                            {group.items.map((item) => (
                                <button key={item.id} onClick={() => { setActiveModule(item.id as ModuleId); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all group relative overflow-hidden ${activeModule === item.id ? "bg-white/10 text-white shadow-xl" : "text-zinc-600 hover:text-zinc-200 hover:bg-white/5"}`}>
                                    <item.icon className={`h-4 w-4 ${activeModule === item.id ? "text-violet-400" : "group-hover:text-zinc-300"}`} />
                                    {item.label}
                                    {activeModule === item.id && <motion.div layoutId="side-nav-glow" className="absolute right-0 w-1 h-5 bg-violet-500 rounded-full" />}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
                
                <div className="p-8 border-t border-white/5 text-center">
                    <p className="text-[9px] font-black uppercase text-zinc-800 tracking-widest mb-4">Enterprise v1.4.2</p>
                    <Link href="/register"><Button className="w-full h-11 bg-white text-black font-black uppercase tracking-tighter text-[10px] rounded-2xl hover:bg-zinc-200">Terminar Simulación</Button></Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen">
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <div className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                             Full Product Demo
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-700 tracking-widest">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            Uptime: 99.99% Guaranteed
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-600 lg:mr-4 uppercase tracking-[0.3em] hidden xl:block">UnderDeskFlow OS Simulation</span>
                        <Link href="/register"><Button className="h-12 px-8 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-tight shadow-xl">Adquirir Licencia Real</Button></Link>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white"><LayoutTemplate className="h-6 w-6" /></button>
                </header>

                <div className="p-8 lg:p-16 max-w-7xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeModule} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
                            {renderModule()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <footer className="mt-auto p-10 border-t border-white/5 bg-zinc-950/50 flex flex-col md:flex-row items-center justify-between opacity-50 text-white">
                    <div className="flex gap-10">
                        {[
                            { label: "Storage", val: "1.2TB / 5TB", icon: Shield },
                            { label: "Throughput", val: "84k req/sec", icon: zap },
                            { label: "Status", val: "Operational", icon: Activity },
                        ].map((s, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className="text-[9px] font-black uppercase text-zinc-700 tracking-widest">{s.label}</span>
                                <span className="text-[10px] font-bold">{s.val}</span>
                            </div>
                        ))}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[1em] text-zinc-800">Coded for Excellence • UnderDeskFlow OS</span>
                </footer>
            </main>

            <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; } `}</style>
        </div>
    );
}

// Re-implementing these for closure consistency
const zap = Zap;
const IntegrationsMock = ({ step, onNext, onSkip }: { step?: number; onNext?: () => void; onSkip?: () => void }) => {
    const [connected, setConnected] = useState<string[]>(["shopify"]);
    return (
        <div className="space-y-8 relative">
            <OnboardingTooltip text="Conecta tus canales de venta para unificar tus operaciones." step={0} currentStep={step || -1} onNext={onNext || (() => {})} onSkip={onSkip || (() => {})} />
            <ModuleHeader title="Unifica tus Canales" subtitle="Vende en todas partes, gestiona en un solo lugar." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[{ id: "shopify", name: "Shopify", icon: "https://cdn.worldvectorlogo.com/logos/shopify.svg" }, { id: "mercadolibre", name: "MercadoLibre", icon: "https://cdn.worldvectorlogo.com/logos/mercadolibre-1.svg" }].map((app, i) => (
                    <DashboardCard key={app.id} className="bg-zinc-900/40">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 p-2 bg-white/10 rounded-xl"><img src={app.icon} className="h-full w-full object-contain" /></div>
                            <h4 className="font-bold text-white uppercase tracking-tight">{app.name}</h4>
                        </div>
                        <Button className="w-full bg-white text-black font-black uppercase rounded-xl h-12" onClick={() => onNext && onNext()}>Conectar Canal</Button>
                    </DashboardCard>
                ))}
            </div>
        </div>
    );
};

const StoreCreationMock = ({ step, onNext, onSkip }: { step?: number; onNext?: () => void; onSkip?: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const handleSubmit = (e: any) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); setDone(true); }, 2000); };
    return (
        <div className="max-w-xl mx-auto py-10 relative">
            <OnboardingTooltip text="Configura tu instancia. Tendrás un dominio listo para vender en segundos." step={1} currentStep={step || -1} onNext={onNext || (() => {})} onSkip={onSkip || (() => {})} />
            {!done ? (
                <DashboardCard className="p-8 space-y-6">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Lanza tu Tienda</h3>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input placeholder="Nombre de Marca" className="w-full h-12 bg-zinc-950 border border-white/5 rounded-xl px-4 text-white text-sm" />
                        <Button type="submit" className="w-full h-14 bg-violet-600 font-black uppercase text-lg rounded-2xl">{loading ? "Lanzando..." : "Sincronizar OS"}</Button>
                    </form>
                </DashboardCard>
            ) : (
                <div className="text-center space-y-6">
                    <CheckCircle2 className="h-20 w-20 text-emerald-400 mx-auto" />
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">¡Tienda Online!</h3>
                    <Button onClick={() => setDone(false)} variant="link" className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Reiniciar Demo</Button>
                </div>
            )}
        </div>
    );
};
