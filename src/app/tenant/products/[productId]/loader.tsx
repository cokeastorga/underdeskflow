"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AdminProduct } from "@/types/admin";
import { ProductForm } from "@/components/tenant/products/product-form";
import { Loader2 } from "lucide-react";

export function EditProductLoader({ productId }: { productId: string }) {
    const [product, setProduct] = useState<AdminProduct | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, "products", productId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() } as AdminProduct);
                } else {
                    console.error("No such product!");
                }
            } catch (error) {
                console.error("Error loading product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!product) {
        return <div className="text-center py-20">Product not found</div>;
    }

    return <ProductForm initialData={product} />;
}
