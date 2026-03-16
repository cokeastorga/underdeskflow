"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";

interface Branch {
    id: string;
    name: string;
    address?: string;
    isActive?: boolean;
}

interface BranchSelectorProps {
    storeId: string;
    value: string;
    onChange: (branchId: string) => void;
}

/**
 * BranchSelector — Mandatory pickup location selector for stores where
 * `store.fulfillment.delivery === false && store.fulfillment.pickup === true`.
 * Fetches active branches from the store's backend and exposes the selected
 * branchId upwards via onChange.
 */
export function BranchSelector({ storeId, value, onChange }: BranchSelectorProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;
        fetch(`/api/store/branches?storeId=${storeId}`)
            .then(r => r.json())
            .then(data => {
                const active = (data.branches ?? []).filter((b: Branch) => b.isActive !== false);
                setBranches(active);
                // Auto-select if only one branch
                if (active.length === 1) onChange(active[0].id);
            })
            .finally(() => setLoading(false));
    }, [storeId]);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">Punto de Retiro *</label>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 border rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando sucursales...
                </div>
            ) : branches.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl text-center">
                    No hay sucursales disponibles. Contacta a la tienda.
                </p>
            ) : (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="w-full rounded-xl h-12">
                        <SelectValue placeholder="Selecciona la sucursal donde retirarás tu pedido" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex flex-col text-left py-1">
                                    <span className="font-semibold">{branch.name}</span>
                                    {branch.address && (
                                        <span className="text-xs text-muted-foreground">{branch.address}</span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {!loading && branches.length > 0 && !value && (
                <p className="text-xs text-destructive">
                    Debes seleccionar una sucursal para continuar.
                </p>
            )}
        </div>
    );
}
