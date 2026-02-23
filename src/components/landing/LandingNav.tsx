"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const NAV_LINKS = [
    { label: "Tienda", href: "#tienda" },
    { label: "Diseño", href: "#diseno" },
    { label: "Productos", href: "#productos" },
    { label: "Envíos", href: "#envios" },
    { label: "Pagos", href: "#pagos" },
    { label: "Analytics", href: "#analytics" },
    { label: "Precios", href: "#precios" },
];

export default function LandingNav() {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 backdrop-blur-2xl bg-background/60"
        >
            <Link href="/" className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-blue-500 p-2 rounded-xl shadow-lg shadow-primary/30">
                    <LayoutTemplate className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">EnterpriseOS</span>
            </Link>

            <div className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
                {NAV_LINKS.map(l => (
                    <a key={l.href} href={l.href}
                        className="hover:text-foreground transition-colors duration-200">
                        {l.label}
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-sm hidden md:inline-flex">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                    <Button size="sm"
                        className="text-sm rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/50 hover:scale-[1.02] transition-all">
                        Crear Tienda <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </Link>
            </div>
        </motion.nav>
    );
}
