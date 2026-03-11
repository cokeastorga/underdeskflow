"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { DollarSign, LogIn, LogOut, Minus, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface CashSession {
    id: string;
    openedBy: string;
    openingAmount: number;
    openedAt: any;
    status: "open" | "closed" | "taken_over";
    totalSales: number;
    saleCount: number;
    totalWithdrawals: number;
    closingAmount?: number;
    difference?: number;
}

function fmt(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);
}

// ── Main Component ────────────────────────────────────────────────────────

export function CashSession({ onSessionChange }: { onSessionChange?: (sessionId: string | null) => void }) {
    const { user, storeId } = useAuth();
    const [session, setSession] = useState<CashSession | null>(null);
    const [conflict, setConflict] = useState<CashSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [openingAmount, setOpeningAmount] = useState("");
    const [closingAmount, setClosingAmount] = useState("");
    const [withdrawalAmount, setWithdrawalAmount] = useState("");
    const [withdrawalNote, setWithdrawalNote] = useState("");
    const [showClose, setShowClose] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/pos/cash-session?storeId=${storeId}`);
            const data = await res.json();
            setSession(data.session);
            onSessionChange?.(data.session?.id ?? null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [storeId]);

    const openSession = async (forceTakeover = false) => {
        if (!storeId || !user) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/pos/cash-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    openingAmount: Number(openingAmount),
                    openedBy: user.displayName ?? user.email ?? "Desconocido",
                    forceTakeover,
                }),
            });
            const data = await res.json();
            if (data.conflict && !forceTakeover) {
                setConflict(data.existingSession);
                return;
            }
            setConflict(null);
            toast.success("Caja abierta correctamente");
            setOpeningAmount("");
            await load();
        } catch {
            toast.error("Error al abrir la caja");
        } finally {
            setSubmitting(false);
        }
    };

    const addWithdrawal = async () => {
        if (!storeId || !session || !withdrawalAmount) return;
        setSubmitting(true);
        try {
            await fetch("/api/pos/cash-session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    sessionId: session.id,
                    action: "withdrawal",
                    amount: Number(withdrawalAmount),
                    note: withdrawalNote,
                    by: user?.email ?? "Desconocido",
                }),
            });
            toast.success(`Retiro de ${fmt(Number(withdrawalAmount))} registrado`);
            setWithdrawalAmount("");
            setWithdrawalNote("");
            setShowWithdrawal(false);
            await load();
        } catch {
            toast.error("Error al registrar retiro");
        } finally {
            setSubmitting(false);
        }
    };

    const closeSession = async () => {
        if (!storeId || !session) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/pos/cash-session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    sessionId: session.id,
                    action: "close",
                    closingAmount: Number(closingAmount),
                    closedBy: user?.email ?? "Desconocido",
                }),
            });
            const data = await res.json();
            const diff = data.difference ?? 0;
            if (diff === 0) toast.success("Caja cerrada. ¡Cuadra perfecta!");
            else if (diff > 0) toast.success(`Caja cerrada. Sobrante: ${fmt(diff)}`);
            else toast.warning(`Caja cerrada. Faltante: ${fmt(Math.abs(diff))}`);
            setClosingAmount("");
            setShowClose(false);
            onSessionChange?.(null);
            await load();
        } catch {
            toast.error("Error al cerrar la caja");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    // ── No active session ──────────────────────────────────────────────────
    if (!session) {
        return (
            <div className="max-w-md mx-auto space-y-6 py-8">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Abrir turno de caja</h2>
                    <p className="text-muted-foreground text-sm">Ingresa el monto inicial en efectivo para comenzar el turno.</p>
                </div>

                {conflict && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <div className="flex gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Existe un turno abierto</p>
                                <p className="text-xs text-muted-foreground">Abierto por: {conflict.openedBy}</p>
                            </div>
                        </div>
                        <Button
                            size="sm" variant="outline"
                            className="w-full border-amber-500/40"
                            onClick={() => openSession(true)}
                            disabled={submitting}
                        >
                            Tomar control del turno (Force Takeover)
                        </Button>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="openingAmount">Monto inicial en caja (CLP)</Label>
                        <Input
                            id="openingAmount"
                            type="number" min={0}
                            value={openingAmount}
                            onChange={(e) => setOpeningAmount(e.target.value)}
                            placeholder="Ej: 50000"
                            className="text-lg"
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={() => openSession(false)}
                        disabled={submitting || !openingAmount}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                        Abrir turno
                    </Button>
                </div>
            </div>
        );
    }

    // ── Active session ─────────────────────────────────────────────────────
    const expectedCash = session.openingAmount + session.totalSales - session.totalWithdrawals;

    return (
        <div className="space-y-6">
            {/* Session summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Apertura", value: fmt(session.openingAmount), color: "text-primary" },
                    { label: "Ventas POS", value: fmt(session.totalSales), color: "text-emerald-500" },
                    { label: "Retiros", value: fmt(session.totalWithdrawals), color: "text-red-500" },
                    { label: "Esperado en caja", value: fmt(expectedCash), color: "text-blue-500" },
                ].map(card => (
                    <Card key={card.label}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">{card.label}</p>
                            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Session info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex-1 text-sm">
                    <span className="font-medium">Turno activo</span>
                    <span className="text-muted-foreground ml-2">· {session.openedBy} · {session.saleCount} venta{session.saleCount !== 1 ? "s" : ""}</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">Abierto</Badge>
            </div>

            {/* Withdrawal section */}
            <div className="space-y-2">
                <button
                    onClick={() => setShowWithdrawal(!showWithdrawal)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Minus className="h-4 w-4" />
                    Registrar retiro
                    {showWithdrawal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showWithdrawal && (
                    <div className="flex gap-2 p-3 rounded-xl border bg-card">
                        <Input type="number" min={0} value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                            placeholder="Monto" className="w-32" />
                        <Input value={withdrawalNote}
                            onChange={(e) => setWithdrawalNote(e.target.value)}
                            placeholder="Motivo (opcional)" className="flex-1" />
                        <Button onClick={addWithdrawal} disabled={submitting || !withdrawalAmount} size="sm">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Close session */}
            <div className="space-y-2">
                <button
                    onClick={() => setShowClose(!showClose)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar turno
                    {showClose ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showClose && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
                        <div className="space-y-1.5">
                            <Label>Monto físico en caja (CLP)</Label>
                            <Input type="number" min={0} value={closingAmount}
                                onChange={(e) => setClosingAmount(e.target.value)}
                                placeholder={`Esperado: ${fmt(expectedCash)}`} />
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={closeSession}
                            disabled={submitting || !closingAmount}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirmar cierre de caja
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
