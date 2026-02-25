"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

import { ProductSchema, ProductFormValues } from "@/lib/validations/product";
import { AdminProduct } from "@/types/admin";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";

interface UseProductFormLogicProps {
    initialData?: AdminProduct | null;
}

export function useProductFormLogic({ initialData }: UseProductFormLogicProps) {
    const router = useRouter();
    const { storeId } = useAuth();
    const [loading, setLoading] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(ProductSchema) as any,
        defaultValues: initialData ? {
            ...initialData,
            price: initialData.price || 0,
            stock: initialData.stock || 0,
            sku: initialData.sku || "",
            barcode: initialData.barcode || "",
            description: initialData.description || "",
            vendor: initialData.vendor || "",
            category: initialData.category || "",
            brand: initialData.brand || "",
            model: initialData.model || "",
            origin: initialData.origin || "",
            warranty: initialData.warranty || "",
            careInstructions: initialData.careInstructions || "",
            lowStockThreshold: initialData.lowStockThreshold || 0,
            dimensions: {
                length: initialData.dimensions?.length || 0,
                width: initialData.dimensions?.width || 0,
                height: initialData.dimensions?.height || 0,
            },
        } : {
            title: "",
            slug: "",
            description: "",
            sku: "",
            barcode: "",
            status: "active",
            price: 0,
            compareAtPrice: 0,
            costPrice: 0,
            stock: 0,
            trackStock: true,
            allowBackorder: false,
            lowStockThreshold: 0,
            weight: 0,
            hasVariants: false,
            options: [],
            variants: [],
            media: [],
            tags: [],
            seo: { title: "", description: "" },
            category: "",
            vendor: "",
            brand: "",
            model: "",
            origin: "",
            warranty: "",
            careInstructions: "",
            dimensions: {
                length: 0,
                width: 0,
                height: 0,
            },
            technicalSpecs: [],
        },
        mode: "onChange",
    });

    // Auto-generate Slug from Title if waiting for first input and not in edit mode
    const title = form.watch("title");
    useEffect(() => {
        if (!initialData && title) {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            form.setValue("slug", slug, { shouldValidate: true });
        }
    }, [title, initialData, form]);

    const onSubmit = async (data: ProductFormValues) => {
        if (!storeId) {
            toast.error("No hay una tienda activa.");
            return;
        }

        setLoading(true);
        try {
            // Clean undefined values for Firestore
            const cleanedData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );

            const productData = {
                ...cleanedData,
                storeId,
                updatedAt: Date.now(),
            };

            if (initialData?.id) {
                await updateDoc(doc(db, "products", initialData.id), productData);
                toast.success("Producto actualizado");
            } else {
                await addDoc(collection(db, "products"), {
                    ...productData,
                    createdAt: Date.now(),
                });
                toast.success("Producto creado");
            }
            router.push("/tenant/products");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el producto");
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        onSubmit,
        loading,
        isEditMode: !!initialData,
        router
    };
}
