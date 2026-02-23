"use client";

import { ProductWizard } from "@/components/tenant/products/product-wizard";

export default function NewProductPage() {
    return (
        <div className="flex-col h-full">
            <div className="flex-1 space-y-4 p-0 md:p-0 pt-0 h-full">
                <ProductWizard />
            </div>
        </div>
    );
}
