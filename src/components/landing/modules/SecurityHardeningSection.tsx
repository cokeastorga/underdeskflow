"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Server, Globe, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SECURITY_FEATURES = [
    {
        icon: ShieldCheck,
        title: "Aislamiento Multi-Tenant",
        description: "Cada tienda opera en una burbuja lógica independiente. Aislamiento total por storeId verificado criptográficamente.",
        tech: "IDOR Prevention Layer"
    },
    {
        icon: Globe,
        title: "Edge Resolve Architecture",
        description: "Routing de milisegundos para dominios personalizados. Caching de dominios en el vorde para máxima velocidad global.",
        tech: "Next.js Edge Runtime"
    },
    {
        icon: Lock,
        title: "Pagos Verificados (HMAC)",
        description: "Seguridad bancaria en webhooks. Cada notificación es validada con firmas HMAC y protección anti-replay.",
        tech: "Mercado Pago Hardened"
    },
    {
        icon: Server,
        title: "Propiedad de Dominio",
        description: "Verificación obligatoria vía DNS TXT challenge. Tokens únicos con expiración de 24 horas para total seguridad.",
        tech: "DNS TXT Validation"
    }
];

export default function SecurityHardeningSection() {
    return (
        <section id="security" className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4"
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Seguridad de Grado Enterprise
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6"
                    >
                        Construido para la <span className="text-primary">Confianza.</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 max-w-2xl mx-auto text-lg font-light leading-relaxed"
                    >
                        UnderDeskFlow no solo es una plataforma de ventas, es una infraestructura robusta diseñada para proteger tus datos y asegurar tus transacciones.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {SECURITY_FEATURES.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl h-full hover:border-primary/50 transition-colors group">
                                <CardContent className="p-8">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                        <f.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-light">{f.description}</p>
                                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{f.tech}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Infrastructure proof - Visual decoration */}
                <div className="mt-24 p-1 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
                    <div className="bg-zinc-950 rounded-[14px] p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
                        <h4 className="text-2xl font-bold text-white mb-4 relative z-10">¿Listo para escalar sin límites?</h4>
                        <p className="text-zinc-400 mb-8 relative z-10 max-w-lg mx-auto font-light">
                            Únete a cientos de comercios que ya confían en nuestra infraestructura para procesar millones en transacciones mensuales.
                        </p>
                        <div className="flex justify-center gap-12 flex-wrap relative z-10 opacity-40">
                            <span className="text-zinc-500 font-bold tracking-widest uppercase text-sm italic">Scalable</span>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase text-sm italic">Secure</span>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase text-sm italic">Isolated</span>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase text-sm italic">Edge Native</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
