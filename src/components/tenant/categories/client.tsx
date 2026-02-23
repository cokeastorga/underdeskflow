"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Category } from "@/types";
import { Separator } from "@/components/ui/separator";

interface CategoryWithChildren extends Category {
    children?: CategoryWithChildren[];
    level: number;
}

export const CategoryClient = () => {
    const router = useRouter();
    const { storeId } = useAuth();
    const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "categories"),
            where("storeId", "==", storeId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allCategories = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Category));

            // Build Hierarchy
            const buildTree = (cats: Category[], parentId: string | null = null, level = 0): CategoryWithChildren[] => {
                return cats
                    .filter((cat) => (cat.parentId || "root") === (parentId || "root")) // Handle null vs "root" vs undefined
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((cat) => ({
                        ...cat,
                        level,
                        children: buildTree(cats, cat.id, level + 1),
                    }));
            };

            // Flatten for Table Display (preserving order)
            const flattenTree = (nodes: CategoryWithChildren[]): CategoryWithChildren[] => {
                let flat: CategoryWithChildren[] = [];
                nodes.forEach((node) => {
                    flat.push(node);
                    if (node.children && node.children.length > 0) {
                        flat = flat.concat(flattenTree(node.children));
                    }
                });
                return flat;
            };

            const tree = buildTree(allCategories, null);
            // Handle cases where parentId might be "root" explicitly in DB but treating as null here
            const rootCats = allCategories.filter(c => !c.parentId || c.parentId === "root");
            // Re-logic: actually filtering by parentId is tricky if mixed.

            // Let's use a robust approach:
            // 1. Get all with no parent or parent=='root' -> these are roots.
            // 2. Recursively find children.

            // Filter out those that were already included to avoid duplication if logic is loose?
            // Better: strictly follow parentId. 

            // For this implementation, let's assume parentId is either a valid ID or falsy/"root".

            // Re-implement buildTree with stricter check
            const buildTreeStrict = (parentId: string | null): CategoryWithChildren[] => {
                return allCategories
                    .filter(c => {
                        const p = c.parentId;
                        if (parentId === null) return !p || p === "root";
                        return p === parentId;
                    })
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(c => ({
                        ...c,
                        level: 0, // placeholder, will set in recursion
                        children: [] // placeholder
                    }));
            }

            // Recursive function with level passing
            const organize = (parentId: string | null, level: number): CategoryWithChildren[] => {
                const updatedNodes = allCategories
                    .filter(c => {
                        const p = c.parentId;
                        if (parentId === null) return !p || p === "root";
                        return p === parentId;
                    })
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(c => ({
                        ...c,
                        level: level,
                        children: organize(c.id, level + 1)
                    }));
                return updatedNodes;
            }

            const hierarchical = organize(null, 0);
            setCategories(flattenTree(hierarchical));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);


    const onDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "categories", id));
            toast.success("Categoría eliminada");
        } catch (error) {
            toast.error("Error al eliminar categoría");
        }
    };

    if (loading) {
        return <div className="p-8">Cargando categorías...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Categorías</h2>
                    <p className="text-muted-foreground">
                        Gestiona la organización de tus productos ({categories.length})
                    </p>
                </div>
                <Button onClick={() => router.push("/tenant/categories/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Nueva
                </Button>
            </div>
            <Separator />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay categorías. Crea la primera.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center" style={{ paddingLeft: `${item.level * 24}px` }}>
                                            {item.level > 0 && <span className="text-muted-foreground mr-2">└</span>}
                                            <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? "default" : "secondary"}>
                                            {item.isActive ? "Activa" : "Inactiva"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.sortOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/tenant/categories/${item.id}`)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
