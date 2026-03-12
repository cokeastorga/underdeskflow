"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { DollarSign, LogIn, LogOut, Minus, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MapPin, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

interface Branch { id: string; name: string; }
interface Register { id: string; name: string; branchId: string; }

function fmt(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);
}

export function CashSession({ onSessionChange }: { onSessionChange?: (sessionId: string | null) => void }) {
    const { user, storeId } = useAuth();
    
    // Core state
    const [session, setSession] = useState<CashSession | null>(null);
    const [conflict, setConflict] = useState<CashSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Context selection
    const [branches, setBranches] = useState<Branch[]>([]);
    const [registers, setRegisters] = useState<Register[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [selectedRegister, setSelectedRegister] = useState<string>("");

    // Form states
    const [openingAmount, setOpeningAmount] = useState("");
    const [closingAmount, setClosingAmount] = useState("");
    const [withdrawalAmount, setWithdrawalAmount] = useState("");
    const [withdrawalNote, setWithdrawalNote] = useState("");
    const [showClose, setShowClose] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);

    // Setup: fetch branches and registers on mount
    useEffect(() => {
        if (!storeId) return;
        const fetchContext = async () => {
            try {
                const [bRes, rRes] = await Promise.all([
                    fetch(`/api/store/branches?storeId=${storeId}`),
                    fetch(`/api/store/registers?storeId=${storeId}`)
                ]);
                const bData = await bRes.json();
                const rData = await rRes.json();
                setBranches(bData.branches || []);
                setRegisters(rData.registers || []);
            } catch (err) {
                console.error("Error fetching branches/registers", err);
            } finally {
                setLoading(false); // Initial load done, but no session loaded yet
            }
        };
        fetchContext();
    }, [storeId]);

    // Secondary load: fetch session when a register is selected
    useEffect(() => {
        if (!storeId || !selectedBranch || !selectedRegister) return;
        
        const loadSession = async () => {
            setLoading(true);
            try {
                const url = `/api/pos/cash-session?storeId=${storeId}&branchId=${selectedBranch}&registerId=${selectedRegister}`;
                const res = await fetch(url);
                const data = await res.json();
                setSession(data.session);
                onSessionChange?.(data.session?.id ?? null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [storeId, selectedBranch, selectedRegister, onSessionChange]);

    const openSession = async (forceTakeover = false) => {
        if (!storeId || !user || !selectedBranch || !selectedRegister) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/pos/cash-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId,
                    branchId: selectedBranch,
                    registerId: selectedRegister,
                    openingAmount: Number(openingAmount),
                    openedBy: user.displayName ?? user.email ?? "Desconocido",
                    openedByUserId: user.uid,
                    deviceId: "pos-webclient-1", // Consider generating/retrieving a stable device ID from localStorage later
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
            // Reload session
            const sRes = await fetch(`/api/pos/cash-session?storeId=${storeId}&branchId=${selectedBranch}&registerId=${selectedRegister}`);
            const sData = await sRes.json();
            setSession(sData.session);
            onSessionChange?.(sData.session?.id ?? null);
        } catch {
            toast.error("Error al abrir la caja");
        } finally {
            setSubmitting(false);
        }
    };

    const addWithdrawal = async () => {
        if (!session || !withdrawalAmount) return;
        setSubmitting(true);
        try {
            await fetch("/api/pos/cash-session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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
            
            // Reload
            const url = `/api/pos/cash-session?storeId=${storeId}&branchId=${selectedBranch}&registerId=${selectedRegister}`;
            const sRes = await fetch(url);
            const sData = await sRes.json();
            setSession(sData.session);
        } catch {
            toast.error("Error al registrar retiro");
        } finally {
            setSubmitting(false);
        }
    };

    const closeSession = async () => {
        if (!session) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/pos/cash-session", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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
            setSession(null);
            onSessionChange?.(null);
        } catch {
            toast.error("Error al cerrar la caja");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && (!branches.length || (!session && selectedRegister))) {
        return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    // Filter registers by selected branch
    const availableRegisters = registers.filter(r => r.branchId === selectedBranch);

    // ── Context Selector (If not selected) ─────────────────────────────────
    if (!selectedBranch || !selectedRegister) {
        return (
            <div className="max-w-md mx-auto space-y-6 py-8">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Selecciona Sucursal y Caja</h2>
                    <p className="text-muted-foreground text-sm">Configura el punto de venta antes de abrir el turno.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Sucursal</Label>
                        <Select value={selectedBranch} onValueChange={(val) => {
                            setSelectedBranch(val);
                            setSelectedRegister(""); // Reset register
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una sucursal..." />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                                {branches.length === 0 && <SelectItem value="none" disabled>No se encontraron sucursales</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Caja Registradora</Label>
                        <Select value={selectedRegister} onValueChange={setSelectedRegister} disabled={!selectedBranch}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una caja..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRegisters.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                                {availableRegisters.length === 0 && <SelectItem value="none" disabled>No se encontraron cajas en esta sucursal</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    // ── No active session (But Branch/Register Selected) ───────────────────
    if (!session) {
        return (
            <div className="max-w-md mx-auto space-y-6 py-8">
                <div className="flex items-center justify-between mb-8 px-4 py-2 border rounded-full bg-muted/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{branches.find(b => b.id === selectedBranch)?.name}</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        <span>{registers.find(r => r.id === selectedRegister)?.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                        setSelectedBranch("");
                        setSelectedRegister("");
                    }}>
                        Cambiar
                    </Button>
                </div>

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
            {/* Session Header / Context */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-sm">
                        <span className="font-medium">Turno activo</span>
                        <span className="text-muted-foreground ml-2">
                            · {branches.find(b => b.id === selectedBranch)?.name} 
                            · {registers.find(r => r.id === selectedRegister)?.name}
                        </span>
                    </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">Abierto</Badge>
            </div>

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
