"use client";

import { useState } from "react";
import { MonitorSmartphone, DollarSign, ChefHat, Wifi, Armchair, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POSTerminal } from "@/components/tenant/pos/POSTerminal";
import { CashSession } from "@/components/tenant/pos/CashSession";
import { KitchenTickets } from "@/components/tenant/pos/KitchenTickets";
import { SumUpConnect } from "@/components/tenant/pos/SumUpConnect";
import { OfflineQueue } from "@/components/tenant/pos/OfflineQueue";
import { TableMap } from "@/components/tenant/pos/TableMap";
import { PrinterSettings } from "@/components/tenant/pos/PrinterSettings";

export default function POSPage() {
    const [activeCashSessionId, setActiveCashSessionId] = useState<string | null>(null);

    return (
        <div className="space-y-4 p-0">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MonitorSmartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Punto de Venta (POS)</h1>
                    <p className="text-sm text-muted-foreground">Terminal de venta directa e integración SumUp</p>
                </div>
            </div>

            {/* Offline queue alert */}
            <OfflineQueue />

            {/* Main tabs */}
            <Tabs defaultValue="mesas">
                <TabsList className="h-10">
                    <TabsTrigger value="mesas" className="gap-2 text-sm">
                        <Armchair className="h-4 w-4" />
                        Mesas
                    </TabsTrigger>
                    <TabsTrigger value="terminal" className="gap-2 text-sm">
                        <MonitorSmartphone className="h-4 w-4" />
                        Terminal
                    </TabsTrigger>
                    <TabsTrigger value="caja" className="gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        Caja
                    </TabsTrigger>
                    <TabsTrigger value="comanderas" className="gap-2 text-sm">
                        <ChefHat className="h-4 w-4" />
                        Comanderas
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-2 text-sm">
                        <Settings className="h-4 w-4" />
                        Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="mesas" className="mt-4">
                    <TableMap />
                </TabsContent>

                <TabsContent value="terminal" className="mt-4">
                    <POSTerminal cashSessionId={activeCashSessionId ?? undefined} />
                </TabsContent>

                <TabsContent value="caja" className="mt-4">
                    <CashSession onSessionChange={(id) => setActiveCashSessionId(id)} />
                </TabsContent>

                <TabsContent value="comanderas" className="mt-4">
                    <KitchenTickets />
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                    <div className="max-w-2xl space-y-8">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">SumUp — Lector de tarjetas</h3>
                            <SumUpConnect />
                        </div>
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Impresora de cocina (TCP)</h3>
                            <PrinterSettings />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
