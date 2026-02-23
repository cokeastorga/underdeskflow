"use client";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Users, DollarSign } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

const REVENUE_DATA = [30, 45, 38, 60, 55, 72, 68, 85, 78, 92, 88, 100];
const MONTHS = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb"];
const TOP_PRODUCTS = [
    { name: "Air Max 2026", revenue: 89, change: "+24%" },
    { name: "Jeans Slim", revenue: 67, change: "+18%" },
    { name: "Polera Premium", revenue: 54, change: "+31%" },
    { name: "Bolso Cuero", revenue: 41, change: "+8%" },
    { name: "Gafas UV400", revenue: 32, change: "-3%" },
];

export default function AnalyticsSection() {
    const max = Math.max(...REVENUE_DATA);

    return (
        <section id="analytics" className="relative overflow-hidden">

            {/* ── Section A: Revenue chart ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-tl from-indigo-950/15 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[130px]" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <BarChart2 className="h-3.5 w-3.5" /> Módulo 6 · Analytics
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Datos que te<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">hacen crecer.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Dashboards en tiempo real. GMV, conversión, ticket promedio, cohortes de clientes y proyecciones de crecimiento — todo en un solo lugar.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="grid grid-cols-2 gap-4">
                            {[
                                { icon: DollarSign, label: "GMV total rastreado", val: "$48M+" },
                                { icon: TrendingUp, label: "Crecimiento promedio", val: "+34%" },
                                { icon: Users, label: "Compradores únicos", val: "52K+" },
                                { icon: BarChart2, label: "Tasa de conversión", val: "3.8%" },
                            ].map(m => (
                                <div key={m.label} className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
                                    <m.icon className="h-4 w-4 text-indigo-400 mb-2" />
                                    <p className="text-xl font-bold">{m.val}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Revenue chart mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground">Ingresos totales</p>
                                <motion.p
                                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }} viewport={{ once: true }}
                                    className="text-3xl font-bold">
                                    $48,291,430
                                </motion.p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                                <TrendingUp className="h-4 w-4" /> +34% YoY
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-6">Últimos 12 meses</p>

                        {/* Chart */}
                        <div className="relative h-52">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pr-3 text-[10px] text-muted-foreground">
                                {["$4M", "$3M", "$2M", "$1M", "$0"].map(l => <span key={l}>{l}</span>)}
                            </div>
                            {/* Chart area */}
                            <div className="ml-8 h-full flex items-end justify-between gap-1.5">
                                {REVENUE_DATA.map((v, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${(v / max) * 100}%` }}
                                            transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                                            viewport={{ once: true }}
                                            className="w-full rounded-t-lg relative overflow-hidden"
                                            style={{
                                                background: `linear-gradient(to top, hsl(243,75%,45%), hsl(243,75%,65%))`,
                                                opacity: i === REVENUE_DATA.length - 1 ? 1 : 0.7 + (i / REVENUE_DATA.length) * 0.3
                                            }}>
                                            <motion.div
                                                animate={{ y: ["-100%", "100%"] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
                                                className="absolute inset-x-0 h-full bg-gradient-to-b from-white/20 to-transparent"
                                            />
                                        </motion.div>
                                        <p className="text-[9px] text-muted-foreground">{MONTHS[i]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: KPI cards & Top Products ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/5">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* Funnel */}
                    <motion.div {...fdUp(0)} className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-6">
                        <p className="font-semibold mb-1">Funnel de Conversión</p>
                        <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>
                        {[
                            { label: "Visitantes únicos", val: 48200, pct: 100, color: "bg-indigo-500" },
                            { label: "Vieron un producto", val: 28940, pct: 60, color: "bg-blue-500" },
                            { label: "Agregaron al carrito", val: 8210, pct: 17, color: "bg-cyan-500" },
                            { label: "Iniciaron checkout", val: 4100, pct: 8.5, color: "bg-teal-500" },
                            { label: "Compraron", val: 1830, pct: 3.8, color: "bg-emerald-500" },
                        ].map((f, i) => (
                            <div key={f.label} className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">{f.label}</span>
                                    <span className="text-xs font-semibold">{f.val.toLocaleString("es-CL")}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${f.pct}%` }}
                                        transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                                        viewport={{ once: true }}
                                        className={`h-full rounded-full ${f.color}`}
                                    />
                                </div>
                                <p className="text-right text-[10px] text-muted-foreground mt-0.5">{f.pct}%</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Top products */}
                    <motion.div {...fdUp(1)} className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-6">
                        <p className="font-semibold mb-1">Top Productos por Revenue</p>
                        <p className="text-xs text-muted-foreground mb-6">Últimos 30 días</p>
                        <div className="space-y-4">
                            {TOP_PRODUCTS.map((p, i) => (
                                <div key={p.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                                            <span className="text-sm">{p.name}</span>
                                        </div>
                                        <span className={`text-xs font-semibold ${p.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                                            {p.change}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${p.revenue}%` }}
                                            transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                                            viewport={{ once: true }}
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
