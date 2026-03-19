"use client";
import { motion } from "framer-motion";
import { Layers, ChevronRight, Check, Filter, Search } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function CategoriesSection() {
    return (
        <section id="categorias" className="relative overflow-hidden">
            {/* ── Section A: Infinite Catalog Hierarchy ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Layers className="h-3 w-3" /> Arquitectura de Datos
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Catálogos sin <span className="text-violet-400">Escalas.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Organiza miles de productos con una estructura jerárquica infinita. Categorías, sub-categorías y etiquetas inteligentes para una navegación fluida.
                        </p>
                        <div className="space-y-4">
                            {[
                                { title: "Niveles Ilimitados", desc: "Crea taxonomías profundas para inventarios complejos." },
                                { title: "SEO Semántico", desc: "URLs amigables auto-generadas para cada nodo del catálogo." }
                            ].map((f, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <div className="h-6 w-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white tracking-tight">{f.title}</p>
                                        <p className="text-xs text-zinc-500 mt-1">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Layers className="h-32 w-32 text-violet-500" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            {[
                                { name: "ELECTRÓNICA", level: 0 },
                                { name: "SMARTPHONES", level: 1 },
                                { name: "ACCESORIOS", level: 2 },
                                { name: "CABLES & CARGA", level: 3 },
                                { name: "DEPORTES", level: 0 },
                                { name: "CALZADO", level: 1 },
                            ].map((c, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3"
                                    style={{ marginLeft: `${c.level * 24}px` }}
                                >
                                    <div className="h-8 px-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-violet-500/50 transition-colors flex-1 max-w-[280px]">
                                        <span className={`text-[10px] font-bold tracking-widest ${c.level === 0 ? "text-violet-400" : "text-zinc-500"}`}>{c.name}</span>
                                        <ChevronRight className="h-3 w-3 text-zinc-700" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Smart collections ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Filter className="h-5 w-5 text-emerald-400" />
                                </div>
                                <p className="text-sm font-bold text-white tracking-tight">Regla de Colección Inteligente</p>
                             </div>
                             <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">Si el stock es mayor que:</span>
                                    <span className="text-xs font-mono text-emerald-400">10 unidades</span>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">Y el tag incluye:</span>
                                    <span className="text-xs font-mono text-emerald-400">"Oferta_Verano"</span>
                                </div>
                                <div className="pt-4 border-t border-zinc-800 text-center">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-3">Resultado Dinámico</p>
                                    <div className="flex justify-center -space-x-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-zinc-800" />
                                        ))}
                                        <div className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">+12</div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Colecciones <span className="text-violet-400">Inteligentes.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Ahorra horas de trabajo manual. Crea reglas automáticas que agrupan productos por precio, stock, tags o proveedores.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {["Auto-Tagging", "Reglas Booleanas", "Actualización Real-time", "Sort Inteligente"].map(f => (
                                <div key={f} className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                                    <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">{f}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Navigation & UX ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Navegación <span className="text-violet-400">Premium.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Una buena arquitectura de categorías no sirve sin una buena interfaz. Nuestro sistema genera menús, migas de pan y filtros de búsqueda optimizados para conversión.
                        </p>
                        <div className="flex gap-6 items-center border-t border-zinc-800 pt-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white tracking-tighter">98%</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">UX Score</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white tracking-tighter">-15%</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Bounce Rate</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2">
                         <div className="rounded-3xl border border-zinc-800 p-8 bg-zinc-950 shadow-2xl relative">
                            <div className="flex items-center gap-8 mb-6 border-b border-zinc-900 pb-4">
                                <span className="text-xs font-bold text-white">HOME</span>
                                <span className="text-xs font-bold text-violet-400 border-b border-violet-400 pb-4 -mb-4">CATEGORÍAS</span>
                                <span className="text-xs font-bold text-zinc-600">OFERTAS</span>
                                <span className="text-xs font-bold text-zinc-600">AYUDA</span>
                            </div>
                            <div className="grid grid-cols-2 gap-8 py-4">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Destacados</p>
                                    <div className="space-y-3">
                                        <div className="h-3 w-full bg-zinc-900 rounded" />
                                        <div className="h-3 w-[80%] bg-zinc-900 rounded" />
                                        <div className="h-3 w-[60%] bg-zinc-900 rounded" />
                                    </div>
                                </div>
                                <div className="aspect-video bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center">
                                    <Search className="h-6 w-6 text-zinc-800" />
                                </div>
                            </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
