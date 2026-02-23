"use client";
import { motion } from "framer-motion";
import { Users, Star, Tag, MessageCircle } from "lucide-react";

const CUSTOMERS = [
    { name: "María González", email: "maria@email.cl", orders: 14, spent: "$384.210", badge: "VIP", avatar: "MG" },
    { name: "Carlos Rojas", email: "carlos@email.cl", orders: 6, spent: "$142.990", badge: "Regular", avatar: "CR" },
    { name: "Sofía Martínez", email: "sofia@email.cl", orders: 2, spent: "$34.990", badge: "Nuevo", avatar: "SM" },
];

const SEGMENTS = [
    { name: "VIP (>$300K)", count: 284, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
    { name: "Activos (30d)", count: 1241, color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
    { name: "En riesgo (60d)", count: 318, color: "text-red-400 bg-red-500/15 border-red-500/30" },
    { name: "Nuevos (7d)", count: 92, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function CrmSection() {
    return (
        <section id="crm" className="relative overflow-hidden">

            {/* ── Section A: Customer profiles ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-br from-rose-950/10 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    {/* CRM panel mock */}
                    <motion.div {...fdUp(0)} className="rounded-3xl border border-white/8 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/6 flex items-center gap-3">
                            <Users className="h-5 w-5 text-rose-400" />
                            <span className="font-semibold">Clientes</span>
                            <span className="ml-auto text-xs font-mono text-muted-foreground">3,721 total</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {CUSTOMERS.map((c, i) => (
                                <motion.div key={c.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.12 }}
                                    viewport={{ once: true }}
                                    className="p-5">
                                    <div className="flex items-start gap-4">
                                        <motion.div
                                            animate={{ boxShadow: i === 0 ? ["0 0 0 0 rgba(251,191,36,0.3)", "0 0 0 8px rgba(251,191,36,0)"] : undefined }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-300 flex-shrink-0">
                                            {c.avatar}
                                        </motion.div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-semibold text-sm">{c.name}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                          ${c.badge === "VIP" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                                                        c.badge === "Regular" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                                                            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}`}>
                                                    {c.badge === "VIP" && <Star className="h-2.5 w-2.5 inline mr-0.5" />}
                                                    {c.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{c.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-emerald-400">{c.spent}</p>
                                            <p className="text-xs text-muted-foreground">{c.orders} órdenes</p>
                                        </div>
                                    </div>
                                    {/* Purchase history mini timeline */}
                                    <div className="mt-3 ml-15 flex items-center gap-1.5 pl-14">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <motion.div key={j}
                                                initial={{ opacity: 0, scale: 0 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 + j * 0.05 }}
                                                viewport={{ once: true }}
                                                className={`h-5 w-1.5 rounded-full ${((i + 1) * (j + 1)) % 3 === 0 ? "bg-muted" : "bg-rose-500/60"}`}
                                            />
                                        ))}
                                        <span className="text-[10px] text-muted-foreground ml-1">actividad 30d</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <div>
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <Users className="h-3.5 w-3.5" /> Módulo 7 · CRM
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif leading-tight mb-6">
                            Conoce a cada<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-400">cliente.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground leading-relaxed mb-8">
                            Perfil completo de cada comprador: historial, patrones de compra, frecuencia y valor de vida. Segmenta y actúa.
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* ── Section B: Segmentation ── */}
            <div className="py-24 px-6 border-t border-white/5 bg-muted/10">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-12">
                        <p className="text-xs font-semibold tracking-widest text-rose-400 uppercase mb-3">Segmentación Automática</p>
                        <h3 className="text-4xl font-bold font-serif">El cliente correcto, el mensaje correcto</h3>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {SEGMENTS.map((s, i) => (
                            <motion.div key={s.name} {...fdUp(i * 0.1)}
                                className={`p-5 rounded-2xl border text-center ${s.color}`}>
                                <p className="text-3xl font-bold">{s.count.toLocaleString()}</p>
                                <p className="text-xs mt-1 opacity-80">{s.name}</p>
                            </motion.div>
                        ))}
                    </div>
                    {/* Tag filter mock */}
                    <motion.div {...fdUp(2)} className="rounded-2xl border border-white/8 bg-card/60 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Tag className="h-4 w-4 text-rose-400" />
                            <p className="font-medium text-sm">Crear segmento personalizado</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["$LTV > $200K", "Última compra < 30d", "Género: Mujer", "Región: RM", "Carrito abandonado"].map((tag, i) => (
                                <motion.div key={tag}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + i * 0.07 }}
                                    viewport={{ once: true }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${i < 3 ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-muted border-border text-muted-foreground"}`}>
                                    {i < 3 && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                                    {tag}
                                    {i < 3 && <button className="ml-0.5 text-rose-400/60 hover:text-rose-400">×</button>}
                                </motion.div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="px-3 py-1.5 rounded-xl text-xs border border-dashed border-rose-500/30 text-rose-400/60">
                                + Agregar filtro
                            </motion.div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-rose-400" />
                                <span className="text-sm font-semibold text-rose-400">847 clientes</span>
                                <span className="text-xs text-muted-foreground">coinciden con este segmento</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/30">
                                    <MessageCircle className="h-3.5 w-3.5 inline mr-1" />Enviar campaña
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
