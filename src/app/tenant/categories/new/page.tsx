"use client";

import { CategoryForm } from "@/components/tenant/categories/category-form";

export default function NewCategoryPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm />
            </div>
        </div>
    );
}
