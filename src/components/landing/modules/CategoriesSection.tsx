"use client";
import { motion } from "framer-motion";
import { LayoutGrid, ChevronRight, SlidersHorizontal, Folder } from "lucide-react";

const CATEGORIES = [
    { name: "Ropa Mujer", count: 142, children: ["Vestidos", "Blusas", "Pantalones"] },
    { name: "Ropa Hombre", count: 98, children: ["Poleras", "Jeans", "Chaquetas"] },
    { name: "Accesorios", count: 64, children: ["Bolsos", "Gafas", "Joyería"] },
    { name: "Calzado", count: 51, children: ["Zapatillas", "Botas", "Sandalias"] },
];

const FILTERS = [
    { label: "Precio", type: "range", values: ["$0", "$100K"], active: true },
    { label: "Talla", type: "multi", values: ["XS", "S", "M", "L", "XL"], active: false },
    { label: "Color", type: "color", values: ["#1e293b", "#7f1d1d", "#14532d", "#4c1d95"], active: false },
    { label: "Disponibilidad", type: "bool", values: ["Solo en stock"], active: true },
];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function CategoriesSection() {
    return (
        <section id="categorias" className="relative overflow-hidden">

            {/* ── Section A: Category tree ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-br from-teal-950/10 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-1/4 left-0 w-[500px] h-[400px] bg-teal-500/5 rounded-full blur-[140px]" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <LayoutGrid className="h-3.5 w-3.5" /> Módulo 9 · Categorías
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Organiza tu<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">catálogo.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Árbol de categorías ilimitado, filtros avanzados por atributos y colecciones automáticas basadas en reglas.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="flex flex-wrap gap-3">
                            {["Categorías anidadas", "Colecciones automáticas", "Ordenamiento custom", "Filtros por atributo", "SEO por categoría"].map(f => (
                                <span key={f} className="px-3 py-1.5 rounded-xl bg-teal-500/8 border border-teal-500/20 text-teal-400 text-xs font-medium">{f}</span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Category tree mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-3 p-5 border-b border-white/6">
                            <Folder className="h-4 w-4 text-teal-400" />
                            <span className="font-semibold text-sm">Árbol de Categorías</span>
                            <button className="ml-auto text-xs text-teal-400 font-medium">+ Nueva</button>
                        </div>
                        <div className="p-4 space-y-1">
                            {CATEGORIES.map((cat, i) => (
                                <div key={cat.name}>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 cursor-pointer group">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-400 transition-colors" />
                                        <LayoutGrid className="h-4 w-4 text-teal-400/60" />
                                        <span className="text-sm font-medium flex-1">{cat.name}</span>
                                        <span className="text-xs text-muted-foreground">{cat.count} productos</span>
                                    </motion.div>
                                    <div className="ml-10 space-y-0.5">
                                        {cat.children.map((child, j) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -5 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 + i * 0.1 + j * 0.06 }}
                                                viewport={{ once: true }}
                                                key={child}
                                                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/3 cursor-pointer">
                                                <div className="h-px w-3 bg-border" />
                                                <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">{child}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/6 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">4 categorías · 355 productos</span>
                            <button className="text-xs text-teal-400 font-medium hover:underline">Reordenar</button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Filter builder ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/5">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-12">
                        <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-3">Filtros Avanzados</p>
                        <h3 className="text-4xl font-bold font-serif">Tus clientes encuentran lo que buscan</h3>
                    </motion.div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div {...fdUp(0)} className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <SlidersHorizontal className="h-4 w-4 text-teal-400" />
                                <p className="font-semibold text-sm">Opciones de filtro</p>
                            </div>
                            <div className="space-y-4">
                                {FILTERS.map((f, i) => (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + i * 0.1 }}
                                        viewport={{ once: true }}
                                        key={f.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/6">
                                        <div>
                                            <p className="text-sm font-medium">{f.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {f.type === "range" ? `${f.values[0]} — ${f.values[1]}` :
                                                    f.type === "multi" ? f.values.join(", ") :
                                                        f.type === "color" ? "Selector de color" :
                                                            f.values[0]}
                                            </p>
                                        </div>
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            className={`h-6 w-11 rounded-full border-2 flex items-center px-0.5 transition-all duration-300 cursor-pointer ${f.active ? "bg-teal-500 border-teal-500" : "bg-muted border-muted-foreground/30"}`}>
                                            <motion.div
                                                animate={{ x: f.active ? 20 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="h-4 w-4 bg-white rounded-full shadow-sm"
                                            />
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                        {/* Filter preview */}
                        <motion.div {...fdUp(1)} className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-6">
                            <p className="font-semibold text-sm mb-5">Vista previa filtros en tienda</p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Precio</p>
                                    <div className="relative h-2 bg-muted rounded-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "70%" }}
                                            transition={{ delay: 0.5, duration: 0.8 }}
                                            viewport={{ once: true }}
                                            className="absolute left-0 h-full bg-teal-500 rounded-full"
                                        />
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full border-2 border-teal-500 shadow-md" />
                                        <div className="absolute left-[70%] top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full border-2 border-teal-500 shadow-md" />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                        <span>$0</span><span>$70.000</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Disponibilidad</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded border-2 border-teal-500 bg-teal-500 flex items-center justify-center">
                                            <div className="h-2 w-2 bg-white rounded-sm" />
                                        </div>
                                        <span className="text-sm">Solo con stock</span>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-white/6">
                                    <p className="text-xs text-muted-foreground mb-2">Resultados</p>
                                    <div className="flex items-center justify-between">
                                        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                                            className="font-bold text-teal-400 text-lg">84 productos</motion.p>
                                        <button className="text-xs text-muted-foreground underline">Limpiar filtros</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
