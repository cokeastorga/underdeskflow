"use client";
import { motion } from "framer-motion";
import { Palette, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

const PALETTES = [
    { name: "Ocean", colors: ["#0f172a", "#1e3a5f", "#3b82f6", "#e0f2fe"] },
    { name: "Forest", colors: ["#052e16", "#14532d", "#22c55e", "#f0fdf4"] },
    { name: "Rose", colors: ["#2d0a0a", "#450a0a", "#ef4444", "#fff1f2"] },
    { name: "Amber", colors: ["#1c1007", "#431407", "#f59e0b", "#fffbeb"] },
    { name: "Violet", colors: ["#2e1065", "#4c1d95", "#8b5cf6", "#f5f3ff"] },
];

const FONTS = ["Inter", "Playfair Display", "Space Grotesk", "Poppins", "Montserrat"];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function DesignSection() {
    const [selectedPalette, setSelectedPalette] = useState(0);
    const [isDark, setIsDark] = useState(true);

    const palette = PALETTES[selectedPalette];

    return (
        <section id="diseno" className="relative overflow-hidden">

            {/* ── Section A: Theme editor ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-bl from-violet-950/15 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[140px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[120px]" />
                    {/* Decorative mesh grid */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: "linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)",
                            backgroundSize: "40px 40px"
                        }} />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    {/* Design editor mock */}
                    <motion.div {...fdUp(0)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden order-2 lg:order-1">
                        <div className="flex items-center justify-between p-5 border-b border-white/6">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-violet-400" />
                                <span className="font-semibold text-sm">Editor de Diseño</span>
                            </div>
                            <button onClick={() => setIsDark(d => !d)}
                                className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                            </button>
                        </div>

                        <div className="flex">
                            {/* Sidebar controls */}
                            <div className="w-52 border-r border-white/6 p-4 space-y-5">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Paleta</p>
                                    <div className="space-y-2">
                                        {PALETTES.map((p, i) => (
                                            <button key={p.name} onClick={() => setSelectedPalette(i)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedPalette === i ? "bg-violet-500/15 border border-violet-500/30" : "hover:bg-muted/50"}`}>
                                                <div className="flex gap-1">
                                                    {p.colors.map((c, j) => (
                                                        <div key={j} className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tipografía</p>
                                    <div className="space-y-1.5">
                                        {FONTS.map((f, i) => (
                                            <button key={f}
                                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${i === 0 ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className="flex-1 p-3">
                                <motion.div
                                    animate={{ backgroundColor: palette.colors[0] }}
                                    transition={{ duration: 0.6 }}
                                    className="rounded-xl h-full min-h-[280px] overflow-hidden relative">
                                    {/* Preview store header */}
                                    <div className="flex items-center justify-between px-4 py-3"
                                        style={{ borderBottom: `1px solid ${palette.colors[1]}40` }}>
                                        <motion.span animate={{ color: palette.colors[3] }} transition={{ duration: 0.6 }}
                                            className="font-bold text-sm">Mi Tienda</motion.span>
                                        <div className="flex gap-3 text-[10px]" style={{ color: palette.colors[3] + "80" }}>
                                            <span>Inicio</span><span>Catálogo</span><span>Contacto</span>
                                        </div>
                                    </div>
                                    {/* Preview hero */}
                                    <motion.div
                                        animate={{ backgroundColor: palette.colors[1] }}
                                        transition={{ duration: 0.6 }}
                                        className="h-24 flex items-center px-5">
                                        <div>
                                            <motion.div animate={{ backgroundColor: palette.colors[2] }} transition={{ duration: 0.6 }}
                                                className="h-2 w-20 rounded-full mb-2" />
                                            <motion.div animate={{ backgroundColor: palette.colors[3] }} transition={{ duration: 0.6 }}
                                                className="h-3 w-32 rounded-full mb-3" />
                                            <motion.div animate={{ backgroundColor: palette.colors[2] }} transition={{ duration: 0.6 }}
                                                className="h-6 w-20 rounded-lg" />
                                        </div>
                                    </motion.div>
                                    {/* Preview products */}
                                    <div className="grid grid-cols-3 gap-2 p-3">
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i}
                                                animate={{ borderColor: palette.colors[1] + "60" }}
                                                transition={{ duration: 0.6 }}
                                                className="rounded-lg border overflow-hidden">
                                                <motion.div animate={{ backgroundColor: palette.colors[1] }} transition={{ duration: 0.6 }}
                                                    className="h-16" />
                                                <div className="p-1.5" style={{ backgroundColor: palette.colors[0] }}>
                                                    <motion.div animate={{ backgroundColor: palette.colors[3] + "80" }} transition={{ duration: 0.6 }}
                                                        className="h-1.5 w-3/4 rounded-full mb-1" />
                                                    <motion.div animate={{ backgroundColor: palette.colors[2] }} transition={{ duration: 0.6 }}
                                                        className="h-1.5 w-1/2 rounded-full" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="order-1 lg:order-2">
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Palette className="h-3.5 w-3.5" /> Módulo 2
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Diseño que<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400">enamora.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Editor visual en tiempo real. Cambia colores, fuentes y layouts con un clic — sin tocar código. Ve los cambios al instante.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Palette, label: "Paletas predefinidas", value: "50+" },
                                { icon: Monitor, label: "Layouts de tienda", value: "12" },
                            ].map(item => (
                                <div key={item.label} className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/15 text-center">
                                    <item.icon className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                                    <p className="text-2xl font-bold">{item.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── Section B: Template gallery ── */}
            <div className="py-24 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-12">
                        <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-3">Templates</p>
                        <h3 className="text-4xl font-bold font-serif">Empieza desde una plantilla premium</h3>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Minimal", desc: "Limpio y elegante", bg: "from-gray-900 to-gray-800", accent: "#e5e7eb" },
                            { name: "Luxury", desc: "Premium & sofisticado", bg: "from-yellow-950 to-amber-950", accent: "#fbbf24" },
                            { name: "Bold", desc: "Vibrante & moderno", bg: "from-indigo-950 to-violet-950", accent: "#818cf8" },
                        ].map((t, i) => (
                            <motion.div key={t.name} {...fdUp(i * 0.15)}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="group cursor-pointer rounded-2xl overflow-hidden border border-white/8 shadow-xl">
                                <div className={`h-48 bg-gradient-to-br ${t.bg} relative overflow-hidden`}>
                                    {/* Template preview skeleton */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-3 w-16 rounded-full" style={{ backgroundColor: t.accent + "60" }} />
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(n => <div key={n} className="h-2 w-8 rounded-full" style={{ backgroundColor: t.accent + "40" }} />)}
                                            </div>
                                        </div>
                                        <div className="h-20 rounded-xl mb-3" style={{ backgroundColor: t.accent + "15", border: `1px solid ${t.accent}20` }} />
                                        <div className="grid grid-cols-3 gap-2">
                                            {[1, 2, 3].map(n => (
                                                <div key={n} className="h-16 rounded-lg" style={{ backgroundColor: t.accent + "10", border: `1px solid ${t.accent}15` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                        <span className="text-sm font-semibold text-white px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">Usar plantilla</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-card border-t border-white/6">
                                    <p className="font-semibold">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
