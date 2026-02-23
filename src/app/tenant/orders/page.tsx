"use client";

import { OrdersClient } from "@/components/tenant/orders/client";

export default function OrdersPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrdersClient />
            </div>
        </div>
    );
}
