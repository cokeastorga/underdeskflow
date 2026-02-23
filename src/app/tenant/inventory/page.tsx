"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { InventoryClient } from "@/components/tenant/inventory/client";

export default function InventoryPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <InventoryClient />
            </div>
        </div>
    );
}
