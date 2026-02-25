"use client";

import { useCart } from "@/store/useCart";
import { formatPrice } from "@/lib/utils/currency";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetDescription
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface CartDrawerProps {
    storeId: string;
    children?: React.ReactNode;
}

export function CartDrawer({ storeId, children }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const storeItems = items.filter(item => item.storeId === storeId);
    const total = totalPrice(storeId);
    const itemCount = totalItems(storeId);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="relative group overflow-hidden">
                        <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold animate-in zoom-in">
                                {itemCount}
                            </span>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <SheetHeader className="p-6 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Tu Carrito
                        </SheetTitle>
                    </div>
                    <SheetDescription>
                        Tienes {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu bolsa.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {storeItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                            <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300">
                                <ShoppingCart className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg">Tu carrito está vacío</p>
                                <p className="text-sm text-zinc-500 max-w-[200px]">
                                    ¡Agrega algunos productos para comenzar tu compra!
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-full px-8" onClick={() => setOpen(false)}>
                                Explorar Tienda
                            </Button>
                        </div>
                    ) : (
                        storeItems.map((item) => (
                            <div key={item.cartItemId} className="flex gap-4 group">
                                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 transition-transform group-hover:scale-105">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground italic">UDF</div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between py-1">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {item.name}
                                            </h4>
                                            <button
                                                onClick={() => removeItem(item.cartItemId)}
                                                className="text-zinc-400 hover:text-destructive p-1 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                    <span key={key} className="text-[10px] text-zinc-500 uppercase tracking-tighter bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                        {val}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden h-8">
                                            <button
                                                className="px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                            <button
                                                className="px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-sm text-primary">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {storeItems.length > 0 && (
                    <SheetFooter className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 font-medium">Subtotal</span>
                                <span className="text-xl font-black text-primary">
                                    {formatPrice(total)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Envío calculado en el siguiente paso.
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 group" asChild>
                                    <Link href={`/${storeId}/checkout`}>
                                        Finalizar Compra
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="w-full rounded-xl text-zinc-500 hover:text-primary transition-colors" asChild onClick={() => setOpen(false)}>
                                    <Link href={`/${storeId}/cart`}>
                                        Ver Carrito Completo
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
