"use client"

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { useRef, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Wallet, Loader2, Tag, X, Zap, Truck, Store, MapPin } from "lucide-react";
import { addDoc, collection, query, where, getDocs, updateDoc, increment, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coupon } from "@/types";
import { formatPrice } from "@/lib/utils/currency";

export default function CheckoutPage() {
    const { items, totalPrice, clearCart } = useCart();
    const params = useParams(); // Get params
    const storeId = params.storeId as string;
    const storeItems = items.filter(item => item.storeId === storeId);
    const [mounted, setMounted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer" | "wallet" | "cash">("card");
    const [selectedProvider, setSelectedProvider] = useState<"webpay" | "mercadopago" | "flow" | "stripe">("webpay");
    const [loading, setLoading] = useState(false);

    // Data State
    const [rut, setRut] = useState("");
    const [address, setAddress] = useState({
        street: "",
        number: "",
        apartment: "",
        commune: "",
        region: "",
    });

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const router = useRouter();
    const webpayFormRef = useRef<HTMLFormElement>(null);

    // Delivery & Locations State
    const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
    const [selectedCarrier, setSelectedCarrier] = useState<"chilexpress" | "blue" | null>(null);
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

    const subtotal = totalPrice(storeId);

    // Calculate discount
    const discountAmount = appliedCoupon ? (
        appliedCoupon.type === 'percentage'
            ? (subtotal * appliedCoupon.value) / 100
            : appliedCoupon.value
    ) : 0;

    // Shipping Logic
    const hasFreeShipping = storeItems.some(item => (item as any).freeShipping === true);
    const shippingFee = deliveryMethod === "shipping" && !hasFreeShipping && selectedCarrier ? 4990 : 0;

    const total = Math.max(0, subtotal - discountAmount + shippingFee);

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
                toast.error(`El monto mínimo para este cupón es ${formatPrice(coupon.minOrderAmount)}`);
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
                rut: formData.get('rut') || rut,
                items: storeItems.map(item => ({
                    productId: item.id,
                    variantId: item.selectedVariantId || null,
                    selectedOptions: item.selectedOptions || null,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    sku: item.sku || '',
                    category: item.category || ''
                })),
                subtotal,
                discountAmount,
                total,
                status: 'pending',
                paymentMethod,
                deliveryMethod,
                shippingAddress: deliveryMethod === 'shipping' ? {
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    address: `${formData.get('street')} ${formData.get('number')}${formData.get('apartment') ? `, ${formData.get('apartment')}` : ''}`,
                    city: formData.get('commune') as string,
                    region: formData.get('region') as string,
                    phone: formData.get('phone') as string,
                } : null,
                shippingCarrier: deliveryMethod === 'shipping' ? selectedCarrier : null,
                shippingCost: shippingFee,
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
            clearCart(storeId);
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
                    rut: formData.get('rut') || rut,
                    items: storeItems.map(item => ({
                        productId: item.id,
                        variantId: item.selectedVariantId || null,
                        selectedOptions: item.selectedOptions || null,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        sku: item.sku || '',
                        category: item.category || ''
                    })),
                    subtotal,
                    discountAmount,
                    total,
                    status: 'pending',
                    paymentMethod,
                    provider: selectedProvider,
                    deliveryMethod,
                    shippingAddress: deliveryMethod === 'shipping' ? {
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                        address: `${formData.get('street')} ${formData.get('number')}${formData.get('apartment') ? `, ${formData.get('apartment')}` : ''}`,
                        city: formData.get('commune') as string,
                        region: formData.get('region') as string,
                        phone: formData.get('phone') as string,
                    } : null,
                    shippingCarrier: deliveryMethod === 'shipping' ? selectedCarrier : null,
                    shippingCost: shippingFee,
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Teléfono</label>
                                    <input name="phone" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="+56 9..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">RUT</label>
                                    <input
                                        name="rut"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                        placeholder="12.345.678-9"
                                        value={rut}
                                        onChange={(e) => setRut(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <label className="text-sm font-medium">Método de Entrega</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMethod("shipping")}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${deliveryMethod === "shipping" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background hover:border-muted-foreground/30"}`}
                                    >
                                        <Truck className={`h-6 w-6 mb-2 ${deliveryMethod === "shipping" ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className="text-sm font-semibold">Envío a Domicilio</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMethod("pickup")}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${deliveryMethod === "pickup" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background hover:border-muted-foreground/30"}`}
                                    >
                                        <Store className={`h-6 w-6 mb-2 ${deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className="text-sm font-semibold">Retiro en Tienda</span>
                                    </button>
                                </div>
                            </div>

                            {deliveryMethod === "shipping" && (
                                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Calle / Avenida</label>
                                            <input name="street" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Número</label>
                                            <input name="number" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Depto / Casa / Oficina (Opcional)</label>
                                        <input name="apartment" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Comuna</label>
                                            <input name="commune" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Región</label>
                                            <select name="region" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                                                <option value="">Seleccionar Región</option>
                                                <option value="RM">Región Metropolitana</option>
                                                <option value="XV">Arica y Parinacota</option>
                                                <option value="I">Tarapacá</option>
                                                <option value="II">Antofagasta</option>
                                                <option value="III">Atacama</option>
                                                <option value="IV">Coquimbo</option>
                                                <option value="V">Valparaíso</option>
                                                <option value="VI">O'Higgins</option>
                                                <option value="VII">Maule</option>
                                                <option value="XVI">Ñuble</option>
                                                <option value="VIII">Biobío</option>
                                                <option value="IX">Araucanía</option>
                                                <option value="XIV">Los Ríos</option>
                                                <option value="X">Los Lagos</option>
                                                <option value="XI">Aysén</option>
                                                <option value="XII">Magallanes</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {deliveryMethod === "shipping" && (
                                <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-medium flex items-center justify-between">
                                        Empresa de Trasporte
                                        {hasFreeShipping && (
                                            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                                <Zap className="h-3 w-3 fill-current" />
                                                Envío Gratis Aplicado
                                            </span>
                                        )}
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            disabled={hasFreeShipping}
                                            onClick={() => setSelectedCarrier("chilexpress")}
                                            className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${hasFreeShipping ? "bg-gray-50 border-gray-100 opacity-80 cursor-not-allowed" : selectedCarrier === "chilexpress" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background hover:border-muted-foreground/30 text-muted-foreground"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-11 relative flex items-center justify-center bg-white rounded-md p-1 border">
                                                    <img src="data:image/png;base64,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" alt="Chilexpress" className="max-h-full max-w-full object-contain" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-bold ${selectedCarrier === "chilexpress" || hasFreeShipping ? "text-gray-900" : ""}`}>Chilexpress</p>
                                                    <p className="text-[10px] uppercase font-medium tracking-tight">Express 24h</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {hasFreeShipping ? (
                                                    <span className="text-xs font-bold text-green-600">Gratis</span>
                                                ) : (
                                                    <span className="text-xs font-bold">$4.990</span>
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={hasFreeShipping}
                                            onClick={() => setSelectedCarrier("blue")}
                                            className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${hasFreeShipping ? "bg-gray-50 border-gray-100 opacity-80 cursor-not-allowed" : selectedCarrier === "blue" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background hover:border-muted-foreground/30 text-muted-foreground"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-8 relative flex items-center justify-center bg-white rounded-md p-1 border">
                                                    <img src="data:image/png;base64,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" alt="Blue Express" className="max-h-full max-w-full object-contain" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-bold ${selectedCarrier === "blue" || hasFreeShipping ? "text-gray-900" : ""}`}>Blue Express</p>
                                                    <p className="text-[10px] uppercase font-medium tracking-tight">Eco-Standard</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {hasFreeShipping ? (
                                                    <span className="text-xs font-bold text-green-600">Gratis</span>
                                                ) : (
                                                    <span className="text-xs font-bold">$4.990</span>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {deliveryMethod === "pickup" && (
                                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-medium">Punto de Retiro</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {locations.length > 0 ? (
                                            locations.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => setSelectedLocationId(loc.id)}
                                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedLocationId === loc.id ? "border-primary bg-primary/5" : "border-muted bg-background hover:border-muted-foreground/30"}`}
                                                >
                                                    <MapPin className={`h-5 w-5 mt-0.5 ${selectedLocationId === loc.id ? "text-primary" : "text-muted-foreground"}`} />
                                                    <div>
                                                        <p className="font-semibold text-sm">{loc.name}</p>
                                                        <p className="text-xs text-muted-foreground">{loc.address}</p>
                                                        {loc.hours && <p className="text-[10px] text-muted-foreground mt-1">{loc.hours}</p>}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">No hay puntos de retiro disponibles.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <label className="text-sm font-medium">Medio de Pago</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("webpay"); setPaymentMethod("card"); }}
                                        className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${selectedProvider === "webpay" ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-10 relative flex items-center justify-center bg-white rounded-lg p-1">
                                                <img src="data:image/png;base64,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" alt="Webpay Plus" className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">Webpay Plus</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Débito y Crédito</p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedProvider === "webpay" ? "border-primary bg-primary" : "border-gray-200"}`}>
                                            {selectedProvider === "webpay" && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("mercadopago"); setPaymentMethod("card"); }}
                                        className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${selectedProvider === "mercadopago" ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-10 relative flex items-center justify-center bg-white rounded-lg p-1">
                                                <img src="data:image/png;base64,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" alt="Mercado Pago" className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">Mercado Pago</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Billetera y Tarjetas</p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedProvider === "mercadopago" ? "border-primary bg-primary" : "border-gray-200"}`}>
                                            {selectedProvider === "mercadopago" && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedProvider("flow"); setPaymentMethod("card"); }}
                                        className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${selectedProvider === "flow" ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-10 relative flex items-center justify-center bg-white rounded-lg p-1">
                                                <img src="data:image/png;base64,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" alt="Flow" className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">Flow</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Multimedios de Pago</p>
                                            </div>
                                        </div>
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedProvider === "flow" ? "border-primary bg-primary" : "border-gray-200"}`}>
                                            {selectedProvider === "flow" && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        <div className="bg-card p-6 rounded-lg border sticky top-24 space-y-6">
                            <h2 className="font-bold text-xl">Resumen de Compra</h2>

                            <div className="space-y-4">
                                {storeItems.map((item) => (
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
                                        <span>{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                Descuento ({appliedCoupon.code})
                                            </span>
                                            <span>-{formatPrice(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span>Envío</span>
                                        <span className={shippingFee === 0 && deliveryMethod === "shipping" ? "text-green-600 font-bold" : ""}>
                                            {deliveryMethod === "pickup" ? "Gratis (Retiro)" : shippingFee === 0 ? "Gratis" : formatPrice(shippingFee)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <div className="pt-2 pb-2">
                                    {!appliedCoupon ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Código de descuento"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
                                    {loading ? "Procesando..." : `Pagar ${formatPrice(total)}`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
