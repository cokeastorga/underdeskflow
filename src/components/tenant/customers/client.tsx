"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Search, User, Mail, ShoppingBag, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Customer } from "@/types";

export const CustomersClient = () => {
    const { storeId } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!storeId) return;

        // In a real app with many customers, we'd use Algolia or server-side searching
        // For V1 (small scale), fetching collection is okay
        const q = query(
            collection(db, "customers"),
            where("storeId", "==", storeId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customerList: Customer[] = [];
            snapshot.forEach((doc) => {
                customerList.push({ id: doc.id, ...doc.data() } as Customer);
            });
            // Client-side sort by lastOrderDate desc default
            customerList.sort((a, b) => (b.lastOrderDate || 0) - (a.lastOrderDate || 0));
            setCustomers(customerList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const filteredCustomers = customers.filter((customer) => {
        const term = searchTerm.toLowerCase();
        return (
            customer.firstName?.toLowerCase().includes(term) ||
            customer.lastName?.toLowerCase().includes(term) ||
            customer.email?.toLowerCase().includes(term)
        );
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(amount);
    };

    if (loading) {
        return <div>Cargando clientes...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                    <p className="text-muted-foreground">
                        Gestiona tu base de clientes y revisa su historial ({customers.length})
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Pedidos</TableHead>
                            <TableHead className="text-right">Total Gastado</TableHead>
                            <TableHead className="text-right">Última Actividad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/tenant/customers/${customer.id}`}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {customer.firstName?.[0]}{customer.lastName?.[0]}
                                            </div>
                                            {customer.firstName} {customer.lastName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            <ShoppingBag className="h-3 w-3 mr-1" />
                                            {customer.totalOrders}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(customer.totalSpent)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {customer.lastOrderDate
                                            ? format(new Date(customer.lastOrderDate), "dd MMM yyyy", { locale: es })
                                            : "Sin actividad"
                                        }
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
