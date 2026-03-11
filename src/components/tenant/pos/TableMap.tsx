"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
    Users, Plus, CheckCircle2, AlertCircle, Clock, Loader2,
    X, ChefHat, DollarSign, Trash2, PlusCircle, MinusCircle,
    Armchair, Settings, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableDoc {
    id: string;
    name: string;
    seats: number;
    section?: string;
    status: "free" | "occupied" | "needs_attention" | "reserved" | "closed";
    currentOrderId?: string;
    openedAt?: any;
    openedByName?: string;
}

interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

interface TableOrder {
    id: string;
    items: OrderItem[];
    totals: { discount: number; total: number; subtotal: number };
    notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TableDoc["status"], { label: string; color: string; bg: string; icon: any }> = {
    free: { label: "Libre", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20", icon: CheckCircle2 },
    occupied: { label: "Ocupada", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20", icon: Users },
    needs_attention: { label: "Atención", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 animate-pulse", icon: AlertCircle },
    reserved: { label: "Reservada", color: "text-violet-600", bg: "bg-violet-500/10 border-violet-500/30", icon: Clock },
    closed: { label: "Cerrada", color: "text-muted-foreground", bg: "bg-muted/30 border-border", icon: X },
};

function fmt(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

function timeSince(ts: any) {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min`;
}

// ─── TableCard ────────────────────────────────────────────────────────────────
function TableCard({
    table,
    onSelect,
}: {
    table: TableDoc;
    onSelect: (t: TableDoc) => void;
}) {
    const cfg = STATUS_CONFIG[table.status];
    const Icon = cfg.icon;

    return (
        <button
            onClick={() => onSelect(table)}
            className={`relative w-full aspect-square rounded-2xl border-2 ${cfg.bg} flex flex-col items-center justify-center gap-1.5 p-3 transition-all group`}
        >
            <Icon className={`h-6 w-6 ${cfg.color}`} />
            <span className="font-bold text-sm leading-tight text-center">{table.name}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Armchair className="h-3 w-3" />
                {table.seats}
            </div>
            {table.status === "occupied" && table.openedAt && (
                <span className="absolute top-1.5 right-2 text-[9px] font-mono text-blue-500">
                    {timeSince(table.openedAt)}
                </span>
            )}
            {table.section && (
                <span className="text-[9px] text-muted-foreground">{table.section}</span>
            )}
            <Badge variant="outline" className={`text-[9px] h-4 mt-0.5 ${cfg.color} border-current/30`}>
                {cfg.label}
            </Badge>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TableMap() {
    const { storeId, user } = useAuth();

    // Tables list
    const [tables, setTables] = useState<TableDoc[]>([]);
    const [loadingTables, setLoadingTables] = useState(true);
    const [section, setSection] = useState("all");

    // Selected table state
    const [selectedTable, setSelectedTable] = useState<TableDoc | null>(null);
    const [tableOrder, setTableOrder] = useState<TableOrder | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);

    // Dialogs
    const [showNewTableDialog, setShowNewTableDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [payMethod, setPayMethod] = useState("cash");

    // New table form
    const [newName, setNewName] = useState("");
    const [newSeats, setNewSeats] = useState(4);
    const [newSection, setNewSection] = useState("");
    const [creatingTable, setCreatingTable] = useState(false);

    // Add item form (inline)
    const [quickItem, setQuickItem] = useState({ name: "", price: "", quantity: 1 });
    const [addingItem, setAddingItem] = useState(false);

    // Action loading
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Sections derived from tables ──────────────────────────────────────────
    const sections = ["all", ...Array.from(new Set(tables.map((t) => t.section).filter(Boolean))) as string[]];
    const filtered = section === "all" ? tables : tables.filter((t) => t.section === section);

    // ── Live listener ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;
        const q = query(
            collection(db, "stores", storeId, "tables"),
            orderBy("name")
        );
        const unsub = onSnapshot(q, (snap) => {
            setTables(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TableDoc)));
            setLoadingTables(false);
        });
        return () => unsub();
    }, [storeId]);

    // ── Refresh selected table when it changes in Firestore ───────────────────
    useEffect(() => {
        if (!selectedTable) return;
        const updated = tables.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
    }, [tables]);

    // ── Load table order on select ────────────────────────────────────────────
    const loadTableOrder = useCallback(async (table: TableDoc) => {
        if (!storeId || !table.currentOrderId) {
            setTableOrder(null);
            return;
        }
        setOrderLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/pos/tables/${table.id}?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTableOrder(data.order ?? null);
        } catch {
            setTableOrder(null);
        } finally {
            setOrderLoading(false);
        }
    }, [storeId, user]);

    const handleSelectTable = async (table: TableDoc) => {
        setSelectedTable(table);
        await loadTableOrder(table);
    };

    // ── Open table ────────────────────────────────────────────────────────────
    const handleOpenTable = async () => {
        if (!selectedTable || !storeId) return;
        setActionLoading("open");
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/pos/tables/${selectedTable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storeId, action: "open" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${selectedTable.name} abierta`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Add item ──────────────────────────────────────────────────────────────
    const handleAddItem = async () => {
        if (!selectedTable || !storeId || !quickItem.name || !quickItem.price) return;
        setAddingItem(true);
        try {
            const token = await user?.getIdToken();
            const item: OrderItem = {
                productId: `manual_${Date.now()}`,
                name: quickItem.name,
                quantity: quickItem.quantity,
                price: parseFloat(quickItem.price),
            };
            const res = await fetch(`/api/pos/tables/${selectedTable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storeId, action: "addItem", items: [item] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTableOrder((prev) => prev ? { ...prev, items: data.items, totals: { ...prev.totals, total: data.total } } : null);
            setQuickItem({ name: "", price: "", quantity: 1 });
            toast.success(`${item.name} agregado`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setAddingItem(false);
        }
    };

    // ── Close table ───────────────────────────────────────────────────────────
    const handleCloseTable = async () => {
        if (!selectedTable || !storeId) return;
        setActionLoading("close");
        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/pos/tables/${selectedTable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storeId, action: "close", paymentMethod: payMethod }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Mesa cerrada — ${fmt(data.total)}`);
            setTableOrder(null);
            setSelectedTable(null);
            setShowCloseDialog(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Cancel / void ─────────────────────────────────────────────────────────
    const handleCancelTable = async () => {
        if (!selectedTable || !storeId) return;
        if (!confirm(`¿Anular la orden de ${selectedTable.name}?`)) return;
        setActionLoading("cancel");
        try {
            const token = await user?.getIdToken();
            await fetch(`/api/pos/tables/${selectedTable.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storeId, action: "cancel" }),
            });
            toast.success("Orden anulada");
            setTableOrder(null);
            setSelectedTable(null);
        } catch {
            toast.error("Error al anular");
        } finally {
            setActionLoading(null);
        }
    };

    // ── Create table ──────────────────────────────────────────────────────────
    const handleCreateTable = async () => {
        if (!storeId || !newName) return;
        setCreatingTable(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/pos/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ storeId, name: newName, seats: newSeats, section: newSection }),
            });
            if (!res.ok) throw new Error("Error al crear mesa");
            toast.success(`${newName} creada`);
            setNewName(""); setNewSeats(4); setNewSection("");
            setShowNewTableDialog(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setCreatingTable(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-6 h-full">
            {/* Left: Table grid */}
            <div className="flex-1 min-w-0 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-base">Mapa de mesas</h2>
                        <p className="text-xs text-muted-foreground">
                            {tables.filter((t) => t.status === "occupied").length} ocupadas · {tables.filter((t) => t.status === "free").length} libres
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setShowNewTableDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Nueva mesa
                    </Button>
                </div>

                {/* Section filter */}
                {sections.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                        {sections.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSection(s)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    section === s
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:bg-muted"
                                }`}
                            >
                                {s === "all" ? "Todas" : s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {loadingTables ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                        <Armchair className="h-12 w-12 opacity-20" />
                        <div className="text-center">
                            <p className="font-medium text-sm">Sin mesas configuradas</p>
                            <p className="text-xs">Crea tus primeras mesas para gestionar turnos</p>
                        </div>
                        <Button onClick={() => setShowNewTableDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Crear primera mesa
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {filtered.map((t) => (
                            <TableCard
                                key={t.id}
                                table={t}
                                onSelect={handleSelectTable}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Table detail panel */}
            {selectedTable && (
                <div className="w-80 flex-shrink-0 space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            {/* Table header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedTable.name}</h3>
                                    {selectedTable.section && (
                                        <p className="text-xs text-muted-foreground">{selectedTable.section}</p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${STATUS_CONFIG[selectedTable.status].color} border-current/30`}
                                    >
                                        {STATUS_CONFIG[selectedTable.status].label}
                                    </Badge>
                                    <Button
                                        size="icon" variant="ghost" className="h-7 w-7"
                                        onClick={() => setSelectedTable(null)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {selectedTable.openedByName && (
                                <p className="text-xs text-muted-foreground">
                                    Abierta por {selectedTable.openedByName} · {timeSince(selectedTable.openedAt)}
                                </p>
                            )}

                            {/* Free table actions */}
                            {selectedTable.status === "free" && (
                                <Button
                                    className="w-full" size="sm"
                                    onClick={handleOpenTable}
                                    disabled={actionLoading === "open"}
                                >
                                    {actionLoading === "open"
                                        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        : <Users className="h-4 w-4 mr-2" />}
                                    Abrir mesa
                                </Button>
                            )}

                            {/* Occupied table: order items */}
                            {selectedTable.status === "occupied" && (
                                <>
                                    {/* Order items */}
                                    {orderLoading ? (
                                        <div className="flex justify-center py-3">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                            {tableOrder?.items?.length === 0 || !tableOrder ? (
                                                <p className="text-xs text-muted-foreground text-center py-3">Sin ítems aún</p>
                                            ) : (
                                                tableOrder.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{item.quantity}x {item.name}</span>
                                                        <span className="text-muted-foreground">{fmt(item.price * item.quantity)}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* Total */}
                                    {tableOrder && tableOrder.items.length > 0 && (
                                        <div className="flex justify-between border-t pt-2 font-semibold text-sm">
                                            <span>Total</span>
                                            <span>{fmt(tableOrder.totals?.total ?? 0)}</span>
                                        </div>
                                    )}

                                    {/* Quick add item */}
                                    <div className="space-y-2 border-t pt-3">
                                        <p className="text-xs font-medium text-muted-foreground">Agregar ítem rápido</p>
                                        <Input
                                            value={quickItem.name}
                                            onChange={(e) => setQuickItem({ ...quickItem, name: e.target.value })}
                                            placeholder="Nombre..."
                                            className="h-8 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={quickItem.price}
                                                onChange={(e) => setQuickItem({ ...quickItem, price: e.target.value })}
                                                placeholder="Precio"
                                                className="h-8 text-sm w-24"
                                            />
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setQuickItem((v) => ({ ...v, quantity: Math.max(1, v.quantity - 1) }))}>
                                                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-bold">{quickItem.quantity}</span>
                                                <button onClick={() => setQuickItem((v) => ({ ...v, quantity: v.quantity + 1 }))}>
                                                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                            <Button size="sm" className="h-8 px-3" onClick={handleAddItem} disabled={addingItem}>
                                                {addingItem ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 border-t pt-3">
                                        <Button
                                            size="sm" variant="destructive" className="flex-1 h-8 text-xs"
                                            onClick={handleCancelTable}
                                            disabled={!!actionLoading}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Anular
                                        </Button>
                                        <Button
                                            size="sm" className="flex-1 h-8 text-xs"
                                            onClick={() => setShowCloseDialog(true)}
                                            disabled={!!actionLoading}
                                        >
                                            <DollarSign className="h-3.5 w-3.5 mr-1" /> Cobrar
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* New table dialog */}
            <Dialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva mesa</DialogTitle>
                        <DialogDescription>Configura la nueva mesa para tu local</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Nombre</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Mesa 1, Barra A, Terraza 3..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Asientos</Label>
                                <Input
                                    type="number" min={1} max={20}
                                    value={newSeats}
                                    onChange={(e) => setNewSeats(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sección (opcional)</Label>
                                <Input
                                    value={newSection}
                                    onChange={(e) => setNewSection(e.target.value)}
                                    placeholder="Interior, Terraza..."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewTableDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCreateTable} disabled={creatingTable || !newName}>
                            {creatingTable ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Crear mesa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close/Pay dialog */}
            <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cobrar {selectedTable?.name}</DialogTitle>
                        <DialogDescription>
                            Total a cobrar: <strong>{tableOrder ? fmt(tableOrder.totals?.total ?? 0) : "—"}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label>Método de pago</Label>
                        <Select value={payMethod} onValueChange={setPayMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Efectivo</SelectItem>
                                <SelectItem value="card">Tarjeta</SelectItem>
                                <SelectItem value="transfer">Transferencia</SelectItem>
                                <SelectItem value="sumup">SumUp (lector)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancelar</Button>
                        <Button onClick={handleCloseTable} disabled={actionLoading === "close"}>
                            {actionLoading === "close" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                            Confirmar cobro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
