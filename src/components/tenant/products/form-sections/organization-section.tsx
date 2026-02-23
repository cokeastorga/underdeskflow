"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProductFormValues } from "@/lib/validations/product";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Category } from "@/types";

interface SectionProps {
    form: UseFormReturn<ProductFormValues>;
}

export function OrganizationSection({ form }: SectionProps) {
    const { storeId } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!storeId) return;
            try {
                // Fetch only ACTIVE categories as requested
                const q = query(
                    collection(db, "categories"),
                    where("storeId", "==", storeId),
                    where("isActive", "==", true)
                );
                const querySnapshot = await getDocs(q);
                const cats: Category[] = [];
                querySnapshot.forEach((doc) => {
                    cats.push({ id: doc.id, ...doc.data() } as Category);
                });
                // Sort by name or sortOrder if available
                cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setCategories(cats);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [storeId]);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <FormControl>
                            <select
                                disabled={loading}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                                value={field.value || ""}
                            >
                                <option value="">Seleccionar categoría...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Marca / Vendedor</FormLabel>
                        <FormControl>
                            <Input placeholder="Nike, Adidas, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL Handle</FormLabel>
                        <FormControl>
                            <Input placeholder="my-product-url" {...field} />
                        </FormControl>
                        <FormDescription>
                            Identificador único para la URL del producto.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
