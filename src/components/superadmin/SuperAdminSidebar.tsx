"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Store,
    CreditCard,
    Settings,
    Zap,
    ChevronRight,
    Globe,
    Activity,
    Landmark,
} from "lucide-react";

interface NavItem {
    name: string;
    href: string;
    icon: any;
    exact?: boolean;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        label: "Cuartel General",
        items: [
            { name: "Dashboard Global", href: "/superadmin", icon: BarChart3, exact: true },
            { name: "Salud del Sistema", href: "/superadmin/health", icon: Activity },
        ],
    },
    {
        label: "Plataforma",
        items: [
            { name: "Gestión de Tiendas", href: "/superadmin/stores", icon: Store },
            { name: "Auditoría de Pagos", href: "/superadmin/payments", icon: CreditCard },
            { name: "Facturación & Planes", href: "/superadmin/billing", icon: Landmark },
            { name: "Integraciones HQ", href: "/superadmin/integrations", icon: Zap },
        ],
    },
    {
        label: "Sistema",
        items: [
            { name: "Dominios", href: "/superadmin/domains", icon: Globe },
            { name: "Configuración SaaS", href: "/superadmin/settings", icon: Settings },
        ],
    },
];

export function SuperAdminSidebar() {
    const pathname = usePathname();

    const isActive = (href: string, exact = false) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    return (
        <aside className="w-64 flex flex-col h-full shrink-0 bg-zinc-950 text-zinc-100 border-r border-zinc-800">
            {/* Brand */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-zinc-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="font-bold text-sm text-white leading-none">UnderDesk</p>
                    <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase leading-none mt-0.5">HQ Control</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-5">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                            {section.label}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            active
                                                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                                                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 border border-transparent"
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                                        <span className="flex-1">{item.name}</span>
                                        {active && <ChevronRight className="h-3.5 w-3.5 text-violet-400 opacity-70" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 px-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-zinc-500">Sistema operativo</span>
                </div>
            </div>
        </aside>
    );
}
