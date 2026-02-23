"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Order } from "@/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentOrders() {
    const { storeId } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;

        const q = query(
            collection(db, "orders"),
            where("storeId", "==", storeId),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const res: Order[] = [];
            snapshot.forEach(doc => res.push({ id: doc.id, ...doc.data() } as Order));
            setOrders(res);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-6 w-[150px] mb-1" />
                        <Skeleton className="h-4 w-[250px]" />
                    </div>
                    <Skeleton className="h-9 w-[100px]" />
                </div>
                <div className="rounded-md border p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-3 w-[60px]" />
                            </div>
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-4 w-[80px]" />
                            <Skeleton className="h-4 w-[60px]" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Últimos Pedidos</h2>
                    <p className="text-sm text-muted-foreground">Transacciones recientes en tu tienda.</p>
                </div>
                <Button variant="ghost" asChild size="sm">
                    <Link href="/tenant/orders" className="flex items-center gap-2">
                        Ver todos <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Orden</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay pedidos recientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{order.orderNumber}</span>
                                            <span className="text-xs text-muted-foreground">{format(order.createdAt, "dd/MM")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(order.total)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
