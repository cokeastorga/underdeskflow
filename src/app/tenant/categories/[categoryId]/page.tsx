"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Category } from "@/types";
import { CategoryForm } from "@/components/tenant/categories/category-form";
import { Loader2 } from "lucide-react";

export default function EditCategoryPage() {
    const params = useParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            // Handle case where params.categoryId might be an array or undefined
            const catId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
            if (!catId) return;

            try {
                const docRef = doc(db, "categories", catId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCategory({ id: docSnap.id, ...docSnap.data() } as Category);
                } else {
                    console.error("Category not found");
                }
            } catch (error) {
                console.error("Error fetching category:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [params.categoryId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm initialData={category} />
            </div>
        </div>
    );
}
