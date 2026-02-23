"use client";
import { motion } from "framer-motion";
import { Truck, MapPin, Clock, Package } from "lucide-react";

const CARRIERS = [
    { name: "Starken", color: "#ff6b35", status: "Conectado", time: "24-48h" },
    { name: "Chilexpress", color: "#e31837", status: "Conectado", time: "48-72h" },
    { name: "Blue Express", color: "#1e40af", status: "Conectado", time: "24h" },
    { name: "Correos de Chile", color: "#006400", status: "Disponible", time: "72-96h" },
];

const SHIPMENTS = [
    { id: "#SHP-2841", dest: "Santiago, RM", carrier: "Starken", status: "En camino", progress: 80 },
    { id: "#SHP-2840", dest: "Valparaíso, V", carrier: "Blue Express", status: "Despachado", progress: 40 },
    { id: "#SHP-2839", dest: "Concepción, VIII", carrier: "Chilexpress", status: "Entregado", progress: 100 },
    { id: "#SHP-2838", dest: "Antofagasta, II", carrier: "Starken", status: "Preparando", progress: 15 },
];

const STATUS_COLORS: Record<string, string> = {
    "En camino": "text-blue-400",
    "Despachado": "text-amber-400",
    "Entregado": "text-emerald-400",
    "Preparando": "text-muted-foreground",
};

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function ShippingSection() {
    return (
        <section id="envios" className="relative overflow-hidden">

            {/* ── Section A: Carriers ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-br from-amber-950/10 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 7, repeat: Infinity }}
                        className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[130px]"
                    />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    {/* Shipping dashboard mock */}
                    <motion.div {...fdUp(0)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/6 flex items-center gap-3">
                            <Truck className="h-5 w-5 text-amber-400" />
                            <span className="font-semibold">Gestión de Envíos</span>
                            <span className="ml-auto text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg font-medium">
                                4 activos
                            </span>
                        </div>

                        {/* Carrier pills */}
                        <div className="p-5 border-b border-white/5">
                            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Carriers integrados</p>
                            <div className="grid grid-cols-2 gap-2">
                                {CARRIERS.map((c, i) => (
                                    <motion.div key={c.name}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 + i * 0.08 }}
                                        viewport={{ once: true }}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/2">
                                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: c.color + "20", color: c.color }}>
                                            {c.name.slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.time}</p>
                                        </div>
                                        <div className={`ml-auto h-2 w-2 rounded-full ${c.status === "Conectado" ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Shipments list */}
                        <div>
                            <p className="px-5 pt-4 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Órdenes en tránsito</p>
                            {SHIPMENTS.map((s, i) => (
                                <motion.div key={s.id}
                                    initial={{ opacity: 0, x: -15 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="px-5 py-3.5 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground">{s.id}</span>
                                            <span className={`text-xs font-semibold ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />{s.dest}
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${s.progress}%` }}
                                            transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                                            viewport={{ once: true }}
                                            className={`h-full rounded-full ${s.progress === 100 ? "bg-emerald-500" : s.progress > 50 ? "bg-blue-500" : s.progress > 20 ? "bg-amber-500" : "bg-muted-foreground"}`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">{s.carrier}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Truck className="h-3.5 w-3.5" /> Módulo 4 · Logística
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Envíos que<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">llegan a tiempo.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Conecta con Starken, Chilexpress, Blue Express y más. Reglas automáticas de despacho, zonas de cobertura y envío gratis configurable.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Truck, label: "Carriers integrados", val: "8" },
                                { icon: MapPin, label: "Zonas de cobertura", val: "329" },
                                { icon: Clock, label: "Tiempo de despacho", val: "<24h" },
                                { icon: Package, label: "Pickups configurables", val: "∞" },
                            ].map(item => (
                                <div key={item.label} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{item.val}</p>
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── Section B: Shipping zones visual map ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/10">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-14">
                        <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase mb-3">Cobertura Nacional</p>
                        <h3 className="text-4xl font-bold font-serif">Despacha a todo Chile</h3>
                        <p className="text-muted-foreground mt-3">Configura reglas por región, comuna o código postal. Precios dinámicos por peso y distancia.</p>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { region: "Norte Grande", comunas: "Arica, Iquique, Antofagasta", time: "48-72h", color: "from-amber-500/20" },
                            { region: "Zona Central", comunas: "RM, Valparaíso, O'Higgins", time: "24-48h", color: "from-blue-500/20" },
                            { region: "Sur & Austral", comunas: "Biobío, Los Ríos, Magallanes", time: "72-96h", color: "from-emerald-500/20" },
                        ].map((zone, i) => (
                            <motion.div key={zone.region} {...fdUp(i * 0.15)}
                                className={`p-6 rounded-2xl border border-white/8 bg-gradient-to-b ${zone.color} to-transparent`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">{zone.region}</h4>
                                    <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-lg">{zone.time}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{zone.comunas}</p>
                                <div className="mt-4 h-24 rounded-xl bg-white/3 border border-white/5 relative overflow-hidden">
                                    {/* Abstract map visualization */}
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <motion.div key={j}
                                            className="absolute h-1 rounded-full bg-current opacity-20"
                                            style={{
                                                width: `${40 + j * 8}%`,
                                                left: `${5 + j * 3}%`,
                                                top: `${15 + j * 12}%`,
                                                color: j % 2 === 0 ? "#60a5fa" : "#34d399"
                                            }}
                                            animate={{ opacity: [0.1, 0.4, 0.1] }}
                                            transition={{ duration: 2 + j * 0.4, repeat: Infinity, delay: j * 0.3 }}
                                        />
                                    ))}
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                                        className={`absolute w-3 h-3 rounded-full bg-amber-400`}
                                        style={{ left: `${30 + i * 15}%`, top: "40%" }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
