"use client";
import { motion } from "framer-motion";
import { Megaphone, Gift, Mail, TrendingUp, Search, Zap, Check } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function MarketingSection() {
    return (
        <section id="marketing" className="relative overflow-hidden">
            {/* ── Section A: High-Convert Couponing ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Megaphone className="h-3 w-3" /> Growth Engine
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Marketing que <span className="text-orange-400">Escala.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Convierte más con herramientas de lealtad integradas. Cupones de un solo uso, descuentos dinámicos y campañas de email que realmente llegan al inbox.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Cupones 2.0", desc: "Reglas complejas y uso limitado." },
                                { title: "Loyalty Hooks", desc: "Sistemas de recompensa por compra." }
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-sm font-bold text-white mb-1 tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                         <div className="flex items-center gap-3 mb-8">
                            <Gift className="h-5 w-5 text-orange-400" />
                            <p className="text-sm font-bold text-white tracking-tight">Enterprise Coupon Builder</p>
                         </div>
                         <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-2">Coupon Code</p>
                                <div className="h-10 px-4 rounded-lg bg-orange-500/5 border border-orange-500/30 flex items-center justify-between">
                                    <span className="text-sm font-mono font-bold text-orange-400 tracking-widest uppercase">BLACK_FRIDAY_26</span>
                                    <Zap className="h-3 w-3 text-orange-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Discount</p>
                                    <p className="text-sm font-bold text-white font-mono">-25% OFF</p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Limit</p>
                                    <p className="text-sm font-bold text-white font-mono">1.000 Uses</p>
                                </div>
                            </div>
                         </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Automated Growth Engine ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <Search className="h-5 w-5 text-orange-400" />
                                <p className="text-sm font-bold text-white tracking-tight">Active SEO Automation</p>
                             </div>
                             <div className="space-y-4">
                                {[
                                    { page: "Home Page", seo: "98/100", status: "Optimized" },
                                    { page: "Product: Air Max", seo: "95/100", status: "Optimized" },
                                    { page: "Category: Shoes", seo: "92/100", status: "Synching" },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                        <div>
                                            <p className="text-xs font-bold text-white">{p.page}</p>
                                            <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">SEO Score: {p.seo}</p>
                                        </div>
                                        <div className={`h-2 w-2 rounded-full ${p.status === "Optimized" ? "bg-emerald-400" : "bg-orange-400 animate-pulse"}`} />
                                    </div>
                                ))}
                             </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            SEO & Tráfico <span className="text-orange-400">Automático.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            No dependas solo de anuncios. Generamos sitemaps, metadatos dinámicos y esquemas JSON-LD automáticamente para que Google ame tu tienda desde el primer día.
                        </p>
                        <div className="space-y-4 font-light text-zinc-500">
                             {[
                                "Generación de Meta-Tags dinámica",
                                "Sitemaps auto-actualizables",
                                "Compresión de imágenes inteligente",
                                "UTM Tagging para cada campaña"
                             ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Check className="h-4 w-4 text-orange-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </div>
                             ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Campaign Performance ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">ROI & Atribución <span className="text-orange-400">Clara.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Mide el éxito real de tus campañas. Nuestro sistema de atribución te dice exactamente de dónde vienen tus ventas y cuál es el retorno de tu inversión en marketing.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <TrendingUp className="h-6 w-6 text-orange-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">12.4x</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Avg. ROAS</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <Mail className="h-6 w-6 text-orange-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">48%</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Open Rate</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                        <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl relative">
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Campaign: #FALL_PROMO_24</p>
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-bold text-white tracking-tighter">$2.840.000 <span className="text-xs text-zinc-600">Revenue</span></p>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full mt-3 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "82%" }}
                                            transition={{ duration: 1 }}
                                            className="h-full bg-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    <span>Conversions: 142</span>
                                    <span className="text-right">CPA: $4.200</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
