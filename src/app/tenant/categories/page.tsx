"use client";

import { CategoryClient } from "@/components/tenant/categories/client";

export default function CategoriesPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryClient />
            </div>
        </div>
    );
}
