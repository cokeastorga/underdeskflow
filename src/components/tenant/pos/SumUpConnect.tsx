"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
    Wifi, WifiOff, Link2, Link2Off, Loader2, ChevronDown, ChevronUp,
    RefreshCw, ArrowRight, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SumUpMeta {
    enabled: boolean;
    merchantCode: string;
    merchantName: string;
    currency: string;
    connectedAt: string;
}

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
    payment_type: string;
    transaction_code: string;
}

function fmt(amount: number, currency = "CLP") {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

export function SumUpConnect() {
    const { user, storeId } = useAuth();
    const [meta, setMeta] = useState<SumUpMeta | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [apiKey, setApiKey] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txLoading, setTxLoading] = useState(false);
    const [txOffset, setTxOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [showMigration, setShowMigration] = useState(false);
    const [migApiKey, setMigApiKey] = useState("");
    const [migrating, setMigrating] = useState(false);

    // ── Live metadata from Firestore ──────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;
        const ref = doc(db, "stores", storeId, "integrations", "sumup");
        const unsub = onSnapshot(ref, (snap) => {
            setMeta(snap.exists() ? (snap.data() as SumUpMeta) : null);
            setMetaLoading(false);
        });
        return () => unsub();
    }, [storeId]);

    // ── Load transactions ─────────────────────────────────────────────────
    const loadTransactions = async (reset = false) => {
        if (!storeId || txLoading) return;
        const newOffset = reset ? 0 : txOffset;
        setTxLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(
                `/api/pos/sumup/transactions?storeId=${storeId}&limit=20&offset=${newOffset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTransactions(reset ? data.items : [...transactions, ...(data.items ?? [])]);
            setHasMore(data.hasMore);
            setTxOffset(data.offset);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => {
        if (meta?.enabled) loadTransactions(true);
    }, [meta]);

    // ── Connect ───────────────────────────────────────────────────────────
    const handleConnect = async () => {
        if (!apiKey || !storeId) return;
        setConnecting(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/pos/sumup/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ apiKey, storeId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Conectado a ${data.merchantName}`);
            setApiKey(""); // Never show the key again
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setConnecting(false);
        }
    };

    // ── Disconnect ────────────────────────────────────────────────────────
    const handleDisconnect = async () => {
        if (!storeId || !confirm("¿Desconectar SumUp? Esto eliminará el acceso a la API.")) return;
        setDisconnecting(true);
        try {
            const token = await user?.getIdToken();
            await fetch(`/api/pos/sumup/connect?storeId=${storeId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("SumUp desconectado");
            setTransactions([]);
        } catch {
            toast.error("Error al desconectar");
        } finally {
            setDisconnecting(false);
        }
    };

    // ── Migration ─────────────────────────────────────────────────────────
    const handleMigrate = async () => {
        if (!migApiKey || !storeId) return;
        setMigrating(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/integrations/sumup/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ apiKey: migApiKey, storeId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Migración: ${data.imported} transacciones importadas`);
            setMigApiKey("");
            setShowMigration(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setMigrating(false);
        }
    };

    if (metaLoading) {
        return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    // ── Not connected ─────────────────────────────────────────────────────
    if (!meta?.enabled) {
        return (
            <div className="max-w-md mx-auto space-y-6 py-8">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">💳</span>
                    </div>
                    <h2 className="text-xl font-semibold">Conectar SumUp</h2>
                    <p className="text-muted-foreground text-sm">
                        Vincula tu cuenta SumUp para sincronizar transacciones del lector físico.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="sumup-key">SumUp API Key</Label>
                        <Input
                            id="sumup-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="su_sk_..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Genera tu clave en{" "}
                            <a href="https://me.sumup.com/developers" target="_blank" rel="noreferrer"
                                className="underline hover:text-foreground inline-flex items-center gap-1">
                                Portal SumUp <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                    </div>
                    <Button className="w-full" onClick={handleConnect} disabled={connecting || !apiKey}>
                        {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                        {connecting ? "Verificando..." : "Conectar cuenta"}
                    </Button>
                </div>

                {/* Migration section when not connected */}
                <div className="border-t border-border pt-4">
                    <button
                        onClick={() => setShowMigration(!showMigration)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowRight className="h-4 w-4" />
                        Importar historial de ventas desde SumUp
                        {showMigration ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                </div>
            </div>
        );
    }

    // ── Connected ────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Connection card */}
            <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Wifi className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{meta.merchantName}</p>
                        <p className="text-xs text-muted-foreground">
                            Código: {meta.merchantCode} · {meta.currency} · Conectado {new Date(meta.connectedAt).toLocaleDateString("es-CL")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">Activo</Badge>
                    </div>
                    <Button
                        size="sm" variant="outline"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                    >
                        {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
                    </Button>
                </CardContent>
            </Card>

            {/* Transaction history */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm">Historial de transacciones</CardTitle>
                        <CardDescription>Desde tu terminal SumUp físico</CardDescription>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => loadTransactions(true)} disabled={txLoading}>
                        <RefreshCw className={`h-3.5 w-3.5 ${txLoading ? "animate-spin" : ""}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 && !txLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Sin transacciones recientes</p>
                    ) : (
                        <div className="space-y-0 divide-y divide-border">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-mono">{tx.transaction_code}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.timestamp).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                                            · {tx.payment_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{fmt(tx.amount, tx.currency)}</p>
                                        <Badge variant="outline"
                                            className={`text-[10px] ${tx.status === "SUCCESSFUL" ? "border-emerald-500/40 text-emerald-500" : "border-red-500/40 text-red-500"}`}>
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {hasMore && (
                        <Button
                            variant="outline" size="sm" className="w-full mt-3"
                            onClick={() => loadTransactions()}
                            disabled={txLoading}
                        >
                            {txLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            Cargar más
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Migration */}
            <Card>
                <CardHeader className="pb-3">
                    <button
                        onClick={() => setShowMigration(!showMigration)}
                        className="flex items-center gap-2 text-sm font-medium text-left"
                    >
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        Importar historial completo de ventas
                        {showMigration ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>
                </CardHeader>
                {showMigration && (
                    <CardContent className="space-y-3 pt-0">
                        <p className="text-xs text-muted-foreground">
                            Ingresa una API key temporal para importar el historial completo de transacciones a tus órdenes.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                value={migApiKey}
                                onChange={(e) => setMigApiKey(e.target.value)}
                                placeholder="su_sk_..."
                                className="flex-1"
                            />
                            <Button onClick={handleMigrate} disabled={migrating || !migApiKey}>
                                {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
