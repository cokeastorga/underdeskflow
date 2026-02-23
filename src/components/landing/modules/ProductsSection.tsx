"use client";
import { motion } from "framer-motion";
import { Package, BarChart2, Search } from "lucide-react";

const PRODUCTS = [
    { name: "Polera Oversize", price: "$24.990", stock: 142, status: "active", badge: "Nuevo", cat: "Ropa" },
    { name: "Jeans Slim Fit", price: "$54.990", stock: 38, status: "low", badge: null, cat: "Ropa" },
    { name: "Air Max 2026", price: "$89.990", stock: 0, status: "out", badge: "Agotado", cat: "Zapatos" },
    { name: "Bolso Tote Cuero", price: "$39.990", stock: 91, status: "active", badge: "Top", cat: "Accesorios" },
    { name: "Gafas UV400", price: "$19.990", stock: 220, status: "active", badge: null, cat: "Accesorios" },
    { name: "Gorro Beanie", price: "$14.990", stock: 15, status: "low", badge: "Oferta", cat: "Ropa" },
];

const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    low: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    out: "bg-red-500/15 text-red-400 border-red-500/30",
};

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function ProductsSection() {
    return (
        <section id="productos" className="relative overflow-hidden">

            {/* ── Section A: Product grid ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-br from-emerald-950/10 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 right-0 w-[500px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
                </div>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Package className="h-3.5 w-3.5" /> Módulo 3 · Productos
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Tu catálogo,<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">perfecto.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Gestiona productos con variantes de talla, color y SKU. Fotos en alta resolución, precios y stock en tiempo real.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="flex flex-wrap gap-3">
                            {["Variantes Avanzadas", "Imágenes Múltiples", "SEO por Producto", "Importación CSV", "Alertas de Stock Bajo"].map(f => (
                                <span key={f} className="px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-xs font-medium">{f}</span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Product manager table mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-1 h-9 px-3 rounded-xl bg-muted/50 border border-border">
                                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">Buscar productos...</span>
                            </div>
                            <motion.button whileHover={{ scale: 1.04 }}
                                className="h-9 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold whitespace-nowrap">
                                + Agregar
                            </motion.button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {PRODUCTS.map((p, i) => (
                                <motion.div key={p.name}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    viewport={{ once: true }}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            animate={{ backgroundColor: ["hsl(160,50%,15%)", "hsl(180,50%,15%)", "hsl(160,50%,15%)"] }}
                                            transition={{ duration: 4 + i, repeat: Infinity }}
                                            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg">
                                            <Package className="h-4 w-4 text-emerald-400/60" />
                                        </motion.div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{p.name}</p>
                                                {p.badge && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[p.status]}`}>
                                                        {p.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{p.cat} · {p.stock} en stock</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-400">{p.price}</p>
                                        <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium border mt-1 ${STATUS_COLORS[p.status]}`}>
                                            {p.status === "active" ? "Activo" : p.status === "low" ? "Stock bajo" : "Agotado"}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Variant & inventory ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/10">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                    <motion.div {...fdUp(0)}>
                        <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-3">Variantes Inteligentes</p>
                        <h3 className="text-3xl font-bold font-serif mb-4">Un producto, infinitas combinaciones</h3>
                        <p className="text-muted-foreground mb-6">Define atributos — talla, color, material — y el sistema genera automáticamente todas las combinaciones con stock y precio propio.</p>
                        {/* Variant builder mock */}
                        <div className="rounded-2xl border border-white/8 bg-card p-5 space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-2 font-medium">Talla</p>
                                <div className="flex gap-2 flex-wrap">
                                    {["XS", "S", "M", "L", "XL", "XXL"].map((s, i) => (
                                        <motion.div key={s} initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                                            transition={{ delay: 0.1 + i * 0.05, type: "spring" }} viewport={{ once: true }}
                                            className={`h-9 w-9 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer ${s === "M" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                            {s}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-2 font-medium">Color</p>
                                <div className="flex gap-2">
                                    {["#1e293b", "#7f1d1d", "#14532d", "#1e3a5f", "#4c1d95", "#78350f"].map((c, i) => (
                                        <motion.div key={c} initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                                            transition={{ delay: 0.1 + i * 0.05, type: "spring" }} viewport={{ once: true }}
                                            className={`h-7 w-7 rounded-full cursor-pointer border-2 ${i === 0 ? "border-white scale-110" : "border-transparent"}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Combinaciones generadas</span>
                                    <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                        className="font-bold text-emerald-400">36 variantes</motion.span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)}>
                        <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-3">Control de Inventario</p>
                        <h3 className="text-3xl font-bold font-serif mb-4">Sin quiebres de stock</h3>
                        <p className="text-muted-foreground mb-6">Alertas automáticas cuando el stock baja del umbral. Historial de movimientos y proyección de quiebre.</p>
                        {/* Stock chart */}
                        <div className="rounded-2xl border border-white/8 bg-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-medium">Stock los últimos 30 días</span>
                                </div>
                                <span className="text-xs text-amber-400 font-medium">⚠ Alerta activa</span>
                            </div>
                            <div className="flex items-end gap-1 h-24">
                                {[80, 72, 68, 60, 55, 52, 48, 42, 38, 34, 31, 28, 25, 22, 15].map((v, i) => (
                                    <motion.div key={i}
                                        initial={{ height: 0 }} whileInView={{ height: `${v}%` }}
                                        transition={{ delay: i * 0.04, duration: 0.5 }}
                                        viewport={{ once: true }}
                                        className={`flex-1 rounded-t-md ${v < 30 ? "bg-red-500/60" : v < 50 ? "bg-amber-500/60" : "bg-emerald-500/60"}`} />
                                ))}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>Hace 30 días</span>
                                <span className="text-red-400 font-medium">Hoy: 15 unidades</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
