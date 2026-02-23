"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BannersClient } from "@/components/tenant/marketing/banners/client";
import { CouponsClient } from "@/components/tenant/marketing/coupons/client";
import { Megaphone, Ticket } from "lucide-react";

export default function MarketingPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Marketing</h2>
                    <p className="text-muted-foreground">
                        Gestiona tus campañas, banners y cupones de descuento.
                    </p>
                </div>

                <Tabs defaultValue="banners" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="banners" className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4" /> Banners Promocionales
                        </TabsTrigger>
                        <TabsTrigger value="coupons" className="flex items-center gap-2">
                            <Ticket className="h-4 w-4" /> Cupones de Descuento
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="banners" className="space-y-4">
                        <BannersClient />
                    </TabsContent>

                    <TabsContent value="coupons" className="space-y-4">
                        <CouponsClient />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
