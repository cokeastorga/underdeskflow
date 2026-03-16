"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { XCircle, RefreshCcw, ShoppingCart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const MP_ERROR_MESSAGES: Record<string, string> = {
    cc_rejected_bad_filled_cvv: "El código de seguridad ingresado es incorrecto. Verifica el CVV de tu tarjeta.",
    cc_rejected_bad_filled_date: "La fecha de vencimiento ingresada no es válida.",
    cc_rejected_bad_filled_other: "Algún dato de tu tarjeta está incorrecto. Revísalos antes de intentar nuevamente.",
    cc_rejected_call_for_authorize: "Tu banco requiere autorización. Llama al número del reverso de tu tarjeta.",
    cc_rejected_card_disabled: "Tu tarjeta está deshabilitada. Contacta a tu banco para activarla.",
    cc_rejected_insufficient_amount: "Fondos insuficientes. Intenta con otra tarjeta o revisa tu saldo.",
    cc_rejected_fraud: "Tu banco rechazó el pago por motivos de seguridad. Usa otro medio de pago.",
    cc_rejected_high_risk: "El pago fue rechazado por un análisis de riesgo. Usa otro medio de pago.",
    rejected: "El pago fue rechazado. Intenta con otro método de pago o contacta a tu banco.",
    in_process: "Tu pago está siendo procesado. Recibirás una confirmación pronto.",
    cancelled: "Cancelaste el proceso de pago. Puedes intentarlo nuevamente cuando quieras.",
};

export default function CheckoutFailurePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const storeId = params.storeId as string;

    // Mercado Pago sends error codes via these params
    const mpStatus      = searchParams.get("collection_status") ?? searchParams.get("status");
    const mpStatusDetail = searchParams.get("status_detail");
    const orderId       = searchParams.get("external_reference") ?? searchParams.get("id");

    const errorMessage =
        (mpStatusDetail && MP_ERROR_MESSAGES[mpStatusDetail]) ||
        (mpStatus && MP_ERROR_MESSAGES[mpStatus]) ||
        "Tu pago no pudo completarse. No se realizó ningún cargo.";

    const handleRetry = () => {
        if (orderId) {
            router.push(`/${storeId}/checkout?retry=${orderId}`);
        } else {
            router.push(`/${storeId}/checkout`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Red header band */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-white text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                                <XCircle className="h-10 w-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Pago No Procesado</h1>
                        <p className="text-red-100 mt-1 text-sm">No se realizó ningún cobro a tu cuenta</p>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                        {/* Error message box */}
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                            <p className="text-red-700 text-sm font-medium leading-relaxed">
                                ⚠️ {errorMessage}
                            </p>
                            {mpStatusDetail && (
                                <p className="text-red-400 text-xs mt-2 font-mono">
                                    Código: {mpStatusDetail}
                                </p>
                            )}
                        </div>

                        {/* What to do */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-700">¿Qué puedes hacer?</p>
                            <ul className="text-sm text-gray-500 space-y-1.5">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    Verifica que los datos de tu tarjeta sean correctos.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    Asegúrate de tener saldo suficiente.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    Intenta con una tarjeta o método de pago diferente.
                                </li>
                            </ul>
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleRetry}
                                className="w-full gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3 rounded-xl"
                                size="lg"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Intentar Nuevamente
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/${storeId}/cart`)}
                                    className="gap-2 rounded-xl"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Ver Carrito
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push(`/${storeId}/contact`)}
                                    className="gap-2 rounded-xl text-gray-500"
                                >
                                    <Phone className="h-4 w-4" />
                                    Contactar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="px-8 pb-6 text-center">
                        <p className="text-gray-400 text-xs">
                            🔒 Tu información financiera está protegida. Ningún dato fue almacenado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
