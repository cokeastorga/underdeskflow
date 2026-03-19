"use client";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Users, DollarSign, Target, PieChart } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function AnalyticsSection() {
    return (
        <section id="analytics" className="relative overflow-hidden">
            {/* ── Section A: Business Intelligence Engine ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <BarChart2 className="h-3 w-3" /> Data & Intelligence
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Datos que <span className="text-indigo-400">Deciden.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Dashboards financieros de alta fidelidad. Monitorea GMV, Ticket Promedio y Cohortes de Retención en tiempo real con una precisión del 99.9%.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                                <DollarSign className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white tracking-tighter">$48M+</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">GMV Procesado</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                                <TrendingUp className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white tracking-tighter">+34%</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Growth YoY</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                         <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time GMV Pulse</span>
                            <div className="flex gap-2">
                                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                <div className="h-2 w-2 rounded-full bg-zinc-800" />
                            </div>
                         </div>
                         <div className="relative h-48 flex items-end justify-between gap-1">
                            {[40, 60, 45, 80, 55, 90, 70, 85, 100].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${h}%` }}
                                    transition={{ duration: 1.2, delay: i * 0.1 }}
                                    className="flex-1 bg-gradient-to-t from-indigo-500/10 to-indigo-400/80 rounded-t-sm relative group-hover:to-indigo-300 transition-colors"
                                />
                            ))}
                         </div>
                         <div className="mt-8 flex justify-between">
                             <div>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Current Session</p>
                                <p className="text-xl font-bold text-white">$4.2M</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Projection</p>
                                <p className="text-xl font-bold text-indigo-400">$5.8M</p>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Conversion Funnels ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <Target className="h-5 w-5 text-indigo-400" />
                                <p className="text-sm font-bold text-white tracking-tight">Conversion Funnel Analyzer</p>
                             </div>
                             <div className="space-y-6">
                                {[
                                    { label: "Visits", val: "100%", w: "100%" },
                                    { label: "Prod. View", val: "64%", w: "64%" },
                                    { label: "Add to Cart", val: "12%", w: "12%" },
                                    { label: "Checkout", val: "4.8%", w: "4.8%" },
                                ].map((s, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            <span>{s.label}</span>
                                            <span>{s.val}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: s.w }}
                                                transition={{ duration: 1, delay: i * 0.2 }}
                                                className="h-full bg-indigo-500/60"
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Embudos de <span className="text-indigo-400">Conversión.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Visualiza cada etapa del viaje del cliente. Identifica drop-offs críticos y optimiza la experiencia de compra basándote en el comportamiento real de tus usuarios.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { title: "Heatmaps", desc: "Zonas de calor por dispositivo." },
                                { title: "A/B Testing", desc: "Valida cambios con datos reales." }
                            ].map((f, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-sm font-bold text-white tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-600 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Forecasting & Projections ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Predicciones <span className="text-indigo-400">Predictivas.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Nuestra IA de datos proyecta tus ventas mensuales y sugiere stock basado en estacionalidad. Convierte la incertidumbre en estrategia ejecutable.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex-1">
                                <p className="text-2xl font-bold text-white tracking-tighter">94%</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Accuracy Rate</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <PieChart className="h-6 w-6 text-indigo-400 mx-auto" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative">
                            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-20">
                                <TrendingUp className="h-32 w-32 text-indigo-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-2">Growth Forecast Q4</p>
                                <p className="text-3xl font-bold text-white tracking-tighter mb-8">$12.4M Estimated</p>
                                <div className="space-y-4">
                                    {[
                                        { label: "Optimistic Case", val: "+42%", color: "text-emerald-400" },
                                        { label: "Baseline Case", val: "+28%", color: "text-indigo-400" },
                                        { label: "Conservative Case", val: "+14%", color: "text-amber-400" },
                                    ].map((c, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                                            <span className="text-xs text-zinc-400">{c.label}</span>
                                            <span className={`text-sm font-bold ${c.color}`}>{c.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
