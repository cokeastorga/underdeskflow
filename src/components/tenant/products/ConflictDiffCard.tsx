/**
 * ConflictDiffCard — Side-by-side comparison of Platform and External values.
 */

import { useState } from "react";
import { ProductChangeEvent, CHANNEL_DISPLAY } from "@/types/channels";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, ArrowRight, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ConflictDiffCardProps {
    event: ProductChangeEvent;
    productName?: string;
    onResolve: (strategy: "PLATFORM_WINS" | "CHANNEL_WINS") => Promise<void>;
}

export function ConflictDiffCard({ event, productName, onResolve }: ConflictDiffCardProps) {
    const [loading, setLoading] = useState(false);
    const channel = CHANNEL_DISPLAY[event.channelType];

    const handleResolve = async (strategy: "PLATFORM_WINS" | "CHANNEL_WINS") => {
        setLoading(true);
        try {
            await onResolve(strategy);
            toast.success("Conflicto resuelto correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al resolver el conflicto");
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (field: string, value: string) => {
        if (field === "price") {
            return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(value));
        }
        if (field === "stock") {
            return `${value} un.`;
        }
        return value;
    };

    return (
        <Card className="overflow-hidden border-yellow-500/20 bg-yellow-500/5">
            <CardHeader className="pb-3 border-b bg-yellow-500/10 dark:bg-yellow-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <CardTitle className="text-base uppercase tracking-wider">
                            Conflicto de {event.field === "price" ? "Precio" : "Stock"}
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-background">
                        {new Date(event.createdAt).toLocaleDateString()} {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="mb-4">
                    <h3 className="font-bold text-lg">{productName || "Producto sin nombre"}</h3>
                    <p className="text-xs text-muted-foreground font-mono">ID: {event.productId}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-background border rounded-full p-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* PLATFORM SIDE */}
                    <div className="space-y-2 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-primary">Plataforma (Origen)</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatValue(event.field, event.previousValue)}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Valor maestro actual</p>
                    </div>

                    {/* CHANNEL SIDE */}
                    <div className="space-y-2 p-4 rounded-xl border-2 border-border bg-background">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{channel?.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                                {channel?.name} (Externo)
                            </span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatValue(event.field, event.newValue)}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Valor detectado en canal</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-yellow-500/5 border-t p-4 flex gap-3">
                <Button
                    className="flex-1 gap-2"
                    variant="default"
                    disabled={loading}
                    onClick={() => handleResolve("PLATFORM_WINS")}
                >
                    <Check className="h-4 w-4" /> Usar Plataforma
                </Button>
                <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleResolve("CHANNEL_WINS")}
                >
                    <ExternalLink className="h-4 w-4" /> Aceptar Externo
                </Button>
            </CardFooter>
        </Card>
    );
}
