"use client";
import { motion } from "framer-motion";
import { Users, Star, Tag, MessageCircle, ShieldCheck, History, Target } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function CrmSection() {
    return (
        <section id="crm" className="relative overflow-hidden">
            {/* ── Section A: 360° Customer Identity ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Users className="h-3 w-3" /> Relationship Management
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Identidad del <span className="text-rose-400">Cliente.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Construye perfiles profundos. Unifica historial de compras, preferencias y comportamiento en una sola fuente de verdad para cada cliente.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Perfil 360", desc: "Historial completo de interacciones." },
                                { title: "LTV Tracking", desc: "Valor de vida del cliente en tiempo real." }
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-sm font-bold text-white mb-1 tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                         <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">JD</div>
                            <div>
                                <p className="text-white font-bold tracking-tight">John Doe</p>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">VIP Customer</p>
                            </div>
                            <div className="ml-auto flex -space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-900 bg-zinc-800" />)}
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <History className="h-3.5 w-3.5 text-rose-400" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Activity</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Purchase: Air Max 2026</span>
                                        <span className="text-zinc-600 font-mono">2h ago</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Subscription: Pro Tier</span>
                                        <span className="text-zinc-600 font-mono">Yesterday</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Total Spent</p>
                                    <p className="text-sm font-bold text-white font-mono">$1.240.000</p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Orders</p>
                                    <p className="text-sm font-bold text-white font-mono">42 Units</p>
                                </div>
                            </div>
                         </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Automated Segmentation ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <Tag className="h-5 w-5 text-rose-400" />
                                <p className="text-sm font-bold text-white tracking-tight">Smart Segmentation Engine</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "VIP Tier", val: "284", color: "text-rose-400" },
                                    { label: "At Risk", val: "124", color: "text-amber-400" },
                                    { label: "New Leads", val: "942", color: "text-emerald-400" },
                                    { label: "Churned", val: "48", color: "text-zinc-600" },
                                ].map((s, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                                        <p className="text-2xl font-bold text-white tracking-tighter">{s.val}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${s.color}`}>{s.label}</p>
                                    </div>
                                ))}
                             </div>
                             <div className="mt-6 pt-6 border-t border-zinc-800">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                                    <ShieldCheck className="h-3 w-3 text-rose-400" />
                                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">GDPR & Data Privacy Compliant</span>
                                </div>
                             </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Segmentación <span className="text-rose-400">Automática.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            No todos los clientes son iguales. Agrupa automáticamente a tus usuarios por comportamiento, valor de compra o riesgo de abandono y actúa de forma personalizada.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Segmentos dinámicos basados en RFM",
                                "Filtros complejos multi-variable",
                                "Etiquetado automático de perfiles",
                                "Exportación de audiencias sync-meta"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-500">
                                    <Star className="h-4 w-4 text-rose-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Retention Workflows ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Workflows de <span className="text-rose-400">Fidelización.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Transforma compradores ocasionales en fans leales. Automatiza correos de agradecimiento, ofertas de cumpleaños y campañas de recuperación de carritos.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <MessageCircle className="h-6 w-6 text-rose-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Automated</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Campaigns</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <Target className="h-6 w-6 text-rose-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Hyper</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Targeted</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden">
                             <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Workflow Builder</span>
                                <div className="px-2 py-0.5 rounded bg-rose-500/10 text-[8px] font-bold text-rose-400 uppercase tracking-widest">Running</div>
                             </div>
                             <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <Users className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <div className="h-px flex-1 bg-zinc-800" />
                                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                        <MessageCircle className="h-4 w-4 text-rose-400" />
                                    </div>
                                    <div className="h-px flex-1 bg-zinc-800" />
                                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                        <Star className="h-4 w-4 text-zinc-500" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                                    <p className="text-xs text-zinc-400 italic">"If Customer spent {'>'} $100k, then send VIP Thank You Email"</p>
                                </div>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
