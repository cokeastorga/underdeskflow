"use client";
import { motion } from "framer-motion";
import { Check, Globe, Store, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            {/* ── Section A: Platform & Global Infrastructure ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Store className="h-3 w-3" /> Infraestructura Global
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Despliegue <span className="text-violet-400">Instatáneo.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Tu instancia de comercio se despliega en el Edge de Vercel en milisegundos. Conectividad global, baja latencia y alta disponibilidad desde el primer segundo.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Edge Native", desc: "Resolución de peticiones en el nodo más cercano al cliente." },
                                { title: "Auto-Escalado", desc: "Soporte para picos de tráfico sin configuraciones manuales." }
                            ].map((item, i) => (
                                <div key={item.title} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 shadow-xl">
                                    <h4 className="text-white font-bold mb-2 tracking-tight">{item.title}</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="relative h-[500px] rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Status Map</span>
                                <div className="flex gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[8px] font-bold text-emerald-400 uppercase">Operational</span>
                                </div>
                            </div>
                            <div className="flex-1 relative flex items-center justify-center">
                                {/* Simple abstract map representation */}
                                <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <motion.div 
                                        key={i}
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                                        transition={{ duration: 2 + i % 3, repeat: Infinity, delay: i * 0.2 }}
                                        className="absolute h-2 w-2 rounded-full bg-violet-400"
                                        style={{ 
                                            left: `${15 + (i * 27) % 70}%`, 
                                            top: `${20 + (i * 31) % 60}%`,
                                            boxShadow: '0 0 15px rgba(167, 139, 250, 0.5)'
                                        }}
                                    />
                                ))}
                                <div className="absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                {['SFO', 'IAD', 'LHR'].map(region => (
                                    <div key={region} className="text-center">
                                        <p className="text-[10px] font-mono text-zinc-600 mb-1">{region}</p>
                                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 1, delay: 0.5 }}
                                                className="h-full bg-violet-500/40" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Intelligent Setup Wizard ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden order-last lg:order-first">
                        <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-white tracking-tight">Launcher v2.4</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest mt-1">Configuración de Instancia</p>
                            </div>
                            <div className="flex gap-1.5">
                                {WIZARD_STEPS.map(s => (
                                    <div key={s.step} className={`h-1.5 rounded-full transition-all duration-500 ${s.done ? "w-6 bg-violet-500" : s.active ? "w-10 bg-white" : "w-1.5 bg-zinc-800"}`} />
                                ))}
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2 block">Identidad Corporativa</label>
                                    <p className="text-sm text-zinc-300 font-mono">Mi Marca Premium <span className="animate-pulse">_</span></p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2 block">Dominio de Acceso</label>
                                    <p className="text-sm text-zinc-400 font-mono">https://<span className="text-white">brand.enterprise.os</span></p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {STORE_TYPES.map((t, i) => (
                                    <span key={t} className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${i === 0 ? "bg-violet-500/10 border-violet-500/30 text-violet-400" : "bg-zinc-800/50 border-zinc-700 text-zinc-500"}`}>
                                        {t.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                            <Button className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">
                                Validar y Ejecutar Despliegue
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Configuración sin <span className="text-violet-400">fricción.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-8 font-light">
                            Un flujo inteligente que orquestra el aprovisionamiento de bases de datos, almacenamiento y certificados SSL de forma automática.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Aprovisionamiento de base de datos aislada",
                                "Configuración de CDN global automática",
                                "Integración de pasarela de pago en un clic",
                                "Optimización SEO baseline pre-configurada"
                            ].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-500">
                                    <div className="h-5 w-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-violet-400" />
                                    </div>
                                    <span className="text-sm font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Multi-tenant Data Isolation Power ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Aislamiento por <span className="text-violet-400">Diseño.</span></h3>
                        <p className="text-lg text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed">
                            No compartimos datos. Nuestra arquitectura de multi-tenencia asegura que cada store sea un silo virtual inquebrantable, blindado contra acceso cruzado.
                        </p>
                    </motion.div>
                </div>

                <div className="max-w-5xl mx-auto relative h-[300px] flex items-center justify-between">
                    <div className="absolute inset-0 bg-zinc-900/20 border border-zinc-800 rounded-3xl" />
                    {[1, 2, 3].map(i => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.2 }}
                            viewport={{ once: true }}
                            className="relative z-10 w-full max-w-[200px] mx-4 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col items-center gap-4"
                        >
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <Settings className={`h-6 w-6 text-violet-400 ${i === 2 ? "animate-spin-slow" : ""}`} />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Instance 00{i}</p>
                                <p className="text-xs font-mono text-violet-400/80">Encrypted Silo</p>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500/40 w-full" />
                            </div>
                        </motion.div>
                    ))}
                    {/* Connection lines (abstract) */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent pointer-events-none" />
                </div>
            </div>
        </section>
    );
}
