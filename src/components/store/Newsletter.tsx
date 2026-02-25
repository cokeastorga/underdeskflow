"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

interface NewsletterProps {
    title?: string;
    template?: "modern" | "minimal" | "bold";
    headingFont?: string;
}

export function Newsletter({ title, template = "modern", headingFont }: NewsletterProps) {
    return (
        <div className="relative py-32 overflow-hidden bg-black text-white isolate w-full">
            {/* Background Texture/Image */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            </div>

            <MotionWrapper className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl space-y-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <Mail className="w-16 h-16 mb-2 text-white/50" strokeWidth={1} />
                </motion.div>
                <div className="space-y-4">
                    <h2
                        className={`text-5xl md:text-7xl font-bold ${template === 'bold' ? 'uppercase tracking-tighter font-black' : 'font-serif tracking-tight'}`}
                        style={{ fontFamily: headingFont }}
                    >
                        {title || "Únete al Círculo"}
                    </h2>
                    <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto">
                        Suscríbete para recibir acceso anticipado, eventos exclusivos y ofertas de lujo.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row w-full max-w-xl gap-4 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <input
                        type="email"
                        placeholder="Tu dirección de email"
                        className="flex-1 bg-transparent border-none px-6 py-4 text-white placeholder:text-white/30 focus:outline-none text-lg"
                    />
                    <Button
                        size="lg"
                        className={`rounded-xl px-10 h-14 text-base ${template === 'bold' ? 'bg-primary text-primary-foreground font-black uppercase' : 'bg-white text-black hover:bg-black hover:text-white transition-all duration-300'}`}
                    >
                        Subscribirse
                    </Button>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">AL SUSCRIBIRTE ACEPTAS NUESTROS TÉRMINOS Y POLÍTICA DE PRIVACIDAD</p>
            </MotionWrapper>
        </div>
    );
}
