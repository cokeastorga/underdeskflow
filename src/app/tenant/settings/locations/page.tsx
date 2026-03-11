"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Location } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Trash2, Edit2, Loader2, Store } from "lucide-react";
import { toast } from "sonner";

export default function LocationsPage() {
    const { storeId } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        isMain: false,
        locationAddress: {
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "Chile", // Default
        },
        phone: "",
        isActive: true,
    });

    // Fetch Locations (Real-time)
    useEffect(() => {
        if (!storeId) return;

        const q = query(collection(db, "locations"), where("storeId", "==", storeId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
            setLocations(locs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "", isMain: false, locationAddress: { street: "", city: "", state: "", zip: "", country: "Chile" }, phone: "", isActive: true
        });
    };

    const handleOpenDialog = (location?: Location) => {
        if (location) {
            setEditingId(location.id);
            setFormData({
                name: location.name,
                isMain: location.isMain || false,
                locationAddress: location.locationAddress || { street: "", city: "", state: "", zip: "", country: "Chile" },
                phone: location.phone || "",
                isActive: location.status === "active",
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                storeId,
                updatedAt: Date.now(),
            };

            if (editingId) {
                await updateDoc(doc(db, "locations", editingId), data);
                toast.success("Sucursal actualizada");
            } else {
                await addDoc(collection(db, "locations"), {
                    ...data,
                    createdAt: Date.now(),
                });
                toast.success("Sucursal creada");
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la sucursal");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta sucursal?")) return;
        try {
            await deleteDoc(doc(db, "locations", id));
            toast.success("Sucursal eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
                    <p className="text-muted-foreground">Administra las ubicaciones físicas para retiro en tienda.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Sucursales</CardTitle>
                    <CardDescription>
                        Estas ubicaciones aparecerán en el checkout si la opción de retiro está habilitada.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : locations.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No tienes sucursales registradas.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((loc) => (
                                    <TableRow key={loc.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Store className="h-4 w-4 text-muted-foreground" />
                                            {loc.name} {loc.isMain && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Sede Principal</span>}
                                        </TableCell>
                                        <TableCell>{loc.locationAddress?.street}, {loc.locationAddress?.city}</TableCell>
                                        <TableCell>{loc.phone || "-"}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${loc.status === "active" ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {loc.status === "active" ? "Activo" : "Inactivo"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(loc)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(loc.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Sucursal" : "Nueva Sucursal"}</DialogTitle>
                        <DialogDescription>
                            Ingresa los detalles de la ubicación.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                placeholder="Ej. Casa Matriz"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="street">Calle y Número</Label>
                            <Input
                                id="street"
                                placeholder="Ej. Av. Principal 123"
                                value={formData.locationAddress.street}
                                onChange={(e) => setFormData({ ...formData, locationAddress: { ...formData.locationAddress, street: e.target.value } })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad / Comuna</Label>
                                <Input
                                    id="city"
                                    placeholder="Ej. Santiago"
                                    value={formData.locationAddress.city}
                                    onChange={(e) => setFormData({ ...formData, locationAddress: { ...formData.locationAddress, city: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">Región / Estado</Label>
                                <Input
                                    id="state"
                                    placeholder="Ej. RM"
                                    value={formData.locationAddress.state}
                                    onChange={(e) => setFormData({ ...formData, locationAddress: { ...formData.locationAddress, state: e.target.value } })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zip">Código Postal</Label>
                                <Input
                                    id="zip"
                                    placeholder="Opcional"
                                    value={formData.locationAddress.zip}
                                    onChange={(e) => setFormData({ ...formData, locationAddress: { ...formData.locationAddress, zip: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <Input
                                    id="country"
                                    value={formData.locationAddress.country}
                                    onChange={(e) => setFormData({ ...formData, locationAddress: { ...formData.locationAddress, country: e.target.value } })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono de Sucursal</Label>
                            <Input
                                id="phone"
                                placeholder="Ej. +56 9 1234 5678"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t mt-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isMain"
                                    checked={formData.isMain}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isMain: checked })}
                                />
                                <Label htmlFor="isMain" className="cursor-pointer">¿Es la Sede Principal?</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Sucursal Activa</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
