"use client";

import { use } from "react";
import { OrderDetailClient } from "@/components/tenant/orders/order-detail";

interface PageProps {
    params: Promise<{
        orderId: string;
    }>;
}

export default function OrderDetailPage({ params }: PageProps) {
    const { orderId } = use(params);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrderDetailClient orderId={orderId} />
            </div>
        </div>
    );
}
