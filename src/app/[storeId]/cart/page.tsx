"use client"

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";
import { Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

export default function CartPage() {
    const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const params = useParams();
    const storeId = params.storeId as string;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const total = totalPrice();

    return (
        <div className="container py-8 md:py-12">
            <h1 className="mb-8 text-3xl font-bold tracking-tight">Carrito de Compras</h1>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-lg">Tu carrito está vacío.</p>
                    <Link href={`/${storeId}/products`}>
                        <Button>Explorar Productos</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div key={item.cartItemId} className="flex gap-4 p-4 border rounded-lg bg-card transition-all hover:shadow-md">
                                <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted flex-shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No Img</div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                    <div className="flex justify-between gap-2">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-base">{item.name}</h3>

                                            {/* Variant Options */}
                                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground uppercase tracking-wide">
                                                            {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(item.price)} each</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.cartItemId)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border rounded-md">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="font-bold">
                                            {new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={clearCart} className="text-destructive hover:text-destructive">
                                Vaciar Carrito
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-6 shadow-sm h-fit">
                        <h2 className="text-lg font-semibold mb-4">Resumen de la Orden</h2>
                        <div className="space-y-4 separator">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Envío</span>
                                <span className="text-green-600">Gratis</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(total)}</span>
                            </div>
                            <Link href={`/${storeId}/checkout`} className="w-full block">
                                <Button className="w-full" size="lg">Proceder al Pago</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
