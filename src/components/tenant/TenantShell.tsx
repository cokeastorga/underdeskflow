"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, Settings, LogOut, Store, ShoppingCart, Users, Megaphone, MapPin, ClipboardList, Menu, Palette, Truck, CreditCard, BarChart2, LayoutGrid, Globe, TrendingUp, Bell, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { OnboardingProgress } from "./onboarding/OnboardingProgress";
import { KeyboardShortcutsModal } from "./shell/KeyboardShortcutsModal";
import { GuideProvider } from "./guides/GuideContext";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserNav } from "./UserNav";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut
} from "@/components/ui/command";
import { Search } from "lucide-react";

export function TenantShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, storeId } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [store, setStore] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [conflictCount, setConflictCount] = useState(0);

    useEffect(() => {
        if (storeId && user) {
            const fetchConflictCount = async () => {
                try {
                    const token = await user.getIdToken();
                    const res = await fetch(`/api/products/conflicts?storeId=${storeId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setConflictCount(data.conflicts?.length || 0);
                } catch (e) {
                    console.error("Error fetching conflict count:", e);
                }
            };
            fetchConflictCount();
            const interval = setInterval(fetchConflictCount, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [storeId, user]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "?" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                e.preventDefault();
                setShowShortcuts((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    useEffect(() => {
        if (storeId) {
            const unsubscribe = onSnapshot(doc(db, "stores", storeId), (doc) => {
                setStore(doc.data());
            });
            return () => unsubscribe();
        }
    }, [storeId]);

    // Redirection is handled by Middleware and Server Components
    if (!user && !storeId) {
        // Optional loading state
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
            <div className="p-6">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {store?.logo ? (
                        <div className="h-8 w-8 rounded-lg overflow-hidden relative">
                            <img src={store.logo} alt={store.name} className="object-cover w-full h-full" />
                        </div>
                    ) : (
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                    )}
                    <span className="truncate">{store?.name || "UDF | Control Center"}</span>
                </h1>
            </div>

            <nav className="mt-2 px-4 space-y-1 flex-1 overflow-y-auto">
                {/* Onboarding Progress Widget */}
                {store && store.onboardingStatus !== "completed" && (
                    <OnboardingProgress store={store} />
                )}

                <NavLink href="/tenant" icon={LayoutDashboard}>Dashboard</NavLink>

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tienda
                    </p>
                </div>
                <NavLink href="/tenant/design" icon={Palette}>Diseño</NavLink>
                <NavLink href="/tenant/categories" icon={LayoutGrid}>Categorías</NavLink>
                <NavLink href="/tenant/products" icon={Package}>
                    <span className="flex items-center gap-2">
                        Productos
                        {conflictCount > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                {conflictCount}
                            </span>
                        )}
                    </span>
                </NavLink>
                {conflictCount > 0 && (
                    <NavLink href="/tenant/products/conflicts" icon={AlertCircle}>
                        <span className="text-orange-500 dark:text-orange-400 font-bold">
                            Bandeja de Conflictos
                        </span>
                    </NavLink>
                )}
                <NavLink href="/tenant/inventory" icon={ClipboardList}>Inventario</NavLink>
                <NavLink href="/tenant/inventory/alerts" icon={Bell}>Alertas de stock</NavLink>
                <NavLink href="/tenant/orders" icon={ShoppingCart}>Pedidos</NavLink>
                <NavLink href="/tenant/shipping" icon={Truck}>Envíos</NavLink>
                <NavLink href="/tenant/customers" icon={Users}>Clientes / CRM</NavLink>
                <NavLink href="/tenant/marketing" icon={Megaphone}>Marketing</NavLink>
                {/* Enterprise-only: Canales externos */}
                <NavLink href="/tenant/channels" icon={Globe}>
                    <span className="flex items-center gap-1.5">
                        Canales externos
                        {(store as any)?.plan !== "enterprise" && (
                            <span className="ml-auto text-[9px] font-bold uppercase tracking-wide bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1 py-0.5 rounded">
                                Enterprise
                            </span>
                        )}
                    </span>
                </NavLink>
                {(store as any)?.plan === "enterprise" && (
                    <NavLink href="/tenant/channels/status" icon={Activity}>
                        Estado del sistema
                    </NavLink>
                )}

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Finanzas
                    </p>
                </div>
                <NavLink href="/tenant/payments" icon={CreditCard}>Pagos</NavLink>
                <NavLink href="/tenant/reports" icon={TrendingUp}>Reportes</NavLink>
                <NavLink href="/tenant/analytics" icon={BarChart2}>Analytics</NavLink>
                <NavLink href="/tenant/billing" icon={CreditCard}>Facturación</NavLink>

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Sistema
                    </p>
                </div>
                <NavLink href="/tenant/settings" icon={Settings}>Configuración</NavLink>
                <NavLink href="/tenant/settings/locations" icon={MapPin}>Sucursales</NavLink>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 space-y-2">
                {storeId && (
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(`/${storeId}`, '_blank')}
                    >
                        <Store className="h-4 w-4 mr-2" />
                        Ver Tienda
                    </Button>
                )}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => signOut(auth)}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );

    const isOnboarding = pathname === "/tenant/onboarding";

    if (isOnboarding) {
        return (
            <GuideProvider>
                <div className="bg-gray-50 dark:bg-black min-h-screen">
                    <main className="flex-1 overflow-x-hidden">
                        <div className="p-0 min-h-screen">
                            {children}
                        </div>
                    </main>
                    <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
                </div>
            </GuideProvider>
        );
    }

    return (
        <GuideProvider>
            <div className="flex bg-gray-50 dark:bg-black min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 w-full z-30 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 h-16 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        {store?.logo ? (
                            <img src={store.logo} alt={store.name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-white">
                                <Store className="h-5 w-5" />
                            </div>
                        )}
                        <span className="truncate max-w-[150px]">{store?.name}</span>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <SheetTitle className="sr-only">Navegación</SheetTitle>
                            <SheetDescription className="sr-only">Menú principal</SheetDescription>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 fixed h-full z-30">
                    <SidebarContent />
                </div>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 overflow-x-hidden">
                    {/* Desktop Header */}
                    <header className="hidden md:flex h-16 items-center justify-between border-b px-6 bg-white dark:bg-zinc-900 sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <Breadcrumbs />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground text-xs w-64 justify-between hidden lg:flex"
                                onClick={() => setOpen(true)}
                            >
                                <span className="flex items-center gap-2"><Search className="h-3 w-3" /> Buscar...</span>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </Button>
                            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full border-2 border-white dark:border-zinc-900"></span>
                            </Button>
                            <UserNav />
                        </div>
                    </header>

                    <div className="p-6 md:p-8 min-h-[calc(100vh-4rem)]">
                        {user && !user.emailVerified && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md mb-6 flex items-center gap-3">
                                <div className="flex-1 text-sm">
                                    <span className="font-semibold">Verifica tu correo electrónico.</span> Por favor revisa tu bandeja de entrada para verificar tu cuenta.
                                </div>
                                <Button size="sm" variant="outline" className="h-8 bg-white dark:bg-black border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/50">
                                    Reenviar
                                </Button>
                            </div>
                        )}
                        {children}
                    </div>
                </main>

                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput placeholder="Escribe un comando o busca..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                        <CommandGroup heading="Sugerencias">
                            <CommandItem onSelect={() => { router.push("/tenant/products"); setOpen(false); }}>
                                <Package className="mr-2 h-4 w-4" />
                                <span>Productos</span>
                            </CommandItem>
                            <CommandItem onSelect={() => { router.push("/tenant/orders"); setOpen(false); }}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                <span>Pedidos</span>
                            </CommandItem>
                            <CommandItem onSelect={() => { router.push("/tenant/shipping"); setOpen(false); }}>
                                <Truck className="mr-2 h-4 w-4" />
                                <span>Envíos</span>
                            </CommandItem>
                            <CommandItem onSelect={() => { router.push("/tenant/customers"); setOpen(false); }}>
                                <Users className="mr-2 h-4 w-4" />
                                <span>Clientes</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Configuración">
                            <CommandItem onSelect={() => { router.push("/tenant/design"); setOpen(false); }}>
                                <Palette className="mr-2 h-4 w-4" />
                                <span>Diseño</span>
                            </CommandItem>
                            <CommandItem onSelect={() => { router.push("/tenant/settings"); setOpen(false); }}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Ajustes Generales</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>

                <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />

                {/* Onboarding Orchestrator Removed - Using UniversalWizard page */}
            </div>
        </GuideProvider>
    );
}

function NavLink({ href, icon: Icon, children, className = "" }: { href: string; icon: any; children: React.ReactNode; className?: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-100"
                } ${className}`}
        >
            <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"}`} />
            {children}
        </Link>
    );
}
