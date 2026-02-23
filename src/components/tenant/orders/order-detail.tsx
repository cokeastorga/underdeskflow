"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { ArrowLeft, Printer, Truck, CreditCard, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { db } from "@/lib/firebase/config";
import { Order, OrderStatus } from "@/types";

interface OrderDetailClientProps {
    orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const docRef = doc(db, "orders", orderId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
                } else {
                    toast.error("Pedido no encontrado");
                    router.push("/tenant/orders");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, router]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!order) return;
        setUpdating(true);
        try {
            await updateDoc(doc(db, "orders", order.id), {
                status: newStatus,
                updatedAt: Date.now()
            });
            setOrder({ ...order, status: newStatus });
            toast.success(`Estado actualizado a ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar estado");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div>Cargando detalle...</div>;
    if (!order) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h2>
                        <p className="text-muted-foreground">
                            {format(order.createdAt, "dd/MM/yyyy HH:mm")} • {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                    <Select
                        disabled={updating}
                        value={order.status}
                        onValueChange={(val) => handleStatusChange(val as OrderStatus)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                            <SelectItem value="processing">Procesando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>
                                                    {item.sku && <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">${item.price.toLocaleString("es-CL")}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">${(item.price * item.quantity).toLocaleString("es-CL")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Separator className="my-4" />
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${order.subtotal.toLocaleString("es-CL")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Envío</span>
                                    <span>${order.shippingCost.toLocaleString("es-CL")}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2">
                                    <span>Total</span>
                                    <span>${order.total.toLocaleString("es-CL")}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Customer & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Truck className="h-4 w-4" /> Dirección de Envío
                                </h4>
                                <address className="not-italic text-sm text-muted-foreground">
                                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                                    {order.shippingAddress.address}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.zip}<br />
                                    {order.shippingAddress.country}<br />
                                    {order.shippingAddress.phone}
                                </address>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Pago
                                </h4>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                    {order.paymentStatus.toUpperCase()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
