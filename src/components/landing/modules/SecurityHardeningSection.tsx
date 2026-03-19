"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Shield, Server, CheckCircle2, FileText, Database, ShieldAlert } from "lucide-react";

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function SecurityHardeningSection() {
    return (
        <section id="security" className="relative overflow-hidden">
            {/* ── Section A: Data Isolation & IDOR Proof ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(0)}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Shield className="h-3 w-3" /> Security Architecture
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.9]">
                            Blindaje <span className="text-emerald-400">Total.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 leading-relaxed mb-10 font-light">
                            Tu negocio está protegido por capas de seguridad de nivel bancario. Aislamiento multi-tenant real que garantiza que tus datos nunca se crucen con otros.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: "IDOR Proof", desc: "Validación estricta de StoreID en cada request." },
                                { title: "No-SQL Guards", desc: "Reglas de Firestore verificadas a nivel servidor." }
                            ].map((f, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-sm font-bold text-white mb-1 tracking-tight">{f.title}</p>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl relative overflow-hidden group">
                         <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Multi-Tenant Vault</span>
                            <div className="flex gap-2 text-[10px] font-bold text-emerald-400 animate-pulse">
                                SECURE_CHANNEL_READY
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data Bucket: store_4829</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-gradient-to-r from-emerald-500/20 via-emerald-400/40 to-emerald-500/20 animate-shimmer" />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Session Key Hash</p>
                                <p className="text-[10px] font-mono text-emerald-400/80 break-all leading-tight">
                                    sha256:8f4c2e...b9a0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z
                                </p>
                            </div>
                         </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section B: Cryptographic Trust ── */}
            <div className="relative py-32 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
                    <motion.div {...fdUp(1)} className="order-last lg:order-first">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                             <div className="flex items-center gap-3 mb-8">
                                <Lock className="h-5 w-5 text-emerald-400" />
                                <p className="text-sm font-bold text-white tracking-tight">HMAC Webhook Validation</p>
                             </div>
                             <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-2">Payload Verification</p>
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                        <span className="text-zinc-500">Signature:</span>
                                        <span className="text-emerald-400">PASSED</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono mt-2">
                                        <span className="text-zinc-500">Timestamp Window:</span>
                                        <span className="text-emerald-400">VALID (3.2s)</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-2">Anti-Replay Logs</p>
                                    <div className="h-12 w-full flex items-center gap-1">
                                        {[1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1].map((b, i) => (
                                            <div key={i} className={`flex-1 h-${b ? '8' : '4'} bg-zinc-800 rounded-sm`} />
                                        ))}
                                    </div>
                                </div>
                             </div>
                         </div>
                    </motion.div>

                    <motion.div {...fdUp(0)}>
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                            Confianza <span className="text-emerald-400">Criptográfica.</span>
                        </h3>
                        <p className="text-lg text-zinc-400 leading-relaxed font-light mb-8">
                            Nuestros webhooks están protegidos por firmas HMAC y validaciónBackend-to-Backend. Eliminamos los ataques de replay y garantizamos que cada evento de pago sea auténtico.
                        </p>
                        <div className="space-y-4">
                             {[
                                "Verificación obligatoria de firmas HMAC",
                                "Ventana de tiempo de 5 min para firmas",
                                "TLS 1.3 forzado en toda la red",
                                "Logs de auditoría inmutables por acción"
                             ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-medium text-zinc-500">{f}</span>
                                </div>
                             ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Section C: Infrastructure Integrity ── */}
            <div className="relative py-32 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <motion.div {...fdUp(0)} className="md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Integridad de <span className="text-emerald-400">Red.</span></h3>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed mb-8">
                            Utilizamos DNS TXT Verification y tokens de desafío de 24 horas para asegurar que tú tengas el control total de tus dominios. Routing inteligente en el Edge para mayor seguridad.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center font-bold">
                                <Server className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                                <p className="text-white tracking-tighter">Zero-Trust</p>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Routing</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1 text-center font-bold">
                                <FileText className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                                <p className="text-white tracking-tighter">DNS TXT</p>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">Challenge</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fdUp(1)} className="md:w-1/2 relative">
                         <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl relative">
                             <div className="absolute top-0 right-0 p-8">
                                <ShieldAlert className="h-12 w-12 text-emerald-400 opacity-20" />
                             </div>
                             <div className="flex items-center gap-3 mb-8">
                                <Server className="h-5 w-5 text-emerald-400" />
                                <p className="text-sm font-bold text-white tracking-tight">Domain Integrity Watchman</p>
                             </div>
                             <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Custom Domain Probe</p>
                                    <p className="text-sm font-mono text-white">shop.custombrand.cl</p>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest tracking-widest">Ownership Verified</span>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                </div>
                             </div>
                         </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
