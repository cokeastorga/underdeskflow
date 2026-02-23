"use client";

import { CustomersClient } from "@/components/tenant/customers/client";

export default function CustomersPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CustomersClient />
            </div>
        </div>
    );
}
