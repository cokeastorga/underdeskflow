"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import {
    User, Mail, Phone, MapPin, Calendar,
    ShoppingBag, DollarSign, Clock, ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { db } from "@/lib/firebase/config";
import { Customer, Order } from "@/types";

interface CustomerDetailClientProps {
    customerId: string;
}

export const CustomerDetailClient = ({ customerId }: CustomerDetailClientProps) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Customer
                const customerRef = doc(db, "customers", customerId);
                const customerSnap = await getDoc(customerRef);

                if (customerSnap.exists()) {
                    const customerData = { id: customerSnap.id, ...customerSnap.data() } as Customer;
                    setCustomer(customerData);

                    // 2. Fetch Orders by Email (Robust Key)
                    // We assume storeId context is secured by rules, but strictly we should filter by storeId too if not in context
                    const ordersQuery = query(
                        collection(db, "orders"),
                        where("email", "==", customerData.email),
                        where("storeId", "==", customerData.storeId),
                        orderBy("createdAt", "desc")
                    );

                    const ordersSnap = await getDocs(ordersQuery);
                    const ordersList: Order[] = [];
                    ordersSnap.forEach(doc => {
                        ordersList.push({ id: doc.id, ...doc.data() } as Order);
                    });
                    setOrders(ordersList);
                }
            } catch (error) {
                console.error("Error fetching customer data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchData();
        }
    }, [customerId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            paid: "default",
            pending: "secondary",
            cancelled: "destructive",
            delivered: "outline",
        };
        return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
    };

    if (loading) return <div>Cargando perfil...</div>;
    if (!customer) return <div>Cliente no encontrado</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {customer.firstName} {customer.lastName}
                    </h2>
                    <p className="text-muted-foreground">{customer.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.phone || "Sin teléfono"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Registrado: {format(new Date(customer.createdAt), "dd MMM yyyy")}
                            </span>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Direcciones
                            </h4>
                            {customer.addresses && customer.addresses.length > 0 ? (
                                <div className="space-y-3">
                                    {customer.addresses.map((addr, idx) => (
                                        <div key={idx} className="text-sm border rounded p-2 bg-muted/20">
                                            <div className="font-medium text-xs text-muted-foreground uppercase">{addr.type}</div>
                                            <div>{addr.address}</div>
                                            <div>{addr.city}, {addr.zip}</div>
                                            <div>{addr.country}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay direcciones guardadas.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics & History */}
                <div className="md:col-span-2 space-y-6">
                    {/* Metrics Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{customer.totalOrders}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {customer.totalOrders > 0
                                        ? formatCurrency(customer.totalSpent / customer.totalOrders)
                                        : formatCurrency(0)
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Pedidos</CardTitle>
                            <CardDescription>
                                Últimas compras realizadas por este cliente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Orden</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                Sin pedidos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    {order.orderNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(order.total)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => window.location.href = `/tenant/orders/${order.id}`}
                                                    >
                                                        Ver Detalle
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
