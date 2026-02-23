"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Coupon } from "@/types";

export const CouponsClient = () => {
    const { storeId } = useAuth();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;

        const q = query(
            collection(db, "coupons"),
            where("storeId", "==", storeId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Coupon[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Coupon);
            });
            // Client side sort
            list.sort((a, b) => b.createdAt - a.createdAt);
            setCoupons(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const toggleStatus = async (coupon: Coupon) => {
        try {
            await updateDoc(doc(db, "coupons", coupon.id), {
                isActive: !coupon.isActive,
                updatedAt: Date.now()
            });
            toast.success(`Cupón ${!coupon.isActive ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar estado");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cupón?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            toast.success("Cupón eliminado");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar cupón");
        }
    };

    if (loading) return <div>Cargando cupones...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cupones</h2>
                    <p className="text-muted-foreground">
                        Crea códigos de descuento para tus clientes ({coupons.length})
                    </p>
                </div>
                <Button onClick={() => router.push("/tenant/marketing/coupons/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Cupón
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Usos</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay cupones creados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-mono font-bold text-primary">
                                            <Tag className="h-4 w-4" />
                                            {coupon.code}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {coupon.type === 'percentage' ? (
                                                <div className="flex items-center gap-1">
                                                    <Percent className="h-3 w-3" /> {coupon.value}%
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" /> ${coupon.value}
                                                </div>
                                            )}
                                        </Badge>
                                        {coupon.minOrderAmount! > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Min: ${coupon.minOrderAmount}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {coupon.usedCount} / {coupon.maxUses || '∞'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {coupon.endsAt ? format(new Date(coupon.endsAt), "dd MMM yyyy", { locale: es }) : "Indefinida"}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={coupon.isActive}
                                            onCheckedChange={() => toggleStatus(coupon)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/tenant/marketing/coupons/${coupon.id}`)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDelete(coupon.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
