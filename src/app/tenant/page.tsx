"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { DashboardStats } from "@/components/tenant/dashboard/DashboardStats";
import { RecentOrders } from "@/components/tenant/dashboard/RecentOrders";
import { LowStockAlert } from "@/components/tenant/dashboard/LowStockAlert";
import { SetupWidget } from "@/components/tenant/dashboard/SetupWidget";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, BarChart2, Sparkles } from "lucide-react";

const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
}

function humanDate() {
    const d = new Date();
    return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

import { AlertsPanel } from "@/components/tenant/dashboard/AlertsPanel";

export default function AdminDashboard() {
    const { user } = useAuth();
    const name = user?.displayName || user?.email?.split("@")[0] || "Merchant";

    return (
        <div className="space-y-8">
            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-blue-500/5 to-violet-500/8 p-7">
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-blue-500/8 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="text-xs font-semibold text-primary uppercase tracking-widest">{humanDate()}</p>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {getGreeting()}, {name} 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Aquí está el resumen de tu tienda hoy.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button asChild size="sm" className="shadow-sm gap-2">
                            <Link href="/tenant/products/new">
                                <Package className="h-3.5 w-3.5" /> Nuevo producto
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="gap-2">
                            <Link href="/tenant/orders">
                                <ShoppingCart className="h-3.5 w-3.5" /> Ver pedidos
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="gap-2">
                            <Link href="/tenant/analytics">
                                <BarChart2 className="h-3.5 w-3.5" /> Analytics
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <SetupWidget />
                    <DashboardStats />
                </div>
                <div>
                    <AlertsPanel />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentOrders />
                <LowStockAlert />
            </div>
        </div>
    );
}
