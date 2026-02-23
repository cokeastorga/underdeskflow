"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const PLANS = [
    {
        name: "Starter",
        price: "$9.990",
        period: "/mes",
        desc: "Para empezar a vender hoy",
        color: "border-white/10 bg-card/40",
        badge: null,
        features: [
            "1 tienda",
            "Hasta 100 productos",
            "2 usuarios",
            "Stripe + Webpay",
            "Soporte email",
        ],
    },
    {
        name: "Growth",
        price: "$29.990",
        period: "/mes",
        desc: "Para escalar tu negocio",
        color: "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/20 scale-[1.04]",
        badge: "Más popular",
        features: [
            "3 tiendas",
            "Productos ilimitados",
            "10 usuarios",
            "Todos los PSPs",
            "Analytics avanzado",
            "Marketing & CRM",
            "Soporte prioritario",
        ],
    },
    {
        name: "Enterprise",
        price: "A medida",
        period: "",
        desc: "Para grandes operaciones",
        color: "border-white/10 bg-card/40",
        badge: null,
        features: [
            "Tiendas ilimitadas",
            "Productos ilimitados",
            "Usuarios ilimitados",
            "SLA 99.99%",
            "Onboarding dedicado",
            "API avanzada",
            "Manager de cuenta",
        ],
    },
];

const fdUp = (i = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    viewport: { once: true },
});

export default function PricingSection() {
    return (
        <section id="precios" className="relative py-28 px-6 overflow-hidden border-t border-white/5">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div {...fdUp(0)} className="text-center mb-14">
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Precios</p>
                    <h2 className="text-5xl font-bold tracking-tight font-serif mb-4">Simple. Transparente. Sin sorpresas.</h2>
                    <p className="text-xl text-muted-foreground">14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 items-center">
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.name} {...fdUp(i * 0.12)}
                            className={`rounded-3xl border p-8 relative ${plan.color}`}>
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/30 flex items-center gap-1.5">
                                    <Zap className="h-3 w-3" /> {plan.badge}
                                </div>
                            )}
                            <p className="font-bold text-lg mb-1">{plan.name}</p>
                            <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground text-sm">{plan.period}</span>
                            </div>
                            <Link href="/register">
                                <Button
                                    className={`w-full h-11 rounded-xl mb-6 font-semibold ${plan.badge ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/50" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
                                    {plan.name === "Enterprise" ? "Contactar ventas" : "Empezar gratis"}
                                </Button>
                            </Link>
                            <div className="space-y-3">
                                {plan.features.map(f => (
                                    <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.badge ? "bg-primary/20" : "bg-muted"}`}>
                                            <Check className={`h-2.5 w-2.5 ${plan.badge ? "text-primary" : "text-muted-foreground"}`} />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials */}
                <motion.div {...fdUp(4)} className="mt-20 grid md:grid-cols-3 gap-5">
                    {[
                        { quote: "Montamos nuestra tienda en 20 minutos y vendimos el mismo día. Increíble.", name: "Ana Jiménez", company: "AnaFashion" },
                        { quote: "El sistema de pagos funciona perfecto. Los payouts llegan puntualmente cada semana.", name: "Eduardo Vásquez", company: "TechStore CL" },
                        { quote: "El dashboard de analytics es mejor que cualquier herramienta que usé antes.", name: "Camila Torres", company: "Decora tu Hogar" },
                    ].map((t, i) => (
                        <motion.div key={t.name}
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.15 }} viewport={{ once: true }}
                            className="p-5 rounded-2xl bg-card/60 border border-white/8 backdrop-blur-xl">
                            <div className="flex gap-0.5 mb-3">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/30 flex items-center justify-center text-xs font-bold">
                                    {t.name.slice(0, 1)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.company}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
