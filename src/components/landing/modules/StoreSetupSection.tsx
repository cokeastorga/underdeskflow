"use client";
import { motion } from "framer-motion";
import { Check, Globe, Store, Settings } from "lucide-react";

const WIZARD_STEPS = [
    { step: 1, title: "Nombre & Branding", done: true },
    { step: 2, title: "Tu dominio", done: true },
    { step: 3, title: "Método de pago", done: false, active: true },
    { step: 4, title: "Primer producto", done: false },
    { step: 5, title: "¡Publicar!", done: false },
];

const STORE_TYPES = [
    "Ropa & Moda", "Electrónica", "Hogar & Deco", "Alimentos",
    "Belleza", "Deportes", "Arte", "Mascotas"
];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function StoreSetupSection() {
    return (
        <section id="tienda" className="relative overflow-hidden">

            {/* ── Section A: Module intro with animated background ── */}
            <div className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-blue-950/10 to-background py-28 px-6">
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-64 -left-64 w-[600px] h-[600px] border border-primary/5 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: [360, 0] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-64 -right-64 w-[800px] h-[800px] border border-blue-500/5 rounded-full"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Store className="h-3.5 w-3.5" /> Módulo 1
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Tu tienda lista en{" "}
                            <span className="text-gradient">20 minutos.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Nuestro wizard de configuración te guía paso a paso: nombre, dominio, pagos, primer producto. Sin conocimientos técnicos.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="space-y-3">
                            {["Dominio propio (.cl o el tuyo)", "SEO integrado desde el día 1", "Compatible con todos los dispositivos", "Soporte en español 24/7"].map(f => (
                                <div key={f} className="flex items-center gap-3 text-muted-foreground">
                                    <div className="h-5 w-5 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-blue-400" />
                                    </div>
                                    <span className="text-sm">{f}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Wizard UI mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/6 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Configura tu tienda</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Paso 3 de 5</p>
                            </div>
                            <div className="flex gap-1">
                                {WIZARD_STEPS.map(s => (
                                    <motion.div key={s.step}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: s.step * 0.1 }}
                                        viewport={{ once: true }}
                                        className={`h-2 rounded-full transition-all duration-500 ${s.done ? "w-5 bg-blue-500" : s.active ? "w-8 bg-primary" : "w-2 bg-muted"}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Nombre de tu tienda</label>
                                <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-4 text-sm text-foreground/80">
                                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                        Mi Tienda Premium ▮
                                    </motion.span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Sitio web</label>
                                <div className="h-10 rounded-xl bg-muted/50 border border-border flex items-center px-4 text-sm gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">https://</span>
                                    <span className="text-foreground">mitienda.enterpriseos.cl</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block font-medium">Categoría principal</label>
                                <div className="flex flex-wrap gap-2">
                                    {STORE_TYPES.map((t, i) => (
                                        <motion.button key={t}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.05 }}
                                            viewport={{ once: true }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${i === 0 ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted border-border text-muted-foreground hover:text-foreground"}`}>
                                            {t}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 mt-2">
                                Continuar →
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Store preview showcase ── */}
            <div className="relative py-28 px-6 border-t border-white/5 bg-muted/10">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-14">
                        <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Vista previa en tiempo real</p>
                        <h3 className="text-4xl font-bold font-serif">Así queda tu tienda desde el primer día</h3>
                    </motion.div>

                    {/* Store preview mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                        {/* Browser bar */}
                        <div className="bg-muted/40 border-b border-white/8 px-5 py-3 flex items-center gap-3">
                            <div className="flex gap-1.5"><div className="h-3 w-3 rounded-full bg-red-400/70" /><div className="h-3 w-3 rounded-full bg-yellow-400/70" /><div className="h-3 w-3 rounded-full bg-green-400/70" /></div>
                            <div className="flex-1 mx-4 h-6 rounded-lg bg-white/5 border border-white/8 flex items-center px-3 gap-2">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">https://mitienda.enterpriseos.cl</span>
                            </div>
                        </div>
                        {/* Store homepage mock */}
                        <div className="bg-white dark:bg-gray-950">
                            {/* Store header */}
                            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="font-bold text-lg text-gray-900 dark:text-white">Mi Tienda Premium</div>
                                <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                                    {["Inicio", "Catálogo", "Ofertas", "Contacto"].map(l => <span key={l} className="hover:text-gray-900 cursor-pointer">{l}</span>)}
                                </div>
                            </div>
                            {/* Hero banner */}
                            <div className="relative h-48 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden flex items-center px-10">
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgb(99 102 241), transparent 60%)" }} />
                                <div className="relative z-10">
                                    <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Nueva Colección</p>
                                    <h2 className="text-3xl font-bold text-white font-serif">Verano 2026</h2>
                                    <button className="mt-3 px-5 py-2 rounded-xl bg-white text-gray-900 text-sm font-semibold">Ver Catálogo</button>
                                </div>
                            </div>
                            {/* Featured products */}
                            <div className="p-6">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-4">Productos destacados</p>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { name: "Polera Premium", price: "$24.990", badge: "Nuevo" },
                                        { name: "Jeans Slim", price: "$54.990", badge: null },
                                        { name: "Zapatillas Air", price: "$89.990", badge: "Oferta" },
                                        { name: "Bolso Cuero", price: "$39.990", badge: "Top" },
                                    ].map((p, i) => (
                                        <motion.div key={p.name}
                                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }} viewport={{ once: true }}
                                            className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                            <div className="h-28 relative flex items-center justify-center"
                                                style={{ background: `hsl(${200 + i * 30}, 50%, ${i % 2 === 0 ? "15%" : "12%"})` }}>
                                                <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-sm" />
                                                {p.badge && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-bold">{p.badge}</span>}
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs font-medium text-gray-900 dark:text-white">{p.name}</p>
                                                <p className="text-xs text-primary font-bold mt-1">{p.price}</p>
                                            </div>
                                        </motion.div>
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
