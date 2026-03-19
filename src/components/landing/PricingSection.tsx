"use client";
import { motion } from "framer-motion";
import { Check, Zap, ShieldCheck, Globe, Zap as ZapIcon, ArrowRight, Layers, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function PricingSection() {
    return (
        <section id="precios" className="relative overflow-hidden">
            {/* ── Section A: SaaS Tiers & Ecosystem ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto text-center mb-20 relative z-10">
                    <motion.div {...fdUp(0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Layers className="h-3 w-3" /> Strategic Tiers
                    </motion.div>
                    <motion.h2 {...fdUp(1)} className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                        Precios que <span className="text-violet-400">Escalan.</span>
                    </motion.h2>
                    <motion.p {...fdUp(2)} className="text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Desde startups hasta gigantes del retail. Elige el plan que mejor se adapte a tu volumen de transacciones y necesidades de infraestructura.
                    </motion.p>
                </div>

                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { 
                            name: "Basic", 
                            price: "$9.990", 
                            desc: "Ideal para validación inicial",
                            features: ["1 Tienda", "Bot de ventas", "Stripe Support", "99.0% SLA"],
                            color: "zinc" 
                        },
                        { 
                            name: "Pro", 
                            price: "$29.990", 
                            desc: "Para negocios consolidados",
                            features: ["5 Tiendas", "CRM Avanzado", "Multi-Currency", "99.5% SLA", "Split Payments"],
                            color: "violet",
                            popular: true
                        },
                        { 
                            name: "Enterprise", 
                            price: "Custom", 
                            desc: "Infraestructura dedicada",
                            features: ["Tiendas ∞", "White-labeling", "API Rate-limit +", "99.9% SLA", "Account Manager"],
                            color: "zinc" 
                        }
                    ].map((p, i) => (
                        <motion.div 
                            key={i} 
                            {...fdUp(i * 0.15)}
                            className={`p-10 rounded-3xl border ${p.popular ? 'border-violet-500/40 bg-zinc-900/60 shadow-2xl shadow-violet-500/10 scale-105' : 'border-zinc-800 bg-zinc-900/30'} relative group hover:border-zinc-700 transition-colors`}
                        >
                            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-white text-[9px] font-bold uppercase tracking-widest">Most Popular</span>}
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">{p.name}</p>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-bold text-white tracking-tighter">{p.price}</span>
                                {p.price !== "Custom" && <span className="text-zinc-600 text-sm">/mes</span>}
                            </div>
                            <ul className="space-y-4 mb-10">
                                {p.features.map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-sm text-zinc-400 font-light">
                                        <Check className={`h-4 w-4 ${p.popular ? 'text-violet-400' : 'text-zinc-600'}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register">
                                <Button className={`w-full h-12 rounded-xl border ${p.popular ? 'bg-violet-500 hover:bg-violet-400 text-white border-transparent' : 'bg-transparent border-zinc-700 text-white hover:bg-zinc-800'} font-bold`}>
                                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── Section B: Enterprise SLA & Support ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                         <div className="p-10 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <ShieldCheck className="h-48 w-48 text-violet-400" />
                             </div>
                             <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <Globe className="h-5 w-5 text-violet-400" />
                                    <p className="text-sm font-bold text-white tracking-tight">Global Infrastructure Status</p>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { node: "Latin America South", status: "Operational", lat: "12ms" },
                                        { node: "North America East", status: "Operational", lat: "45ms" },
                                        { node: "Europe Central", status: "Operational", lat: "128ms" },
                                    ].map((n, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                            <div>
                                                <p className="text-xs font-bold text-white">{n.node}</p>
                                                <p className="text-[10px] text-zinc-600 font-mono">Real-time Latency: {n.lat}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{n.status}</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <motion.h3 {...fdUp(1)} className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Garantía de <span className="text-violet-400">Disponibilidad.</span>
                        </motion.h3>
                        <motion.p {...fdUp(2)} className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Nuestra arquitectura distribuida garantiza un tiempo de actividad del 99.9%. Para grandes cuentas, ofrecemos SLAs personalizados y soporte técnico dedicado 24/7.
                        </motion.p>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { title: "Dedicated Support", desc: "Manager de cuenta exclusivo para ti." },
                                { title: "Priority Onboarding", desc: "Migración de datos 100% asistida." }
                            ].map((f, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-sm font-bold text-white tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-600 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: High-Volume Capabilities ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <motion.h3 {...fdUp(1)} className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Capacidades de <span className="text-violet-400">Alto Volumen.</span></motion.h3>
                        <motion.p {...fdUp(2)} className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Procesamos millones en transacciones mensuales. Personaliza tus comisiones de plataforma, configura splits complejos y escala tu API sin límites.
                        </motion.p>
                        <div className="flex gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <ZapIcon className="h-6 w-6 text-violet-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Unlimited</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">API Requests</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <CreditCard className="h-6 w-6 text-violet-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Custom</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Fee Architectures</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative">
                             <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enterprise Feature Matrix</span>
                                <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                             </div>
                             <div className="space-y-4">
                                {[
                                    "Infinite Store Instances",
                                    "Custom White-label Domains",
                                    "Full API Infrastructure Control",
                                    "Advanced Fraud Prevention (HMAC+)",
                                    "Legal Compliance & Audit Export"
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                                        <span className="text-xs text-zinc-400">{f}</span>
                                        <Check className="h-3 w-3 text-violet-400" />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
