"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CategorySchema, CategoryFormValues } from "@/lib/validations/category";
import { Category } from "@/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from "firebase/firestore";

interface CategoryFormProps {
    initialData?: Category | null;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const params = useParams();
    const { storeId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const title = initialData ? "Editar Categoría" : "Nueva Categoría";
    const description = initialData ? "Edita los detalles de la categoría." : "Agrega una nueva categoría a tu tienda.";
    const action = initialData ? "Guardar cambios" : "Crear";

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(CategorySchema) as any,
        defaultValues: initialData ? {
            name: initialData.name,
            slug: initialData.slug,
            description: initialData.description || "",
            image: initialData.image || "",
            parentId: initialData.parentId || "root", // Use "root" or empty string for no parent
            isActive: initialData.isActive,
            sortOrder: initialData.sortOrder || 0,
        } : {
            name: "",
            slug: "",
            description: "",
            image: "",
            parentId: "root",
            isActive: true,
            sortOrder: 0,
        },
    });

    // Fetch existing categories for Parent Selector
    useEffect(() => {
        const fetchCategories = async () => {
            if (!storeId) return;
            try {
                const q = query(collection(db, "categories"), where("storeId", "==", storeId));
                const querySnapshot = await getDocs(q);
                const cats: Category[] = [];
                querySnapshot.forEach((doc) => {
                    if (doc.id !== initialData?.id) { // Prevent selecting itself as parent
                        cats.push({ id: doc.id, ...doc.data() } as Category);
                    }
                });
                setCategories(cats);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, [storeId, initialData?.id]);

    // Auto-generate Slug from Name
    const name = form.watch("name");
    useEffect(() => {
        if (!initialData && name) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            form.setValue("slug", slug, { shouldValidate: true });
        }
    }, [name, initialData, form]);


    const onSubmit = async (data: CategoryFormValues) => {
        if (!storeId) {
            toast.error("No hay una tienda activa.");
            return;
        }

        setLoading(true);
        try {
            const categoryData = {
                name: data.name,
                slug: data.slug,
                description: data.description,
                image: data.image,
                parentId: data.parentId === "root" ? null : data.parentId, // Handle "root" value
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                storeId,
                updatedAt: Date.now(),
            };

            if (initialData) {
                await updateDoc(doc(db, "categories", initialData.id), categoryData);
                toast.success("Categoría actualizada");
            } else {
                await addDoc(collection(db, "categories"), {
                    ...categoryData,
                    createdAt: Date.now(),
                });
                toast.success("Categoría creada");
            }
            router.push("/tenant/categories");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la categoría");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await deleteDoc(doc(db, "categories", initialData?.id as string));
            router.push("/tenant/categories");
            router.refresh();
            toast.success("Categoría eliminada");
        } catch (error) {
            toast.error("Error al eliminar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </Button>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control as any}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="Ej. Zapatillas" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="ej. zapatillas" {...field} />
                                        </FormControl>
                                        <FormDescription>Identificador único para la URL.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría Padre</FormLabel>
                                        <FormControl>
                                            {/* Simple Native Select for now, easier than Combobox for MVP */}
                                            <select
                                                disabled={loading}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                {...field}
                                            >
                                                <option value="root">Ninguna (Categoría Raíz)</option>
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
                                control={form.control as any}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder="..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Imagen (URL)</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormDescription>URL directa a la imagen de portada.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Activa</FormLabel>
                                                <FormDescription>
                                                    Visible en la tienda.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="sortOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Orden</FormLabel>
                                            <FormControl>
                                                <Input type="number" disabled={loading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </CardContent>
                    </Card>
                    <Button disabled={loading} className="w-full" type="submit">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
