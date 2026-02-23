"use client";
import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { motion } from "framer-motion";

const FOOTER_LINKS = {
    Plataforma: [
        { label: "Tienda Online", href: "#tienda" },
        { label: "Diseño & Branding", href: "#diseno" },
        { label: "Productos", href: "#productos" },
        { label: "Envíos", href: "#envios" },
        { label: "Pagos", href: "#pagos" },
    ],
    Operaciones: [
        { label: "Analytics", href: "#analytics" },
        { label: "Clientes / CRM", href: "#crm" },
        { label: "Marketing", href: "#marketing" },
        { label: "Categorías", href: "#categorias" },
    ],
    Legal: [
        { label: "Términos y Condiciones", href: "/legal" },
        { label: "Política de Privacidad", href: "/legal" },
        { label: "Política de Pagos", href: "/legal" },
    ],
    Cuenta: [
        { label: "Iniciar Sesión", href: "/login" },
        { label: "Crear Tienda", href: "/register" },
        { label: "Precios", href: "#precios" },
    ],
};

export default function LandingFooter() {
    return (
        <footer className="border-t border-white/5 bg-muted/5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/3 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
                {/* CTA Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mb-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-blue-500/5 to-violet-500/8 p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div key={i}
                                animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 3 + i % 3, repeat: Infinity, delay: i * 0.4 }}
                                className="absolute h-1 w-1 bg-primary rounded-full"
                                style={{ left: `${8 + i * 7.5}%`, top: `${20 + (i % 3) * 25}%` }}
                            />
                        ))}
                    </div>
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Empieza hoy</p>
                    <h3 className="text-4xl font-bold font-serif mb-3">¿Listo para crecer?</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">14 días gratis, sin tarjeta de crédito. Cancela cuando quieras.</p>
                    <Link href="/register">
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            className="px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300">
                            Crear mi tienda gratis →
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Links grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
                    {Object.entries(FOOTER_LINKS).map(([section, links], i) => (
                        <motion.div key={section}
                            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{section}</p>
                            <ul className="space-y-2.5">
                                {links.map(l => (
                                    <li key={l.label}>
                                        <Link href={l.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-1.5 rounded-lg">
                            <LayoutTemplate className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold text-sm text-foreground">EnterpriseOS</span>
                        <span className="hidden md:block">—</span>
                        <span className="hidden md:block">La plataforma de comercio digital para América Latina</span>
                    </div>
                    <p>© 2026 Enterprise Inc. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
