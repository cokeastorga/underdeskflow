"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Eye, MoreHorizontal, ShoppingBag } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Order, OrderStatus } from "@/types";
import { syncOrderToCustomer } from "@/lib/services/customer";

export const OrdersClient = () => {
    const router = useRouter();
    const { storeId } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Real-time subscription
    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "orders"),
            where("storeId", "==", storeId),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const result: Order[] = [];
            snapshot.forEach((doc) => {
                result.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(result);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    // Dummy Seeder (Only for Development)
    const seedOrders = async () => {
        if (!storeId) return;
        try {
            const dummyOrder: Omit<Order, "id"> = {
                orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
                storeId,
                customerName: "Juan Pérez",
                email: "juan@example.com",
                items: [
                    {
                        productId: "prod_123",
                        name: "Zapatillas Running",
                        price: 59990,
                        quantity: 1,
                    }
                ],
                subtotal: 59990,
                shippingCost: 5000,
                tax: 0,
                total: 64990,
                status: "paid",
                paymentStatus: "paid",
                shippingAddress: {
                    address: "Av. Siempre Viva 742",
                    city: "Santiago",
                    zip: "8320000",
                    country: "Chile",
                    phone: "+56912345678"
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const docRef = await addDoc(collection(db, "orders"), dummyOrder);

            // Sync with CRM
            await syncOrderToCustomer({ id: docRef.id, ...dummyOrder } as Order);

            toast.success("Orden de prueba creada y cliente sincronizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al crear orden dummy");
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "paid": return "default"; // Black/Primary
            case "delivered": return "default";
            case "shipped": return "secondary";
            case "processing": return "secondary";
            case "cancelled": return "destructive";
            case "pending": return "outline";
            default: return "outline";
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber.includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Cargando pedidos...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
                    <p className="text-muted-foreground">
                        Gestiona las ventas de tu tienda ({orders.length})
                    </p>
                </div>
                <Button onClick={seedOrders} variant="outline">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Crear Orden Fiscal (Test)
                </Button>
            </div>

            <div className="flex items-center py-4">
                <Input
                    placeholder="Buscar por # o cliente..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Orden</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No se encontraron pedidos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                    <TableCell>{format(order.createdAt, "dd/MM/yyyy HH:mm")}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{order.customerName}</span>
                                            <span className="text-xs text-muted-foreground">{order.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(order.status)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{order.paymentStatus}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${order.total.toLocaleString("es-CL")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/tenant/orders/${order.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>Marcar como Pagado</DropdownMenuItem>
                                                <DropdownMenuItem>Marcar como Enviado</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
