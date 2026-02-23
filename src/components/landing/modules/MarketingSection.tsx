"use client";
import { motion } from "framer-motion";
import { Megaphone, Gift, Mail, TrendingUp } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function MarketingSection() {
    return (
        <section id="marketing" className="relative overflow-hidden">
            {/* ── Section A: Coupon builder ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-bl from-orange-950/10 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
                </div>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Megaphone className="h-3.5 w-3.5" /> Módulo 8 · Marketing
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Marketing que<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">vende solo.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Cupones, descuentos automáticos, email marketing y campañas segmentadas. Todo integrado, sin herramientas externas.
                        </motion.p>
                        <motion.div {...fdUp(3)} className="space-y-3">
                            {[
                                { icon: Gift, label: "Cupones & Descuentos", desc: "Por porcentaje, monto fijo o 2×1" },
                                { icon: Mail, label: "Email Marketing", desc: "Automatizaciones de carrito abandonado" },
                                { icon: TrendingUp, label: "UTM & Conversiones", desc: "Trackea cada campaña en detalle" },
                            ].map(f => (
                                <div key={f.label} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15">
                                    <div className="h-9 w-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                                        <f.icon className="h-4 w-4 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{f.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Coupon builder mock */}
                    <motion.div {...fdUp(1)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Gift className="h-5 w-5 text-orange-400" />
                            <span className="font-semibold">Crear Cupón</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Código de cupón</label>
                                <div className="h-10 rounded-xl border border-orange-500/30 bg-orange-500/5 flex items-center px-4 font-mono text-sm font-bold tracking-widest text-orange-400">
                                    VERANO2026
                                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>▮</motion.span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Tipo de descuento</label>
                                    <div className="flex gap-2">
                                        {["% Porcentaje", "$ Monto"].map((t, i) => (
                                            <button key={t}
                                                className={`flex-1 h-9 rounded-xl text-xs font-semibold border ${i === 0 ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "border-border text-muted-foreground"}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Valor</label>
                                    <div className="h-9 rounded-xl border border-border bg-muted/30 flex items-center px-3 gap-1">
                                        <span className="text-orange-400 font-bold">20</span>
                                        <span className="text-muted-foreground text-sm">%</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Aplica a</label>
                                <div className="flex gap-2">
                                    {["Toda la tienda", "Categoría", "Producto"].map((t, i) => (
                                        <button key={t}
                                            className={`flex-1 h-9 rounded-xl text-xs border ${i === 0 ? "bg-orange-500/15 border-orange-500/40 text-orange-400" : "border-border text-muted-foreground"}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Preview coupon */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="mt-2 p-4 rounded-2xl border-2 border-dashed border-orange-500/40 bg-orange-500/5 relative overflow-hidden">
                                <div className="absolute right-0 top-0 bottom-0 w-4 bg-background" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }} />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-mono font-bold text-lg text-orange-400 tracking-widest">VERANO2026</p>
                                        <p className="text-xs text-muted-foreground">20% de descuento en toda la tienda</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-orange-400">20%</p>
                                        <p className="text-[10px] text-muted-foreground">OFF</p>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25">
                                Activar cupón
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Campaign dashboard ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/5">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-12">
                        <p className="text-xs font-semibold tracking-widest text-orange-400 uppercase mb-3">Campañas activas</p>
                        <h3 className="text-4xl font-bold font-serif">Monitorea cada acción de marketing</h3>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { name: "Email · Carrito abandonado", sent: 2840, opens: "48%", conversions: "6.2%", revenue: "$184K", state: "activa", color: "blue" },
                            { name: "Cupón · Black Friday", sent: 8100, opens: "61%", conversions: "12.4%", revenue: "$920K", state: "finalizada", color: "amber" },
                            { name: "Remarketing · IG Ads", sent: 15200, opens: "34%", conversions: "3.8%", revenue: "$284K", state: "activa", color: "rose" },
                        ].map((camp, i) => (
                            <motion.div key={camp.name} {...fdUp(i * 0.12)}
                                className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <p className="text-sm font-semibold leading-tight">{camp.name}</p>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold
                    ${camp.state === "activa" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                                        {camp.state}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { label: "Enviados", val: camp.sent.toLocaleString() },
                                        { label: "Apertura", val: camp.opens },
                                        { label: "Conversión", val: camp.conversions },
                                        { label: "Revenue", val: camp.revenue },
                                    ].map(m => (
                                        <div key={m.label}>
                                            <p className="text-xs text-muted-foreground">{m.label}</p>
                                            <p className="text-sm font-bold">{m.val}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: camp.conversions }}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                                        viewport={{ once: true }}
                                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
