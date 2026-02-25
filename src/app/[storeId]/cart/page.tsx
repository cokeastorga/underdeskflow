"use client";

import { useCart } from "@/store/useCart";
import { formatPrice } from "@/lib/utils/currency";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
    const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const params = useParams();
    const storeId = params.storeId as string;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const storeItems = items.filter(item => item.storeId === storeId);
    const total = totalPrice(storeId);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 md:py-20">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                                <ShoppingBag className="w-4 h-4" />
                                Tu Selección
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Carrito de Compras</h1>
                        </div>
                        <Button variant="link" className="text-zinc-500 hover:text-primary p-0 h-auto" asChild>
                            <Link href={`/${storeId}/products`} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Seguir Comprando
                            </Link>
                        </Button>
                    </div>

                    {storeItems.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-12 md:p-20 text-center shadow-xl shadow-zinc-200/50 dark:shadow-none">
                            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
                                <ShoppingCart className="w-12 h-12 text-zinc-300" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                            <p className="text-zinc-500 max-w-md mx-auto mb-10 text-lg">
                                Parece que aún no has añadido nada. Explora nuestra colección y encuentra algo increíble hoy.
                            </p>
                            <Link href={`/${storeId}/products`}>
                                <Button size="lg" className="rounded-full px-12 h-14 font-bold text-lg shadow-xl shadow-primary/20">
                                    Ver Productos
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-12 lg:grid-cols-12 items-start">
                            {/* Products List */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hidden md:grid grid-cols-12 text-xs font-bold uppercase tracking-widest text-zinc-400">
                                        <div className="col-span-6">Producto</div>
                                        <div className="col-span-3 text-center">Cantidad</div>
                                        <div className="col-span-3 text-right">Subtotal</div>
                                    </div>
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {storeItems.map((item) => (
                                            <div key={item.cartItemId} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center group">
                                                <div className="md:col-span-6 flex gap-6 items-center">
                                                    <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
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
                                                    <div className="space-y-2">
                                                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                                                                <span key={key} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-500">
                                                                    {val}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm font-medium text-zinc-400">
                                                            P. Unitario: {formatPrice(item.price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-3 flex justify-center">
                                                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden h-11 border border-transparent focus-within:border-primary/30 transition-all">
                                                        <button
                                                            className="px-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-10 text-center font-bold text-base">{item.quantity}</span>
                                                        <button
                                                            className="px-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-2">
                                                    <div className="text-xl font-black text-zinc-900 dark:text-white">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-lg group/del"
                                                        onClick={() => removeItem(item.cartItemId)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2 group-hover/del:animate-bounce" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Eliminar</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => clearCart(storeId)}
                                        className="rounded-xl px-6 border-zinc-200 text-zinc-500 hover:text-destructive hover:border-destructive/30"
                                    >
                                        Vaciar Carrito
                                    </Button>
                                    <p className="text-zinc-400 text-sm italic">
                                        Los precios incluyen IVA (si aplica).
                                    </p>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="lg:col-span-4 sticky top-24">
                                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 md:p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-8">
                                    <h2 className="text-2xl font-bold tracking-tight">Resumen de Pago</h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-zinc-500">
                                            <span className="font-medium">Subtotal</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-zinc-500">
                                            <span className="font-medium">Costo de Envío</span>
                                            <span className="font-bold text-green-600">Calculado en checkout</span>
                                        </div>

                                        <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                        <div className="flex justify-between items-end pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">Total</span>
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Impuestos incluidos</span>
                                            </div>
                                            <span className="text-4xl font-black text-primary tracking-tighter">
                                                {formatPrice(total)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Link href={`/${storeId}/checkout`} className="w-full block">
                                            <Button className="w-full h-16 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/30 group" size="lg">
                                                Proceder al Pago
                                                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                                            </Button>
                                        </Link>
                                        <div className="flex items-center justify-center gap-4 py-2">
                                            <div className="h-[1px] flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pago 100% Seguro</span>
                                            <div className="h-[1px] flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex items-center gap-4 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 leading-snug italic">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                                            🤝
                                        </div>
                                        Garantizamos la seguridad de tus datos y la autenticidad de los productos seleccionados.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
