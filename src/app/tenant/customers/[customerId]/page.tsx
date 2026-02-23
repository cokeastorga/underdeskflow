"use client";

import { use } from "react";
import { CustomerDetailClient } from "@/components/tenant/customers/customer-detail";

interface PageProps {
    params: Promise<{ customerId: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
    const { customerId } = use(params);
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CustomerDetailClient customerId={customerId} />
            </div>
        </div>
    );
}
