"use client"

import Link from "next/link"
import { ShoppingCart, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/store/useCart"
import { Store } from "@/types/store"
import { CartDrawer } from "@/components/store/CartDrawer"

interface NavbarProps {
    store: Store;
}

export function Navbar({ store }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const totalItems = useCart((state) => state.totalItems)
    const [mounted, setMounted] = useState(false)
    const storeId = store.id;

    const currentTemplate = store.design?.template || "modern";
    // Check if we should use the transparent header effect (mostly for luxury templates with large heros)
    const useTransparentHeader = ["modern", "bold"].includes(currentTemplate);

    useEffect(() => {
        setMounted(true)

        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const headerClass = useTransparentHeader
        ? `fixed top-0 z-50 w-full transition-all duration-500 border-b ${isScrolled
            ? "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-border/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] py-2"
            : "bg-transparent border-transparent py-5"}`
        : "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl border-border/50 py-3";

    const navLinkClass = `relative text-sm font-medium transition-all duration-300 hover:opacity-100 group py-1`;
    const navUnderlineClass = `absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full`;

    const textColorClass = (useTransparentHeader && !isScrolled) ? "text-white" : "text-foreground";
    const buttonVariant = (useTransparentHeader && !isScrolled) ? "ghost-white" : "ghost"; // We might need a custom ghost-white variant or just style styling

    return (
        <header className={headerClass}>
            <div className="container mx-auto px-4 flex h-14 md:h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href={`/${storeId}`} className={`flex items-center space-x-2 ${textColorClass}`}>
                        {store.logo ? (
                            <div className="h-8 w-8 relative overflow-hidden rounded-md">
                                <img src={store.logo} alt={store.name} className="object-cover w-full h-full" />
                            </div>
                        ) : null}
                        <span className={`text-xl font-bold tracking-tight capitalize ${currentTemplate === 'bold' ? 'uppercase font-black' : ''}`}>{store.name}</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className={`hidden md:flex items-center gap-10 ${textColorClass}`}>
                    <Link href={`/${storeId}/products`} className={navLinkClass}>
                        Productos
                        <span className={navUnderlineClass} />
                    </Link>
                    <Link href={`/${storeId}/about`} className={navLinkClass}>
                        Nosotros
                        <span className={navUnderlineClass} />
                    </Link>
                    <Link href={`/${storeId}/contact`} className={navLinkClass}>
                        Contacto
                        <span className={navUnderlineClass} />
                    </Link>
                </nav>

                <div className={`flex items-center gap-4 ${textColorClass}`}>
                    <CartDrawer storeId={storeId} />

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`md:hidden hover:bg-transparent hover:opacity-70 ${textColorClass}`}
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle Menu"
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full border-b p-4 space-y-4 bg-background text-foreground animate-in slide-in-from-top-5">
                    <nav className="flex flex-col gap-4">
                        <Link
                            href={`/${storeId}/products`}
                            className="text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Productos
                        </Link>
                        <Link
                            href={`/${storeId}/about`}
                            className="text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Nosotros
                        </Link>
                        <Link
                            href={`/${storeId}/contact`}
                            className="text-lg font-medium hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Contacto
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
