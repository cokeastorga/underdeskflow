"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, TrendingUp, ShoppingBag, CreditCard, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Counter({ to, duration = 2 }: { to: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let start = 0;
        const step = to / (duration * 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= to) { setCount(to); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [started, to, duration]);

    return <span ref={ref}>{count.toLocaleString("es-CL")}</span>;
}

const STATS = [
    { icon: TrendingUp, value: 4800000, prefix: "$", suffix: "", label: "GMV procesado hoy", color: "text-emerald-400" },
    { icon: ShoppingBag, value: 1284, prefix: "", suffix: "", label: "Órdenes activas", color: "text-blue-400" },
    { icon: CreditCard, value: 99.9, prefix: "", suffix: "%", label: "Uptime garantizado", color: "text-violet-400" },
    { icon: Users, value: 3721, prefix: "", suffix: "", label: "Comercios activos", color: "text-amber-400" },
];

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-20">

            {/* ── Animated gradient background video replacement */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/10 rounded-full blur-[180px]"
                />
                <motion.div
                    animate={{ scale: [1.1, 1, 1.1], x: [0, 60, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[130px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, -40, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-sky-500/7 rounded-full blur-[110px]"
                />
                {/* Grid */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)"
                    }}
                />
                {/* Floating particles */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div key={i}
                        className="absolute w-1 h-1 bg-primary/40 rounded-full"
                        style={{ left: `${5 + (i * 4.8) % 90}%`, top: `${10 + (i * 7.3) % 80}%` }}
                        animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2] }}
                        transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold tracking-wider uppercase mb-10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Plataforma todo-en-uno para comercio digital
                </motion.div>

                {/* Headline */}
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
                    className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight font-serif leading-[1.0] mb-8">
                    Tu negocio.
                    <br />
                    <span className="text-gradient">Online.</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12">
                    Diseña tu tienda, gestiona productos, coordina envíos y recibe pagos —
                    <br className="hidden md:block" />
                    todo desde un panel de control pensado para crecer.
                </motion.p>

                {/* CTAs */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                    <Link href="/register">
                        <Button size="lg"
                            className="h-16 px-10 text-lg rounded-2xl font-semibold bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/60 hover:scale-[1.03] transition-all duration-300">
                            Crear mi tienda gratis
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button size="lg" variant="outline"
                            className="h-16 px-10 text-lg rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                            Ver demo en vivo
                        </Button>
                    </Link>
                </motion.div>

                {/* Live Stats */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {STATS.map((s, i) => (
                        <div key={s.label}
                            className="p-5 rounded-2xl bg-white/4 backdrop-blur-xl border border-white/8 text-center">
                            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                            <p className={`text-2xl font-bold ${s.color}`}>
                                {s.prefix}
                                {Number.isInteger(s.value) ? <Counter to={s.value} duration={1.5 + i * 0.2} /> : s.value}
                                {s.suffix}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Animated dashboard mock */}
                <motion.div initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.9 }}
                    className="mt-20 rounded-3xl border border-white/10 overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.6)] max-w-5xl mx-auto">
                    {/* Mock window bar */}
                    <div className="flex items-center gap-2 px-5 py-3.5 bg-white/5 border-b border-white/8">
                        <span className="h-3 w-3 rounded-full bg-red-400/80" />
                        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                        <span className="h-3 w-3 rounded-full bg-green-400/80" />
                        <div className="ml-4 h-5 rounded-md bg-white/8 flex-1 max-w-xs" />
                    </div>
                    {/* Dashboard layout */}
                    <div className="flex bg-background/95 backdrop-blur-xl min-h-[320px]">
                        {/* Sidebar */}
                        <div className="hidden md:flex w-52 flex-col gap-2 p-4 border-r border-white/6">
                            {["Dashboard", "Productos", "Órdenes", "Clientes", "Envíos", "Analytics", "Pagos", "Marketing", "Diseño"].map((item, i) => (
                                <motion.div key={item}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 + i * 0.06 }}
                                    className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${i === 0 ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                                    <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                                    {item}
                                </motion.div>
                            ))}
                        </div>
                        {/* Main content */}
                        <div className="flex-1 p-5 space-y-4">
                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: "GMV Hoy", value: "$4.8M", up: true },
                                    { label: "Órdenes", value: "1,284", up: true },
                                    { label: "Conversión", value: "3.4%", up: false },
                                    { label: "Ticket Prom.", value: "$3,740", up: true },
                                ].map((c, i) => (
                                    <motion.div key={c.label}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.3 + i * 0.08 }}
                                        className="rounded-xl bg-white/4 border border-white/8 p-3">
                                        <p className="text-xs text-muted-foreground">{c.label}</p>
                                        <p className="text-lg font-bold mt-1 text-foreground">{c.value}</p>
                                        <p className={`text-xs mt-0.5 ${c.up ? "text-emerald-400" : "text-red-400"}`}>{c.up ? "↑" : "↓"} vs ayer</p>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Chart */}
                            <div className="rounded-xl bg-white/4 border border-white/8 p-4 h-36 relative overflow-hidden">
                                <p className="text-xs text-muted-foreground mb-2">Revenue últimos 7 días</p>
                                <svg viewBox="0 0 400 80" className="w-full h-20">
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <motion.path
                                        d="M0,60 C40,55 80,30 120,35 C160,40 200,15 240,20 C280,25 320,10 360,5 L400,5 L400,80 L0,80 Z"
                                        fill="url(#chartGrad)"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
                                    />
                                    <motion.path
                                        d="M0,60 C40,55 80,30 120,35 C160,40 200,15 240,20 C280,25 320,10 360,5"
                                        fill="none" stroke="rgb(59,130,246)" strokeWidth="2"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        transition={{ delay: 1.4, duration: 1.2, ease: "easeOut" }}
                                    />
                                </svg>
                            </div>
                            {/* Recent orders */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { order: "#2841", product: "Zapatillas Air Max", amount: "$89.990", status: "Pagado" },
                                    { order: "#2840", product: "Polera Premium", amount: "$24.990", status: "En despacho" },
                                ].map((o, i) => (
                                    <motion.div key={o.order}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: 1.8 + i * 0.1 }}
                                        className="rounded-xl bg-white/4 border border-white/8 p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-mono text-muted-foreground">{o.order}</p>
                                            <p className="text-sm font-medium mt-0.5">{o.product}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-emerald-400">{o.amount}</p>
                                            <p className="text-xs text-muted-foreground">{o.status}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">Descubre más</p>
                <div className="w-px h-12 bg-gradient-to-b from-primary/60 to-transparent" />
            </motion.div>
        </section>
    );
}
