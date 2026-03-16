"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PackageSearch,
    Boxes,
    ShoppingCart,
    Tags,
    Settings,
    Store,
    Truck,
    ChefHat,
} from "lucide-react";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Órdenes", href: "/admin/orders", icon: ShoppingCart },
    { name: "Despachos", href: "/admin/fulfillments", icon: Truck },
    { name: "Cocina / KDS", href: "/admin/kds", icon: ChefHat },
    { name: "Catálogo", href: "/admin/products", icon: PackageSearch },
    { name: "Inventario", href: "/admin/inventory", icon: Boxes },
    { name: "Reglas de Precio", href: "/admin/pricing", icon: Tags },
    { name: "Cajas (POS)", href: "/admin/registers", icon: Store },
    { name: "Configuración", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-border">
                <span className="font-bold text-lg tracking-tight">UnderDesk OS</span>
            </div>
            
            <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            
            <div className="p-4 border-t border-border mt-auto">
                <div className="text-xs text-muted-foreground px-3">
                    Retail OS Panel v1.0
                </div>
            </div>
        </aside>
    );
}
