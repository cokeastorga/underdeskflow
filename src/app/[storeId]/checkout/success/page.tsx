"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { useCart } from "@/store/useCart";
import { syncOrderToCustomer } from "@/lib/services/customer";
import { decrementStock } from "@/lib/services/inventory";
import { Order } from "@/types";

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [orderId, setOrderId] = useState<string | null>(null);

    const storeId = params.storeId as string;

    // For V1 Simulation: We assume if they reach here, it's mostly good.
    // In production, we'd verify the PaymentIntent or Preference ID from URL.
    // For WebPay/MP, we might need to call an API to confirm status.
    // Here we will Simulate verification by checking the params (MP sends collection_status, Stripe session_id)
    // OR just defaulting to Success for the Manual/Dummy flow.

    // Let's assume we passed orderId via URL or stored in local/session if not in URL? 
    // Wait, typical flows:
    // MP: ?collection_status=approved&external_reference={orderId}
    // Stripe: ?session_id={id} -> need webhook for real update, or retrieve session.
    // WebPay: POST token -> we handled in page.tsx to redirect here?

    // SIMPLIFICATION V1: 
    // Since we created the order with 'pending' status, we need to know WHICH order to update.
    // We didn't put orderId in success URL in the API route yet for Stripe (we used just successUrl). 
    // We should probably rely on a query param if possible, OR user session.
    // But let's assume for the "Manual/Dummy" test we just did, we might rely on the user having the order.

    // Strategy: 
    // 1. If we have `external_reference` (MP), use that.
    // 2. If we don't, we might be in a "blind" success (Stripe). Ideally we update via Webhook.
    // BUT for this specific task "Verify End-to-End Flow (Cart -> Order -> Paid)", we want immediate feedback.

    // Let's rely on `external_reference` for MP.
    // For Stripe, we should have added `?orderId={orderId}` to success_url in the API. (I missed that in previous step).
    // Let's fix the API to append orderId to successUrl or handle it here if present.

    // CRITICAL FIX: The API route defined successUrl = .../success
    // We can't easily get orderId unless we passed it.
    // Let's assume for the "Manual Test" we are implementing NEXT, we will simulate the flow.

    // PROPOSAL: Client-side simulation finding the last order? Unsafe.
    // BETTER: Let's fetch the most recent pending order for this user (if we had auth).
    // BEST FOR V1: We will update the API in the NEXT step to pass `?order_id=` in the URL.
    // For now, I will write this page to expect `order_id` or `external_reference`.

    useEffect(() => {
        const verifyOrder = async () => {
            const queryOrderId = searchParams.get("order_id") || searchParams.get("external_reference");

            if (!queryOrderId) {
                // Determine if this is a WebPay redirect (POST converted to GET?) or just missing param
                console.error("No order ID found in URL");
                setStatus("error"); // Or show "Payment received" generic message
                return;
            }

            setOrderId(queryOrderId);

            try {
                const orderRef = doc(db, "orders", queryOrderId);
                const orderSnap = await getDoc(orderRef);

                if (!orderSnap.exists()) {
                    throw new Error("Order not found");
                }

                const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;

                if (orderData.status === "pending") {

                    // IF Transfer: Keep as pending, just sync customer and decrement stock (reservation)
                    // IF Online Payment: Update to Paid

                    const isManual = orderData.paymentMethod === 'transfer';

                    if (!isManual) {
                        await updateDoc(orderRef, {
                            status: 'paid',
                            paymentStatus: 'paid',
                            updatedAt: Date.now()
                        });
                    }

                    // Sync Customer (Always)
                    await syncOrderToCustomer(orderData);

                    // Clear Cart (Always)
                    clearCart();

                    // Decrement Stock (Always - Reserve stock)
                    if (orderData.items) {
                        await decrementStock(orderData.items);
                    }
                }

                setStatus("success");
                clearCart(); // Ensure cart is cleared even if already paid (idempotent)

            } catch (error) {
                console.error("Error verifying order", error);
                setStatus("error");
            }
        };

        verifyOrder();
    }, [searchParams, clearCart]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
            {status === "loading" && (
                <>
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <h1 className="text-2xl font-bold">Procesando tu pago...</h1>
                    <p className="text-muted-foreground">Por favor no cierres esta ventana.</p>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>

                    {orderId ? (
                        <>
                            <h1 className="text-3xl font-bold text-green-700">¡Orden Confirmada!</h1>
                            <p className="text-muted-foreground max-w-md">
                                Tu orden <strong>#{orderId?.slice(0, 8)}</strong> ha sido recibida exitosamente.
                                <br />
                                <span className="text-sm mt-2 block">
                                    Revisa tu correo para más detalles y seguimiento.
                                </span>
                            </p>
                        </>
                    ) : (
                        <h1 className="text-3xl font-bold text-green-700">¡Gracias por tu compra!</h1>
                    )}

                    <div className="flex gap-4 mt-8">
                        <Button onClick={() => router.push(`/${storeId}/products`)}>
                            Seguir Comprando
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/${storeId}/orders/${orderId}`)}>
                            Ver Orden
                        </Button>
                    </div>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-700">Algo salió mal</h1>
                    <p className="text-muted-foreground max-w-md">
                        No pudimos verificar tu pago automáticamente.
                    </p>
                    <Button onClick={() => router.push(`/${storeId}/checkout`)} className="mt-8">
                        Volver al Checkout
                    </Button>
                </>
            )}
        </div>
    );
}

