"use client";
import { motion } from "framer-motion";
import { Truck, MapPin, Clock, Search, Check, ShieldCheck, Globe } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function ShippingSection() {
    return (
        <section id="envios" className="relative overflow-hidden">
            {/* ── Section A: Automated Logistics ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Truck className="h-3 w-3" /> Logística Avanzada
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Entregas en <span className="text-amber-400">Record.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Conecta tu tienda con los principales carriers en minutos. Automatiza la generación de etiquetas y ofrece tarifas dinámicas basadas en peso y zona.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Multi-Carrier", desc: "Starken, Chilexpress, Blue y más integrados." },
                                { title: "Etiquetado Auto", desc: "Generación masiva de etiquetas de envío." }
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-sm font-bold text-white mb-1 tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                             <div>
                                <p className="text-white font-bold tracking-tight">Consola de Despacho</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Status: Operational</p>
                             </div>
                             <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                             {[
                                { id: "SHP-2841", carrier: "Starken", dest: "Antofagasta", status: "In Transit" },
                                { id: "SHP-2840", carrier: "Blue Express", dest: "Santiago", status: "Processing" },
                                { id: "SHP-2839", carrier: "Chilexpress", dest: "Concepción", status: "Pickup Ready" },
                             ].map((s, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:border-amber-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                            {s.carrier.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono text-zinc-500">{s.id}</p>
                                            <p className="text-sm font-bold text-white">{s.dest}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{s.status}</p>
                                        <p className="text-xs text-zinc-600 font-medium">ETA: 48h</p>
                                    </div>
                                 </div>
                             ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Zone-Based Dispatch & Pricing ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-1">
                            <div className="bg-zinc-950 rounded-[22px] p-8 shadow-2xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <MapPin className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-tight">Tarificador dinámico por Zona</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-4">
                                        <span className="text-xs uppercase font-bold tracking-widest">Zona Central (RM)</span>
                                        <span className="text-sm font-mono text-amber-400">$2.990</span>
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-4">
                                        <span className="text-xs uppercase font-bold tracking-widest">Zona Extrema (Magallanes)</span>
                                        <span className="text-sm font-mono text-amber-400 font-bold">$12.450</span>
                                    </div>
                                    <div className="pt-4">
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                            <span className="text-xs text-emerald-400 font-medium">Regla: Envío gratis sobre $50k activada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Reglas de <span className="text-amber-400">Despacho.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Control absoluto sobre tus costos de envío. Crea zonas de precios, límites de peso y reglas de envío gratuito personalizadas por ciudad o región.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Tarifas dinámicas en tiempo real",
                                "Zonas de cobertura ilimitadas",
                                "Promociones de envío condicionales",
                                "Soporte para Retiro en Tienda (Pick-up)"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-500">
                                    <Check className="h-4 w-4 text-amber-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Real-Time Tracking UX ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Tracking en <span className="text-amber-400">Tiempo Real.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Mejora la experiencia post-venta. Provee a tus clientes de un portal de seguimiento detallado y notificaciones automáticas por cada cambio de estado.
                        </p>
                        <div className="flex gap-4">
                            <div className="text-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex-1">
                                <Clock className="h-6 w-6 text-amber-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Instant</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Updates</p>
                            </div>
                            <div className="text-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex-1">
                                <Globe className="h-6 w-6 text-amber-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Global</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Connectivity</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                         <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden">
                             <div className="flex items-center justify-between mb-8">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Tracking</span>
                                <span className="text-[10px] font-mono text-amber-400">#2940-STK</span>
                             </div>
                             <div className="space-y-8 relative">
                                {/* Vertical line */}
                                <div className="absolute left-1 top-2 bottom-2 w-px bg-zinc-800" />
                                {[
                                    { status: "Entregado", time: "14:20 PM", done: true },
                                    { status: "En Ruta de Entrega", time: "09:15 AM", done: true },
                                    { status: "En Centro de Distribución", time: "Yesterday", done: false },
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start relative z-10">
                                        <div className={`h-2.5 w-2.5 rounded-full ${step.done ? "bg-amber-400" : "bg-zinc-800"} ring-4 ring-zinc-950`} />
                                        <div>
                                            <p className={`text-sm font-bold ${step.done ? "text-white" : "text-zinc-600"}`}>{step.status}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-1">{step.time}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
