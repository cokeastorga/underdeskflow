"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Server, Car, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CARRIER_META } from "@/types/shipping";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Vehicle, Driver } from "@/types/shipping";

export default function ShippingPage() {
    const { storeId } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    useEffect(() => {
        if (!storeId) return;
        getDoc(doc(db, "stores", storeId)).then(snap => {
            if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
        });
        getDocs(query(collection(db, "vehicles"), where("storeId", "==", storeId))).then(snap => {
            setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle)));
        });
        getDocs(query(collection(db, "drivers"), where("storeId", "==", storeId))).then(snap => {
            setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver)));
        });
    }, [storeId]);

    const activeVehicles = vehicles.filter(v => v.isActive).length;
    const activeDrivers = drivers.filter(d => d.isActive).length;
    const activeCarriers = CARRIER_META.filter(c =>
        c.id !== "ownFleet" && store?.carriers?.[c.id]?.enabled
    ).length;

    const stats = [
        { label: "Portadores Activos", value: activeCarriers, icon: Server, link: "/tenant/shipping/carriers", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
        { label: "Vehículos Activos", value: activeVehicles, icon: Car, link: "/tenant/shipping/fleet", color: "text-green-600 bg-green-50 dark:bg-green-950/20" },
        { label: "Conductores Activos", value: activeDrivers, icon: Users, link: "/tenant/shipping/fleet", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20" },
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Módulo de Envíos</h1>
                <p className="text-muted-foreground">Gestiona transportistas, flota propia y zonas de reparto.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.label} href={stat.link}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Server className="h-4 w-4" /> Portadores de Envío
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {CARRIER_META.filter(c => c.id !== "ownFleet").map(carrier => {
                            const config = store?.carriers?.[carrier.id];
                            return (
                                <div key={carrier.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{carrier.name}</span>
                                    </div>
                                    <Badge variant={config?.enabled ? "default" : "outline"} className="text-xs">
                                        {config?.enabled ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                            );
                        })}
                        <Button asChild variant="outline" className="w-full mt-2" size="sm">
                            <Link href="/tenant/shipping/carriers">Configurar Portadores →</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Flota Propia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Vehículos</span>
                            <span className="font-medium">{vehicles.length} registrados ({activeVehicles} activos)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Conductores</span>
                            <span className="font-medium">{drivers.length} registrados ({activeDrivers} activos)</span>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-2" size="sm">
                            <Link href="/tenant/shipping/fleet">Gestionar Flota →</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
