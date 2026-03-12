"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import {
    collection, query, where, getDocs, limit as fsLimit,
    orderBy,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import {
    Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2,
    Wifi, WifiOff, Loader2, MonitorSmartphone, Tag, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { offlineQueue } from "@/lib/pos/offline-db";

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category?: string;
    imageUrl?: string;
    isFavorite?: boolean;
}

interface CartItem extends Product {
    qty: number;
}

type PaymentMethod = "cash" | "sumup" | "transfer";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "cash", label: "Efectivo", icon: "💵" },
    { id: "sumup", label: "SumUp (Lector)", icon: "💳" },
    { id: "transfer", label: "Transferencia", icon: "🏦" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

// ── Main Component ────────────────────────────────────────────────────────

export function POSTerminal({ cashSessionId }: { cashSessionId?: string }) {
    const { storeId, user } = useAuth();

    // Product state
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>("Favoritos");
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const searchRef = useRef<HTMLInputElement>(null);

    // ── Network status ──────────────────────────────────────────────────────
    useEffect(() => {
        const updateOnline = () => setIsOnline(navigator.onLine);
        window.addEventListener("online", updateOnline);
        window.addEventListener("offline", updateOnline);
        setIsOnline(navigator.onLine);
        return () => {
            window.removeEventListener("online", updateOnline);
            window.removeEventListener("offline", updateOnline);
        };
    }, []);

    // ── Keyboard shortcuts ──────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            const isInput = tag === "INPUT" || tag === "TEXTAREA";

            if (e.key === "/" && !isInput) {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === "Escape" && isInput) {
                (e.target as HTMLElement).blur();
                setSearchQuery("");
            }
            if (e.key === "Enter" && e.ctrlKey && cart.length > 0) {
                e.preventDefault();
                handleConfirmSale();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [cart]);

    // ── Load categories ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;
        (async () => {
            const snap = await getDocs(
                query(collection(db, "stores", storeId, "categories"), orderBy("name"))
            );
            const cats = snap.docs.map((d) => d.data().name as string);
            setCategories(["Favoritos", ...cats]);
        })();
    }, [storeId]);

    // ── Load products by category (lazy) ────────────────────────────────────
    useEffect(() => {
        if (!storeId || searchQuery) return;
        setLoadingProducts(true);

        const loadProducts = async () => {
            let q;
            if (activeCategory === "Favoritos") {
                q = query(
                    collection(db, "stores", storeId, "products"),
                    where("isFavorite", "==", true),
                    orderBy("name"),
                    fsLimit(50)
                );
            } else {
                q = query(
                    collection(db, "stores", storeId, "products"),
                    where("category", "==", activeCategory),
                    orderBy("name"),
                    fsLimit(50)
                );
            }

            try {
                const snap = await getDocs(q);
                setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
            } catch (err) {
                console.error("Product load error:", err);
            } finally {
                setLoadingProducts(false);
            }
        };
        loadProducts();
    }, [storeId, activeCategory, searchQuery]);

    // ── Product search ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!storeId || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const snap = await getDocs(
                    query(
                        collection(db, "stores", storeId, "products"),
                        where("nameLower", ">=", searchQuery.toLowerCase()),
                        where("nameLower", "<=", searchQuery.toLowerCase() + "\uf8ff"),
                        fsLimit(20)
                    )
                );
                setSearchResults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
            } catch {
                // Fallback: client-side filter if no nameLower index
                setSearchResults(
                    products.filter((p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                );
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, storeId]);

    // ── Cart operations ─────────────────────────────────────────────────────
    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id ? { ...i, qty: i.qty + 1 } : i
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    }, []);

    const updateQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) => (i.id === productId ? { ...i, qty: i.qty + delta } : i))
                .filter((i) => i.qty > 0)
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.id !== productId));
    };

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - discount);

    // ── Confirm sale ────────────────────────────────────────────────────────
    const handleConfirmSale = async () => {
        if (!cart.length || !storeId || !user) return;
        setSubmitting(true);

        const clientSaleId = uuidv4();
        const payload = {
            clientSaleId,
            storeId,
            items: cart.map((i) => ({
                productId: i.id,
                name: i.name,
                price: i.price,
                qty: i.qty,
            })),
            paymentMethod,
            discount,
            cashSessionId,
        };

        if (!isOnline) {
            // Save to offline queue
            await offlineQueue.add({ clientSaleId, payload });
            toast.warning("Sin conexión — Venta guardada offline. Se sincronizará al reconectar.");
            setCart([]);
            setDiscount(0);
            setSubmitting(false);
            return;
        }

        try {
            const token = await user.getIdToken();
            
            // 1. Create the Unified Order FIRST (Always OPEN at this stage)
            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...payload, paymentMethod: undefined }), // Defer payment
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error ?? "Error al crear la orden");

            const orderId = orderData.orderId;

            // 2. Handle Payment Flow
            if (paymentMethod === "sumup" || paymentMethod === "transfer") {
                // Async Hardware Payment or Pending Transfer Verification
                const intentRes = await fetch("/api/payments/intents", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        storeId,
                        orderId,
                        amount: total,
                        provider: paymentMethod === "sumup" ? "SUMUP" : "TRANSFER",
                        deviceId: "pos-1", // Should come from terminal config in real life
                        idempotencyKey: `${orderId}-pos-1`
                    })
                });
                
                if (!intentRes.ok) {
                     toast.error("Orden guardada, pero falló inicio de pago en terminal.");
                } else {
                     toast.info(`Cobro enviado al Terminal. Esperando confirmación... (Ref: ${orderId.slice(-8)})`, { duration: 5000 });
                }
            } else {
                // CASH is instant. We can tell Backend to mark it PAID immediately via a separate call or unified logic.
                // For now, we simulate success for Cash. In production, Cash logic might be a special Intent type.
                toast.success(
                    orderData.duplicate
                        ? `Venta ya registrada (ref: ${orderId.slice(-8)})`
                        : `✓ Venta registrada (Efectivo) — ${fmt(total)}`,
                    { duration: 3000 }
                );
            }

            setCart([]);
            setDiscount(0);
        } catch (err: any) {
            // Network failure → save offline
            await offlineQueue.add({ clientSaleId, payload });
            toast.error(`Error: ${err.message}. Guardado offline.`);
        } finally {
            setSubmitting(false);
        }
    };

    const displayProducts = searchQuery ? searchResults : products;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-10rem)] gap-0 rounded-xl overflow-hidden border border-border bg-card">
            {/* ── Left: Product Panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="p-4 border-b border-border space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder='Buscar producto... (presiona "/")'
                                className="pl-9 pr-4"
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {isOnline
                                ? <Wifi className="h-4 w-4 text-emerald-500" />
                                : <WifiOff className="h-4 w-4 text-red-500" />}
                            <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-red-500"}`}>
                                {isOnline ? "Online" : "Offline"}
                            </span>
                        </div>
                    </div>

                    {/* Category tabs */}
                    {!searchQuery && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {cat === "Favoritos" ? "⭐ " : ""}{cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loadingProducts ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <MonitorSmartphone className="h-10 w-10 opacity-20" />
                            <p className="text-sm">
                                {searchQuery ? "Sin resultados para esa búsqueda" : "No hay productos en esta categoría"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {displayProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock === 0}
                                    className={`group relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all
                                        ${product.stock === 0
                                            ? "opacity-40 cursor-not-allowed bg-muted"
                                            : "hover:border-primary hover:bg-primary/5 active:scale-[0.97] cursor-pointer bg-card border-border"
                                        }`}
                                >
                                    {product.isFavorite && (
                                        <Star className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-amber-400 fill-current" />
                                    )}
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Tag className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="w-full min-w-0">
                                        <p className="text-sm font-semibold truncate">{product.name}</p>
                                        <p className="text-base font-bold text-primary">{fmt(product.price)}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Stock: {product.stock}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right: Cart Panel ── */}
            <div className="w-80 flex flex-col border-l border-border bg-muted/20">
                {/* Cart title */}
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">
                        Carrito
                        {cart.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 text-xs">{cart.length}</Badge>
                        )}
                    </span>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 pt-8">
                            <ShoppingCart className="h-8 w-8 opacity-20" />
                            <p className="text-xs">Selecciona productos para agregar</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 bg-card rounded-lg p-2.5 border border-border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{fmt(item.price)} c/u</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => updateQty(item.id, -1)}
                                        className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                                    <button onClick={() => updateQty(item.id, +1)}
                                        className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => removeFromCart(item.id)}
                                        className="h-6 w-6 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center ml-1">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals + payment */}
                <div className="border-t border-border p-4 space-y-4">
                    {/* Discount */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex-1">Descuento (CLP)</span>
                        <Input
                            type="number"
                            min={0}
                            value={discount || ""}
                            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                            className="h-7 w-28 text-right text-sm"
                            placeholder="0"
                        />
                    </div>

                    {/* Totals */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{fmt(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Descuento</span>
                                <span>-{fmt(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                            <span>TOTAL</span>
                            <span className="text-primary">{fmt(total)}</span>
                        </div>
                    </div>

                    {/* Payment method selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {PAYMENT_METHODS.map((pm) => (
                            <button
                                key={pm.id}
                                onClick={() => setPaymentMethod(pm.id)}
                                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium border transition-all ${paymentMethod === pm.id
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                                    }`}
                            >
                                <span className="text-base">{pm.icon}</span>
                                <span className="leading-tight text-center">{pm.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Confirm button */}
                    <Button
                        className="w-full h-12 text-base font-semibold gap-2"
                        disabled={cart.length === 0 || submitting}
                        onClick={handleConfirmSale}
                    >
                        {submitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5" />
                        )}
                        {submitting ? "Procesando..." : `Cobrar ${fmt(total)}`}
                        {!submitting && <kbd className="ml-auto text-[10px] opacity-60">Ctrl+Enter</kbd>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
