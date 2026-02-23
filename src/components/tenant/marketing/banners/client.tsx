"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Plus, Pencil, Trash2, Globe, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Banner } from "@/types";

export const BannersClient = () => {
    const { storeId } = useAuth();
    const router = useRouter();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;

        const q = query(
            collection(db, "banners"),
            where("storeId", "==", storeId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Banner[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Banner);
            });
            // Client side sort
            list.sort((a, b) => b.createdAt - a.createdAt);
            setBanners(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const toggleStatus = async (banner: Banner) => {
        try {
            await updateDoc(doc(db, "banners", banner.id), {
                isActive: !banner.isActive,
                updatedAt: Date.now()
            });
            toast.success(`Banner ${!banner.isActive ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar estado");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este banner?")) return;
        try {
            await deleteDoc(doc(db, "banners", id));
            toast.success("Banner eliminado");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar banner");
        }
    };

    if (loading) return <div>Cargando banners...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Banners</h2>
                    <p className="text-muted-foreground">
                        Gestiona los mensajes promocionales de tu tienda ({banners.length})
                    </p>
                </div>
                <Button onClick={() => router.push("/tenant/marketing/banners/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Banner
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imagen</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Posición</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {banners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay banners creados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell>
                                        <div className="h-10 w-20 bg-muted rounded overflow-hidden relative flex items-center justify-center">
                                            {banner.image ? (
                                                <img src={banner.image} alt={banner.title} className="object-cover h-full w-full" />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{banner.title}</div>
                                        {banner.subtitle && <div className="text-xs text-muted-foreground">{banner.subtitle}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{banner.position}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(banner.createdAt), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={banner.isActive}
                                            onCheckedChange={() => toggleStatus(banner)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/tenant/marketing/banners/${banner.id}`)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDelete(banner.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
