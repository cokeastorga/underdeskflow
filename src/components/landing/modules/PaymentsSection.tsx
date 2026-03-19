"use client";
import { motion } from "framer-motion";
import { CreditCard, Lock, ShieldCheck, Zap, ArrowRight, RefreshCcw, Globe } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function PaymentsSection() {
    return (
        <section id="pagos" className="relative overflow-hidden">
            {/* ── Section A: HMAC Secured Gateway ── */}
            <div className="relative min-h-screen flex items-center py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Lock className="h-3 w-3" /> Seguridad Transaccional
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Cobros <span className="text-violet-400">Blindados.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Cada transacción está protegida por validación HMAC y firmas criptográficas. Integridad total de datos desde el checkout hasta la confirmación del webhook.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { icon: ShieldCheck, label: "PCI DSS Ready" },
                                { icon: Zap, label: "Anti-Fraud AI" }
                            ].map((b, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <b.icon className="h-4 w-4 text-violet-400" />
                                    <span className="text-xs font-bold text-zinc-300 tracking-tight">{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-1 shadow-2xl">
                         <div className="bg-zinc-950 rounded-[22px] p-8 overflow-hidden relative">
                             <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-6">
                                <p className="text-xs font-mono text-zinc-500 tracking-tight">POST /api/webhooks/mercadopago</p>
                                <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                             </div>
                             <div className="space-y-4 font-mono text-[10px]">
                                <p className="text-zinc-600">x-signature-hmac: <span className="text-violet-400">sha256=f83k...92l</span></p>
                                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                                    <p className="mb-2">{"{"}</p>
                                    <p className="pl-4">"transaction_id": "tx_294021",</p>
                                    <p className="pl-4">"status": "approved",</p>
                                    <p className="pl-4">"signature_valid": true</p>
                                    <p>{"}"}</p>
                                </div>
                                <p className="text-emerald-400 font-bold">[success] Webhook integrity verified.</p>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Multi-Currency & PSP Routing ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                        <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-violet-400" />
                                </div>
                                <p className="text-sm font-bold text-white tracking-tight">Active PSP Routing</p>
                             </div>
                             <div className="space-y-4">
                                {[
                                    { name: "Stripe", locale: "International (USD)", active: true },
                                    { name: "Mercado Pago", locale: "Local (CLP/MXN)", active: true },
                                    { name: "Webpay Plus", locale: "Direct (CLP)", active: true },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                        <div>
                                            <p className="text-sm font-bold text-white">{p.name}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{p.locale}</p>
                                        </div>
                                        <div className="h-5 w-5 rounded-full border border-violet-500/20 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-violet-400" />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Escalabilidad <span className="text-violet-400">Monetaria.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Vende en cualquier parte del mundo. Routing inteligente de pagos que elige el mejor procesador según la ubicación del cliente para maximizar la tasa de conversión.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Conversión de moneda automática",
                                "Routing de pagos multi-región",
                                "Checkout optimizado en un clic",
                                "Soporte para pagos recurrentes (SaaS)"
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 text-zinc-500">
                                    <Check className="h-4 w-4 text-violet-400" />
                                    <span className="text-sm font-medium">{f}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Financial reconciliation ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Conciliación <span className="text-violet-400">Financiera.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Mantén el control total de tu flujo de caja. Reportes detallados de liquidaciones, comisiones y balances disponibles con exportación automatizada a tu equipo contable.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <RefreshCcw className="h-6 w-6 text-violet-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Daily</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Payouts</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center">
                                <CreditCard className="h-6 w-6 text-violet-400 mx-auto mb-3" />
                                <p className="text-xl font-bold text-white tracking-tighter">Multi</p>
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-1">Acquirer</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                         <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl relative">
                             <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Financial Summary</span>
                                <span className="text-[10px] font-mono text-emerald-400">Ready to Payout</span>
                             </div>
                             <div className="space-y-6">
                                 <div>
                                    <p className="text-xs text-zinc-500 mb-2 font-medium">Balance Disponible</p>
                                    <p className="text-4xl font-bold text-white font-mono tracking-tighter">$12.450.800 <span className="text-sm text-zinc-600">CLP</span></p>
                                 </div>
                                 <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-violet-400" />
                                        <span className="text-xs text-zinc-400">Próxima liquidación: T+24h</span>
                                     </div>
                                     <ArrowRight className="h-4 w-4 text-zinc-700" />
                                 </div>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
