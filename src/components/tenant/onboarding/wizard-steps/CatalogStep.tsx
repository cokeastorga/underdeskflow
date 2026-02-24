"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Tag, DollarSign, Package } from "lucide-react";
import { Store } from "@/types/store";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { ImageUpload } from "@/components/tenant/settings/ImageUpload";

const catalogSchema = z.object({
    categoryName: z.string().min(2, "Mínimo 2 caracteres"),
    productName: z.string().min(2, "Mínimo 2 caracteres"),
    price: z.number().min(0),
    productImage: z.string().optional(),
});

type CatalogFormValues = z.infer<typeof catalogSchema>;

interface CatalogStepProps {
    store: Store;
    onNext: (data?: Partial<Store>) => void;
}

export function CatalogStep({ store, onNext }: CatalogStepProps) {
    const form = useForm<CatalogFormValues>({
        resolver: zodResolver(catalogSchema),
        defaultValues: {
            categoryName: "Ropa",
            productName: "",
            price: 0,
            productImage: "",
        },
    });

    const onSubmit = async (data: CatalogFormValues) => {
        try {
            // 1. Create Category
            const categoryRef = await addDoc(collection(db, "stores", store.id, "categories"), {
                name: data.categoryName,
                slug: data.categoryName.toLowerCase().replace(/ /g, "-"),
                description: "Categoría inicial",
                parentId: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 2. Create Product
            await addDoc(collection(db, "stores", store.id, "products"), {
                name: data.productName,
                slug: data.productName.toLowerCase().replace(/ /g, "-"),
                price: data.price,
                compareAtPrice: 0,
                costPrice: 0,
                sku: `SKU-${Date.now()}`,
                description: "Mi primer producto",
                categoryId: categoryRef.id,
                mainImage: data.productImage,
                images: data.productImage ? [data.productImage] : [],
                status: "active",
                stock: 10,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success("Catálogo inicial creado con éxito");
            onNext(); // No store data to update, just move to next step
        } catch (error) {
            console.error("Error creating catalog:", error);
            toast.error("Error al crear el catálogo");
        }
    };

    return (
        <Form {...form}>
            <form id="wizard-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                {/* Category Selection */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Tu primera categoría</h2>
                    </div>
                    <FormField
                        control={form.control}
                        name="categoryName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Categoría</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Ropa, Electrónica, Servicios..." className="h-12" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Agrupa tus productos para que sean fáciles de encontrar.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-muted-foreground">Y tu primer producto</span></div>
                </div>

                {/* Product Detail */}
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="productImage"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormLabel className="text-center font-semibold mb-4">Imagen del Producto</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onRemove={() => field.onChange("")}
                                            folder={`stores/${store.id}/products`}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="productName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Producto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Camiseta Básica" className="h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio de Venta</FormLabel>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="h-12 pl-10"
                                                value={field.value}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        Podrás agregar más productos, variantes y stock detallado en el **Panel de Productos** después de terminar.
                    </p>
                </div>
            </form>
        </Form>
    );
}
