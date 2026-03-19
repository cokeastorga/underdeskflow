"use client";
import { motion } from "framer-motion";
import { Package, BarChart2, Search, Check, Layers, ArrowUpRight, Plus } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function ProductsSection() {
    return (
        <section id="productos" className="relative overflow-hidden">
            {/* ── Section A: Advanced Catalog Management ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Package className="h-3 w-3" /> Core Commerce
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Catálogos sin <span className="text-emerald-400">Límites.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Gestiona miles de SKUs con una granularidad quirúrgica. Variantes dinámicas, atributos personalizados y metadatos extendidos para una flexibilidad absoluta.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "Multi-Variante", desc: "Talla, color, material y más en un solo flujo." },
                                { title: "Atributos Custom", desc: "Campos extra para especificaciones técnicas." }
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-sm font-bold text-white mb-1 tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-3">
                                <Search className="h-4 w-4 text-zinc-600" />
                                <span className="text-xs font-mono text-zinc-500">grep "SKU-2026" /products</span>
                             </div>
                             <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-emerald-400" />
                             </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: "MacBook Pro M3", price: "$2.490.000", stock: "14 units", status: "Active" },
                                { name: "iPhone 15 Pro", price: "$1.190.000", stock: "8 units", status: "Low Stock" },
                                { name: "Studio Display", price: "$1.890.000", stock: "0 units", status: "Out of Stock" },
                            ].map((p, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: 20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between hover:border-emerald-500/30 transition-colors"
                                >
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">{p.status}</p>
                                        <p className="text-sm font-bold text-white tracking-tight">{p.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono text-zinc-300">{p.price}</p>
                                        <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{p.stock}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Inventory Intelligence ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl">
                             <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <BarChart2 className="h-5 w-5 text-emerald-400" />
                                    <p className="text-sm font-bold text-white tracking-tight">Análisis de Stock Crítico</p>
                                </div>
                                <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 uppercase">Alert Active</div>
                             </div>
                             <div className="h-40 flex items-end gap-2 px-2">
                                {[30, 45, 60, 40, 30, 20, 15, 10].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`flex-1 rounded-t-lg ${i > 5 ? "bg-red-500/40" : "bg-emerald-500/40"}`}
                                    />
                                ))}
                             </div>
                             <div className="mt-8 pt-8 border-t border-zinc-800 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Rotación Mensual</p>
                                    <p className="text-lg font-bold text-white">+24.8%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Tiempo de Quiebre</p>
                                    <p className="text-lg font-bold text-red-400">4 Días</p>
                                </div>
                             </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Inteligencia de <span className="text-emerald-400">Inventario.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Anticípate a la demanda. Nuestro sistema analiza patrones de venta históricos para sugerir reposiciones y evitar quiebres de stock innecesarios.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Alertas de stock bajo configurables",
                                "Sincronización multi-canal en tiempo real",
                                "Proyección de demanda asistida",
                                "Historial de movimientos inmutable"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-500">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Batch Operations & performance ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Operaciones en <span className="text-emerald-400">Batch.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Actualiza miles de precios o stocks en segundos. Nuestra infraestructura soporta importaciones masivas y actualizaciones vía API con alta concurrencia.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex-1">
                                <p className="text-2xl font-bold text-white tracking-tighter">10k+</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">SKUs / Segundo</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex-1">
                                <p className="text-2xl font-bold text-white tracking-tighter">99.9%</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Success Rate</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Layers className="h-5 w-5 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Importador CSV/JSON</p>
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Process: #8921</p>
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "75%" }}
                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                    <span>Processing: items_import_Q1.csv</span>
                                    <span>75% Complete</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-4">
                                    <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                        <p className="text-xs text-zinc-500 mb-1">Success</p>
                                        <p className="text-sm font-bold text-emerald-400">750</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                        <p className="text-xs text-zinc-500 mb-1">Errors</p>
                                        <p className="text-sm font-bold text-red-500">0</p>
                                    </div>
                                </div>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
