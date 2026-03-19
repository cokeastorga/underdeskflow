"use client";
import { useState, useEffect } from "react";
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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 py-6 pointer-events-none">
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`
                    flex items-center justify-between w-full max-w-7xl px-6 py-3 rounded-2xl border transition-all duration-300 pointer-events-auto
                    ${scrolled 
                        ? "bg-zinc-950/80 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
                        : "bg-transparent border-transparent"}
                `}
            >
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-primary/20 p-2 rounded-xl border border-primary/30 group-hover:scale-110 transition-transform">
                        <LayoutTemplate className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-lg font-bold tracking-tighter text-white">UnderDesk<span className="text-primary">Flow</span></span>
                </Link>

                <div className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-zinc-400">
                    {NAV_LINKS.map(l => (
                        <a key={l.href} href={l.href}
                            className="hover:text-white transition-colors duration-200 uppercase tracking-widest">
                            {l.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:inline-flex">Acceso</button>
                    </Link>
                    <Link href="/register">
                        <Button size="sm"
                            className="text-xs font-bold rounded-xl bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/5 transition-all px-5">
                            Comenzar Ahora
                        </Button>
                    </Link>
                </div>
            </motion.nav>
        </div>
    );
}
