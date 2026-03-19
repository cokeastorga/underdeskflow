"use client";
import { motion } from "framer-motion";
import { Zap, Palette, CheckCircle2 } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function DesignSection() {
    return (
        <section id="diseno" className="relative overflow-hidden">
            {/* ── Section A: High-Performance Rendering Engine ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6 bg-zinc-950">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Zap className="h-3 w-3" /> Core Engine
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Velocidad que <span className="text-blue-400">Vende.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Nuestro motor de renderizado Quartz utiliza Zero-Runtime CSS y optimización automática de imágenes para entregar experiencias instantáneas en cualquier dispositivo.
                        </p>
                        <div className="flex items-center gap-8 border-t border-zinc-800 pt-8">
                            <div>
                                <p className="text-3xl font-bold text-white tracking-tighter">0.8s</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">LCP promedio</p>
                            </div>
                            <div className="h-10 w-px bg-zinc-800" />
                            <div>
                                <p className="text-3xl font-bold text-white tracking-tighter">100/100</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Lighthouse Score</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-1">
                        <div className="bg-zinc-950 rounded-[22px] overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
                            <div className="p-8 border-b border-zinc-900 flex items-center justify-between relative z-20">
                                <span className="text-xs font-mono text-zinc-500">Performance_Analyzer.log</span>
                                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            </div>
                            <div className="p-8 space-y-4 font-mono text-[11px] text-blue-400/60 relative z-20">
                                <p className="text-zinc-400">[info] Initializing Quartz Render Tree...</p>
                                <p>[success] Images optimized and served via CDN_Edge</p>
                                <p>[success] Critical CSS extracted in 14ms</p>
                                <p className="text-zinc-400">[info] Hydrating client components...</p>
                                <p className="text-white font-bold">[done] Page interactive in 340ms</p>
                            </div>
                            {/* Visual speed representation */}
                            <div className="h-32 relative overflow-hidden bg-zinc-900/20">
                                <motion.div 
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Visual Theme Builder ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first relative">
                         <div className="absolute -inset-4 bg-violet-500/5 rounded-3xl blur-2xl" />
                         <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl">
                            <div className="flex gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <Palette className="h-5 w-5 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white tracking-tight">Personalizador Visual</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Editando: Home Page</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Colores Base</p>
                                        <div className="flex gap-2">
                                            {['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'].map(c => (
                                                <div key={c} className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Tipografía</p>
                                        <p className="text-xs text-white font-bold tracking-tight">OUTFIT BOLD</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-300">Modo Dark Global</p>
                                        <p className="text-[10px] text-violet-400 font-bold mt-1">Status: Active</p>
                                    </div>
                                    <div className="h-5 w-10 rounded-full bg-violet-500 flex items-center justify-end px-1">
                                        <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>
                            </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Control Creativo <span className="text-violet-400">Total.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Sin código, sin límites. Ajusta cada pixel de tu storefront con nuestro constructor visual. Cambia paletas, fuentes y layouts en tiempo real.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Librería de componentes pre-diseñados",
                                "Previsualización responsive instantánea",
                                "Soporte para fuentes personalizadas",
                                "Sistema de diseño basado en tokens"
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 text-zinc-500">
                                    <CheckCircle2 className="h-4 w-4 text-violet-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Multi-Theme Architecture ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Múltiples Caras, <span className="text-violet-400">Una Infraestructura.</span></h3>
                        <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed">
                            Cambia el look de tu tienda según la temporada o evento sin afectar la lógica de negocio. Soporta múltiples temas por instancia para una versatilidad absoluta.
                        </p>
                    </motion.div>
                </div>

                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                    {[
                        { name: "Minimalist", style: "Clean & Sharp" },
                        { name: "Dark Mode", style: "Vanguard Tech" },
                        { name: "Modern Retail", style: "Vibrant Bold" }
                    ].map((t, i) => (
                        <motion.div 
                            key={t.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 transition-colors group"
                        >
                            <div className="h-1 w-full bg-zinc-800 rounded-full mb-6 overflow-hidden">
                                <motion.div 
                                    initial={{ x: '-100%' }} whileInView={{ x: '0%' }} transition={{ duration: 1, delay: i * 0.2 }}
                                    className="h-full bg-violet-400" 
                                />
                            </div>
                            <p className="text-white font-bold tracking-tight mb-2 group-hover:text-violet-400 transition-colors">{t.name}</p>
                            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{t.style}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
