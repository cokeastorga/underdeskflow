"use client";

/**
 * Channel Connect Wizard
 *
 * Route: /tenant/channels/connect/[channelType]
 *
 * Supports:
 *   - shopify:      Domain input → redirect to Shopify OAuth
 *   - woocommerce:  Site URL + Consumer Key / Consumer Secret form
 *   - mercadolibre: OAuth redirect
 *   - tiendanube:   OAuth redirect
 *   - pedidosya:    Client ID + Client Secret form
 *
 * All form submissions call POST /api/channels/connect which:
 *   1. Verifies credentials (adapter.verifyCredentials)
 *   2. Creates the ChannelConnection doc in Firestore
 *   3. Enqueues the initial full sync
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { CHANNEL_DISPLAY, ChannelType } from "@/types/channels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    ArrowLeft, ExternalLink, CheckCircle2, Loader2,
    Lock, Globe, Key, Server, HelpCircle
} from "lucide-react";

// ─── Channel-specific form configs ───────────────────────────────────────────

interface FormField {
    id: string;
    label: string;
    placeholder: string;
    type?: "text" | "password" | "url";
    hint?: string;
    icon?: any;
}

const CHANNEL_FORMS: Record<string, {
    method: "oauth" | "form";
    oauthLabel?: string;
    helpUrl?: string;
    fields?: FormField[];
    description?: string;
}> = {
    shopify: {
        method: "form",
        helpUrl: "https://help.shopify.com/es/manual/apps/private-apps",
        description: "Ingresa el dominio de tu tienda Shopify para iniciar el flujo de autorización OAuth.",
        fields: [
            {
                id: "shopDomain",
                label: "Dominio de Shopify",
                placeholder: "mi-tienda.myshopify.com",
                type: "text",
                hint: "Solo el dominio, sin https://",
                icon: Globe,
            },
        ],
    },
    woocommerce: {
        method: "form",
        helpUrl: "https://woocommerce.com/document/woocommerce-rest-api/",
        description: "Ingresa la URL de tu sitio WooCommerce y las claves de la REST API.",
        fields: [
            {
                id: "shopDomain",
                label: "URL del sitio WooCommerce",
                placeholder: "https://mi-tienda.com",
                type: "url",
                hint: "URL completa con https://",
                icon: Globe,
            },
            {
                id: "apiKey",
                label: "Consumer Key",
                placeholder: "ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                type: "text",
                icon: Key,
            },
            {
                id: "accessToken",
                label: "Consumer Secret",
                placeholder: "cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                type: "password",
                icon: Lock,
            },
        ],
    },
    mercadolibre: {
        method: "oauth",
        oauthLabel: "Conectar con Mercado Libre",
        description: "Serás redirigido a Mercado Libre para autorizar el acceso a tu cuenta de vendedor.",
        helpUrl: "https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion",
    },
    tiendanube: {
        method: "oauth",
        oauthLabel: "Conectar con Tiendanube",
        description: "Serás redirigido a Tiendanube para autorizar el acceso a tu cuenta.",
        helpUrl: "https://tiendanube.github.io/api-documentation/",
    },
    pedidosya: {
        method: "form",
        helpUrl: "https://developers.pedidosya.com/",
        description: "Ingresa las credenciales de tu aplicación de PedidosYa.",
        fields: [
            {
                id: "apiKey",
                label: "Client ID",
                placeholder: "Client ID de tu app PedidosYa",
                type: "text",
                icon: Key,
            },
            {
                id: "accessToken",
                label: "Client Secret",
                placeholder: "Client Secret de tu app PedidosYa",
                type: "password",
                icon: Lock,
            },
            {
                id: "externalStoreId",
                label: "Restaurant ID",
                placeholder: "ID de tu restaurante en PedidosYa",
                type: "text",
                icon: Server,
            },
        ],
    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelConnectPage() {
    const params = useParams();
    const router = useRouter();
    const { storeId } = useAuth();

    const channelType = (params?.channelType as ChannelType) ?? "shopify";
    const display = CHANNEL_DISPLAY[channelType];
    const formConfig = CHANNEL_FORMS[channelType];

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!display || !formConfig) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Canal no soportado: <code>{channelType}</code></p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/tenant/channels")}>
                    Volver a canales
                </Button>
            </div>
        );
    }

    const handleOAuth = () => {
        if (!storeId) return;
        // Construct OAuth redirect URL via our API which will set the OAuth state param
        const redirectUrl = `/api/channels/oauth/init?channel=${channelType}&storeId=${storeId}`;
        window.location.href = redirectUrl;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/channels/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    channelType,
                    credentials: formData,
                }),
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error ?? `Error ${res.status}`);
            }

            const data = await res.json() as { connectionId: string };
            setSuccess(true);
            toast.success(`¡${display.name} conectado! Iniciando sincronización...`);

            // Trigger initial full sync
            await fetch("/api/internal/channels/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_INTERNAL_TOKEN ?? ""}`,
                },
                body: JSON.stringify({ storeId, connectionId: data.connectionId, mode: "full" }),
            });

            setTimeout(() => router.push("/tenant/channels"), 2000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error al conectar el canal.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto space-y-6">
            {/* Back */}
            <Button variant="ghost" size="sm" onClick={() => router.push("/tenant/channels")} className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a canales
            </Button>

            {/* Header */}
            <div className="flex items-center gap-4">
                <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${display.color}20`, border: `1px solid ${display.color}40` }}
                >
                    {display.icon}
                </div>
                <div>
                    <h1 className="text-xl font-bold">Conectar {display.name}</h1>
                    <Badge variant="outline" className="text-xs mt-0.5">Enterprise</Badge>
                </div>
            </div>

            {/* Success state */}
            {success && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                        <div>
                            <p className="font-semibold">¡{display.name} conectado!</p>
                            <p className="text-sm text-muted-foreground">Redirigiendo al panel de canales...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main form/oauth card */}
            {!success && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Configuración de conexión</CardTitle>
                        {formConfig.description && (
                            <CardDescription>{formConfig.description}</CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {formConfig.method === "oauth" ? (
                            <>
                                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground flex gap-3">
                                    <Globe className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>
                                        Al hacer clic, serás redirigido a {display.name} para autorizarte.
                                        Luego volverás aquí automáticamente.
                                    </span>
                                </div>
                                <Button className="w-full gap-2" onClick={handleOAuth} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                                    {formConfig.oauthLabel ?? `Conectar con ${display.name}`}
                                </Button>
                            </>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                {formConfig.fields?.map(field => {
                                    const Icon = field.icon;
                                    return (
                                        <div key={field.id} className="space-y-1.5">
                                            <Label htmlFor={field.id} className="flex items-center gap-1.5">
                                                {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
                                                {field.label}
                                            </Label>
                                            <Input
                                                id={field.id}
                                                type={field.type ?? "text"}
                                                placeholder={field.placeholder}
                                                value={formData[field.id] ?? ""}
                                                onChange={e => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                                                required
                                            />
                                            {field.hint && (
                                                <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                                            )}
                                        </div>
                                    );
                                })}

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Verificando credenciales...
                                        </>
                                    ) : (
                                        `Conectar ${display.name}`
                                    )}
                                </Button>
                            </form>
                        )}

                        {formConfig.helpUrl && (
                            <a
                                href={formConfig.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                            >
                                <HelpCircle className="h-3.5 w-3.5" />
                                ¿Cómo obtener las credenciales de {display.name}?
                            </a>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Security note */}
            <div className="flex gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                    Tus credenciales se almacenan encriptadas en Firestore y nunca son expuestas en el cliente.
                    Puedes desconectar el canal en cualquier momento desde el panel de canales.
                </span>
            </div>
        </div>
    );
}
