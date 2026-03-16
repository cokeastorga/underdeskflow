"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowRightLeft,
    Loader2,
    PackageCheck,
    AlertTriangle,
    History,
} from "lucide-react";

interface Branch {
    id: string;
    name: string;
    address?: string;
}

interface Variant {
    id: string;
    name: string;
    sku?: string;
    productName?: string;
}

interface TransferRecord {
    id: string;
    variantId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    note?: string;
    createdAt: number;
}

async function getToken(): Promise<string | null> {
    const user = getAuth().currentUser;
    return user ? user.getIdToken() : null;
}

export default function TransferStockPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") ?? "";

    const [branches, setBranches] = useState<Branch[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const [fromLocationId, setFromLocationId] = useState("");
    const [toLocationId, setToLocationId]     = useState("");
    const [variantId,     setVariantId]       = useState("");
    const [quantity,      setQuantity]        = useState("");
    const [note,          setNote]            = useState("");

    const [recentTransfers, setRecentTransfers] = useState<TransferRecord[]>([]);

    // ── Load branches ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;

        const loadData = async () => {
            setDataLoading(true);
            try {
                // Branches
                const branchRes = await fetch(`/api/store/branches?storeId=${storeId}`);
                const branchData = await branchRes.json();
                setBranches((branchData.branches ?? []).filter((b: Branch & { isActive?: boolean }) => b.isActive !== false));

                // Variants (load from products sub-collection or flat variants)
                const q = query(collection(db, "variants"), where("storeId", "==", storeId));
                const snap = await getDocs(q);
                setVariants(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Variant, "id">) })));

                // Recent transfers for this store
                const tq = query(
                    collection(db, "inventory_movements"),
                    where("storeId", "==", storeId),
                    where("type", "in", ["TRANSFER_OUT", "TRANSFER_IN"])
                );
                const tSnap = await getDocs(tq);
                const raw = tSnap.docs.map(d => ({ id: d.id, ...d.data() })) as TransferRecord[];
                raw.sort((a, b) => b.createdAt - a.createdAt);
                setRecentTransfers(raw.slice(0, 10));
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, [storeId]);

    // ── Submit transfer ────────────────────────────────────────────────────
    const handleTransfer = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!storeId) { toast.error("storeId no configurado"); return; }
        if (fromLocationId === toLocationId) {
            toast.error("El origen y destino no pueden ser el mismo"); return;
        }

        const qty = Number(quantity);
        if (!qty || qty <= 0) { toast.error("Ingresa una cantidad válida"); return; }

        setLoading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");

            const res = await fetch("/api/inventory/transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ storeId, variantId, fromLocationId, toLocationId, quantity: qty, note }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("✅ Transferencia ejecutada con éxito");
            setQuantity("");
            setNote("");

            // Optimistic prepend to history
            setRecentTransfers(prev => [{
                id: data.transferOut?.id ?? Date.now().toString(),
                variantId, fromLocationId, toLocationId,
                quantity: qty,
                note,
                createdAt: Date.now(),
            }, ...prev].slice(0, 10));
        } catch (err: any) {
            toast.error(err.message ?? "Error al transferir stock");
        } finally {
            setLoading(false);
        }
    }, [storeId, variantId, fromLocationId, toLocationId, quantity, note]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const branchName = (id: string) => branches.find(b => b.id === id)?.name ?? id;
    const variantLabel = (id: string) => {
        const v = variants.find(v => v.id === id);
        return v ? `${v.productName ?? v.name}${v.sku ? ` (${v.sku})` : ""}` : id;
    };

    if (!storeId) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Agrega <code className="mx-1 bg-muted px-1 rounded">?storeId=</code> a la URL para comenzar.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Transferencias de Stock</h1>
                    <p className="text-sm text-muted-foreground">
                        Mover inventario entre Fábrica y Sucursales de forma atómica.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* ── Form ──────────────────────────────────────────────── */}
                <form onSubmit={handleTransfer} className="bg-card border rounded-2xl p-6 space-y-5">
                    <h2 className="font-semibold text-lg">Nueva Transferencia</h2>

                    {/* Product / Variant */}
                    <div className="space-y-2">
                        <Label>Producto / Variante</Label>
                        {dataLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                            </div>
                        ) : (
                            <Select value={variantId} onValueChange={setVariantId} required>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Selecciona el producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {variants.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{v.productName ?? v.name}</span>
                                                {v.sku && <span className="text-xs text-muted-foreground">SKU: {v.sku}</span>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Origin & Destination */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Origen</Label>
                            <Select value={fromLocationId} onValueChange={setFromLocationId} required>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Fábrica / Sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Destino</Label>
                            <Select value={toLocationId} onValueChange={setToLocationId} required>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches
                                        .filter(b => b.id !== fromLocationId)
                                        .map(b => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Visual arrow indicator */}
                    {fromLocationId && toLocationId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2">
                            <span className="font-medium text-foreground">{branchName(fromLocationId)}</span>
                            <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium text-foreground">{branchName(toLocationId)}</span>
                        </div>
                    )}

                    {/* Quantity & Note */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ej. 40"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nota Operativa</Label>
                            <Input
                                placeholder="Ej. Envío lunes 40 kg pan"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="rounded-xl h-11"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !variantId || !fromLocationId || !toLocationId || !quantity}
                        className="w-full h-12 text-base font-semibold rounded-xl gap-2"
                        size="lg"
                    >
                        {loading
                            ? <><Loader2 className="h-5 w-5 animate-spin" /> Transfiriendo...</>
                            : <><PackageCheck className="h-5 w-5" /> Ejecutar Transferencia Atómica</>
                        }
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        🔒 La operación usa una transacción Firestore — es imposible perder o duplicar stock.
                    </p>
                </form>

                {/* ── Recent history ─────────────────────────────────────── */}
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-lg">Transferencias Recientes</h2>
                    </div>

                    {dataLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial...
                        </div>
                    ) : recentTransfers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No hay transferencias registradas aún.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransfers.map(t => (
                                <div key={t.id} className="flex items-start justify-between p-3 bg-muted/40 rounded-xl text-sm">
                                    <div className="space-y-0.5">
                                        <p className="font-medium">{variantLabel(t.variantId)}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {branchName(t.fromLocationId)} → {branchName(t.toLocationId)}
                                        </p>
                                        {t.note && <p className="text-xs text-muted-foreground italic">{t.note}</p>}
                                    </div>
                                    <div className="text-right shrink-0 pl-4">
                                        <span className="font-bold text-primary">×{t.quantity}</span>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleDateString("es-CL", {
                                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
