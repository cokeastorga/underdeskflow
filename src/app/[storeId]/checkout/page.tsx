"use client"

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { useRef, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Wallet, Loader2, Tag, X, Zap } from "lucide-react";
import { addDoc, collection, query, where, getDocs, updateDoc, increment, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coupon } from "@/types";

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const [mounted, setMounted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer" | "wallet" | "cash">("card");
    const [selectedProvider, setSelectedProvider] = useState<"webpay" | "mercadopago" | "flow" | "stripe">("webpay");
    const [loading, setLoading] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const router = useRouter();
    const params = useParams(); // Get params
    const storeId = params.storeId as string;
    const webpayFormRef = useRef<HTMLFormElement>(null);

    // Delivery & Locations State
    const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState("");

    // Fetch Locations if StoreId is present
    useEffect(() => {
        if (storeId) {
            const fetchLocations = async () => {
                const q = query(collection(db, "locations"), where("storeId", "==", storeId), where("isActive", "==", true));
                const snap = await getDocs(q);
                setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            };
            fetchLocations();
        }
    }, [storeId]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const subtotal = totalPrice();

    // Calculate discount
    const discountAmount = appliedCoupon ? (
        appliedCoupon.type === 'percentage'
            ? (subtotal * appliedCoupon.value) / 100
            : appliedCoupon.value
    ) : 0;

    const total = Math.max(0, subtotal - discountAmount);

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        try {
            const q = query(
                collection(db, "coupons"),
                where("storeId", "==", storeId),
                where("code", "==", couponCode.toUpperCase()),
                where("isActive", "==", true)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("Cupón inválido o expirado");
                setAppliedCoupon(null);
                setCouponLoading(false);
                return;
            }

            const couponDoc = querySnapshot.docs[0];
            const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

            // Validations
            const now = Date.now();
            if (coupon.startsAt && now < coupon.startsAt) {
                toast.error("El cupón aún no es válido");
                setCouponLoading(false);
                return;
            }
            if (coupon.endsAt && now > coupon.endsAt) {
                toast.error("El cupón ha expirado");
                setCouponLoading(false);
                return;
            }
            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                toast.error("El cupón ha alcanzado su límite de uso");
                setCouponLoading(false);
                return;
            }
            if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
                toast.error(`El monto mínimo para este cupón es ${new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(coupon.minOrderAmount)}`);
                setCouponLoading(false);
                return;
            }

            setAppliedCoupon(coupon);
            toast.success("Cupón aplicado correctamente");
        } catch (error) {
            console.error("Error applying coupon:", error);
            toast.error("Error al validar cupón");
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
    };

    const createPendingOrder = async (formData: FormData) => {
        setLoading(true);
        try {
            const orderData = {
                orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
                storeId,
                customerName: `${formData.get('firstName')} ${formData.get('lastName')}`,
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                items: items.map(item => ({
                    productId: item.id,
                    variantId: item.selectedVariantId || null,
                    selectedOptions: item.selectedOptions || null,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                subtotal,
                discountAmount,
                total,
                status: 'pending',
                paymentMethod,
                deliveryMethod,
                locationId: deliveryMethod === 'pickup' ? selectedLocationId : null,
                createdAt: Date.now(),
                couponId: appliedCoupon?.id || null,
            };

            const docRef = await addDoc(collection(db, "orders"), orderData);

            if (appliedCoupon) {
                await updateDoc(doc(db, "coupons", appliedCoupon.id), {
                    usedCount: increment(1)
                });
            }

            toast.success("Orden creada exitosamente");
            clearCart();
            router.push(`/${storeId}/order-success?id=${docRef.id}`);
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Error al procesar la orden");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (paymentMethod === "card" || paymentMethod === "wallet") {
            setLoading(true);
            try {
                // 1. Create the order first (as pending)
                const orderData = {
                    orderNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
                    storeId,
                    customerName: `${formData.get('firstName')} ${formData.get('lastName')}`,
                    email: formData.get('email'),
                    phone: formData.get('phone') || '',
                    items: items.map(item => ({
                        productId: item.id,
                        variantId: item.selectedVariantId || null,
                        selectedOptions: item.selectedOptions || null,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image
                    })),
                    subtotal,
                    discountAmount,
                    total,
                    status: 'pending',
                    paymentMethod,
                    provider: selectedProvider,
                    deliveryMethod,
                    locationId: deliveryMethod === 'pickup' ? selectedLocationId : null,
                    createdAt: Date.now(),
                    couponId: appliedCoupon?.id || null,
                };

                const orderRef = await addDoc(collection(db, "orders"), orderData);

                // 2. Initiate Payment Intent
                const response = await fetch("/api/payments/intents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        order_id: orderRef.id,
                        payment_method: paymentMethod,
                        provider: selectedProvider
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Error al iniciar el pago");
                }

                const { client_url, client_secret } = await response.json();

                if (client_url) {
                    // Redirect to Webpay, Flow, or MP
                    window.location.href = client_url;
                } else if (client_secret && selectedProvider === "stripe") {
                    // Handle Stripe Elements (would need additional implementation)
                    toast.error("Stripe Checkout no está implementado completamente en este demo");
                } else {
                    throw new Error("No se recibió una URL de pago válida");
                }

            } catch (error: any) {
                console.error("Error in checkout:", error);
                toast.error(error.message || "Error al procesar el pago");
                setLoading(false);
            }
        } else {
            // Traditional "transfer" or "cash" flow
            await createPendingOrder(formData);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold">Checkout</h1>
                            <p className="text-muted-foreground mt-2">Completa tu información para finalizar la compra.</p>
                        </div>

                        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <input name="firstName" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Apellido</label>
                                    <input name="lastName" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input name="email" type="email" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Teléfono</label>
                                <input name="phone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                            </div>

                            <div className="space-y-4 pt-4">
                                <label className="text-sm font-medium">Medio de Pago</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("webpay"); setPaymentMethod("card"); }}
                                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${selectedProvider === "webpay" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <p className="font-semibold">Webpay Plus</p>
                                                <p className="text-xs text-muted-foreground">Tarjetas de Crédito y Débito</p>
                                            </div>
                                        </div>
                                        {selectedProvider === "webpay" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("mercadopago"); setPaymentMethod("card"); }}
                                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${selectedProvider === "mercadopago" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Wallet className="h-5 w-5 text-sky-500" />
                                            <div className="text-left">
                                                <p className="font-semibold">Mercado Pago</p>
                                                <p className="text-xs text-muted-foreground">Billetera, Tarjetas y Dinero en MP</p>
                                            </div>
                                        </div>
                                        {selectedProvider === "mercadopago" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("flow"); setPaymentMethod("card"); }}
                                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${selectedProvider === "flow" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-orange-500" />
                                            <div className="text-left">
                                                <p className="font-semibold">Flow</p>
                                                <p className="text-xs text-muted-foreground">Múltiples medios de pago chilenos</p>
                                            </div>
                                        </div>
                                        {selectedProvider === "flow" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        <div className="bg-card p-6 rounded-lg border sticky top-24 space-y-6">
                            <h2 className="font-bold text-xl">Resumen de Compra</h2>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.cartItemId} className="flex justify-between text-sm items-start">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground font-medium">{item.name} x {item.quantity}</span>
                                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.selectedOptions).map(([key, val]) => (
                                                        <span key={key} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(item.price * item.quantity)}</span>
                                    </div>
                                ))}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(subtotal)}</span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                Descuento ({appliedCoupon.code})
                                            </span>
                                            <span>-{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2">
                                        <span>Total</span>
                                        <span>{new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(total)}</span>
                                    </div>
                                </div>

                                <div className="pt-2 pb-2">
                                    {!appliedCoupon ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Código de descuento"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                disabled={couponLoading}
                                            />
                                            <Button variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponCode}>
                                                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2 border border-green-200 bg-green-50 rounded-md text-sm text-green-700">
                                            <span className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Cupón <strong>{appliedCoupon.code}</strong> aplicado
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-700" onClick={removeCoupon}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" form="checkout-form" className="w-full" size="lg" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? "Procesando..." : `Pagar ${new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(total)}`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
