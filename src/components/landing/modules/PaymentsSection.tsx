"use client";
import { motion } from "framer-motion";
import { CreditCard, Lock, ShieldCheck, Zap, ArrowRight } from "lucide-react";

const PROVIDERS = [
    { name: "Stripe", countries: "Internacional", color: "#635bff", enabled: true },
    { name: "Webpay", countries: "Chile", color: "#e31837", enabled: true },
    { name: "MercadoPago", countries: "LATAM", color: "#009ee3", enabled: true },
    { name: "Flow", countries: "Chile", color: "#22c55e", enabled: false },
];

const FLOW_STEPS = [
    { label: "Cliente paga", desc: "Checkout seguro con PCI DSS", icon: "💳", color: "bg-blue-500/15 border-blue-500/30 text-blue-400" },
    { label: "PSP procesa", desc: "Stripe / Webpay / MercadoPago", icon: "⚡", color: "bg-violet-500/15 border-violet-500/30 text-violet-400" },
    { label: "Ledger registra", desc: "Doble entrada inmutable", icon: "📒", color: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
    { label: "Balance disponible", desc: "Maduración T+24h", icon: "💰", color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
    { label: "Payout al banco", desc: "Cuenta verificada KYC", icon: "🏦", color: "bg-primary/15 border-primary/30 text-primary" },
];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function PaymentsSection() {
    return (
        <section id="pagos" className="relative overflow-hidden">

            {/* ── Section A: PSP overview ── */}
            <div className="relative min-h-screen flex items-center py-28 px-6 bg-gradient-to-br from-blue-950/15 via-background to-background">
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px]"
                    />
                    {/* Animated circuit lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                            <path d="M0,60 L40,60 L40,30 L80,30 L80,60 L120,60" stroke="white" strokeWidth="1" fill="none" />
                            <circle cx="40" cy="30" r="3" fill="white" />
                            <circle cx="80" cy="60" r="3" fill="white" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#circuit)" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-14">
                        <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-6">
                            <CreditCard className="h-3.5 w-3.5" /> Módulo 5 · Pagos
                        </motion.div>
                        <motion.h2 {...fdUp(1)} className="text-5xl md:text-6xl font-bold tracking-tight font-serif mb-4">
                            Cobra de manera<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">inteligente.</span>
                        </motion.h2>
                        <motion.p {...fdUp(2)} className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            4 PSPs integrados, routing automático por país y moneda, sistema anti-fraude y liquidaciones diarias.
                        </motion.p>
                    </div>

                    {/* PSP cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                        {PROVIDERS.map((p, i) => (
                            <motion.div key={p.name} {...fdUp(i * 0.1)}
                                className={`p-5 rounded-2xl border bg-card/60 backdrop-blur-xl text-center ${p.enabled ? "border-white/10" : "border-white/5 opacity-60"}`}>
                                <motion.div
                                    animate={{ boxShadow: p.enabled ? [`0 0 0 0px ${p.color}30`, `0 0 0 8px ${p.color}00`] : undefined }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="h-12 w-12 rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-white text-lg"
                                    style={{ backgroundColor: p.color + "30", border: `1px solid ${p.color}50` }}>
                                    {p.name.slice(0, 1)}
                                </motion.div>
                                <p className="font-semibold text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{p.countries}</p>
                                <div className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${p.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                                    <div className={`h-1.5 w-1.5 rounded-full ${p.enabled ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                                    {p.enabled ? "Activo" : "Beta"}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Security badges */}
                    <motion.div {...fdUp(4)} className="flex flex-wrap justify-center gap-4">
                        {[
                            { icon: Lock, label: "PCI DSS Level 1" },
                            { icon: ShieldCheck, label: "TLS 1.3 Encriptado" },
                            { icon: Zap, label: "Anti-fraude 3DS2" },
                        ].map(b => (
                            <div key={b.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-white/8 text-sm text-muted-foreground">
                                <b.icon className="h-4 w-4 text-primary" />
                                {b.label}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Transaction flow visualization ── */}
            <div className="py-24 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fdUp(0)} className="text-center mb-14">
                        <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Arquitectura de Pagos</p>
                        <h3 className="text-4xl font-bold font-serif">Del cobro al banco en 5 pasos</h3>
                    </motion.div>

                    {/* Flow steps */}
                    <div className="relative">
                        {/* Connector line */}
                        <div className="absolute top-8 left-10 right-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block" />

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                            {FLOW_STEPS.map((step, i) => (
                                <motion.div key={step.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.15, duration: 0.5 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center text-center group">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: [-2, 2, -2] }}
                                        className={`h-16 w-16 rounded-2xl border text-2xl flex items-center justify-center mb-4 ${step.color} shadow-lg transition-shadow group-hover:shadow-xl`}>
                                        {step.icon}
                                    </motion.div>
                                    <p className="font-semibold text-sm mb-1">{step.label}</p>
                                    <p className="text-xs text-muted-foreground leading-snug">{step.desc}</p>
                                    {i < FLOW_STEPS.length - 1 && (
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 my-2 md:hidden" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Transaction mock */}
                    <motion.div {...fdUp(3)} className="mt-16 rounded-2xl border border-white/8 bg-card/60 backdrop-blur-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <p className="font-semibold">Últimas transacciones</p>
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Sistema en línea
                            </span>
                        </div>
                        <div className="space-y-3">
                            {[
                                { id: "pi_3R..a7Kd", amount: "$89.990", method: "Visa •••• 4242", status: "Pagado", psp: "Webpay", time: "hace 2min" },
                                { id: "pi_3R..b8Le", amount: "$24.990", method: "MercadoPago", status: "Pagado", psp: "MercadoPago", time: "hace 5min" },
                                { id: "pi_3R..c9Mf", amount: "$199.990", method: "Mastercard •••• 9187", status: "Procesando", psp: "Stripe", time: "hace 8min" },
                            ].map((tx, i) => (
                                <motion.div key={tx.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex items-center justify-between py-3 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono text-muted-foreground">{tx.id}</p>
                                            <p className="text-sm">{tx.method}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-emerald-400">{tx.amount}</p>
                                        <div className="flex items-center justify-end gap-2 mt-0.5">
                                            <span className="text-[10px] text-muted-foreground">{tx.psp}</span>
                                            <span className={`text-[10px] font-semibold ${tx.status === "Pagado" ? "text-emerald-400" : "text-amber-400"}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
