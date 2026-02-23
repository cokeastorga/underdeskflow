"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Vehicle, Driver, ShippingZone, VEHICLE_CATEGORIES, LICENSE_CATEGORIES, VehicleCategory, LicenseCategory } from "@/types/shipping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Car, Users, MapPin, AlertTriangle } from "lucide-react";

// ============================================================
// VEHICLE DIALOG
// ============================================================
function VehicleDialog({ storeId, vehicle, drivers, open, onClose, onSaved }: {
    storeId: string; vehicle?: Vehicle; drivers: Driver[];
    open: boolean; onClose: () => void; onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const empty: Omit<Vehicle, "id" | "createdAt" | "updatedAt"> = {
        storeId, name: "", plate: "", category: "van", brand: "", model: "",
        year: new Date().getFullYear(), color: "", maxWeightKg: 500, maxVolumeM3: 2, maxParcels: 20, isActive: true,
    };
    const [form, setForm] = useState<typeof empty>(vehicle ? { ...vehicle } : empty);

    useEffect(() => { setForm(vehicle ? { ...vehicle } : empty); }, [vehicle, open]);

    const handleSave = async () => {
        if (!form.name || !form.plate || !form.brand) {
            toast.error("Completa los campos obligatorios."); return;
        }
        setSaving(true);
        try {
            const now = Date.now();
            if (vehicle) {
                await updateDoc(doc(db, "vehicles", vehicle.id), { ...form, updatedAt: now });
                toast.success("Vehículo actualizado.");
            } else {
                await addDoc(collection(db, "vehicles"), { ...form, storeId, createdAt: now, updatedAt: now });
                toast.success("Vehículo agregado.");
            }
            onSaved(); onClose();
        } catch (e) { toast.error("Error al guardar."); }
        finally { setSaving(false); }
    };

    const f = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{vehicle ? "Editar Vehículo" : "Agregar Vehículo"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nombre / Identificador *</Label>
                            <Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Camioneta Ruta Norte" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Patente *</Label>
                            <Input value={form.plate} onChange={e => f("plate", e.target.value.toUpperCase())} placeholder="ABCD-12" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Categoría *</Label>
                            <select value={form.category} onChange={e => f("category", e.target.value as VehicleCategory)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                {VEHICLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Marca *</Label>
                            <Input value={form.brand} onChange={e => f("brand", e.target.value)} placeholder="Toyota" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Modelo</Label>
                            <Input value={form.model} onChange={e => f("model", e.target.value)} placeholder="Hilux" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Año</Label>
                            <Input type="number" value={form.year} onChange={e => f("year", +e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                            <Input value={form.color} onChange={e => f("color", e.target.value)} placeholder="Blanco" />
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Capacidad de Carga</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Peso máx. (kg)</Label>
                                <Input type="number" value={form.maxWeightKg} onChange={e => f("maxWeightKg", +e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Volumen (m³)</Label>
                                <Input type="number" step="0.1" value={form.maxVolumeM3} onChange={e => f("maxVolumeM3", +e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Max. Paquetes</Label>
                                <Input type="number" value={form.maxParcels} onChange={e => f("maxParcels", +e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4 space-y-3">
                        <div className="space-y-1.5">
                            <Label>Conductor Asignado</Label>
                            <select value={form.driverId || ""} onChange={e => f("driverId", e.target.value || undefined)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <option value="">Sin asignar</option>
                                {drivers.filter(d => d.isActive).map(d => (
                                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={form.isActive} onCheckedChange={val => f("isActive", val)} />
                            <Label>Vehículo activo</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// DRIVER DIALOG
// ============================================================
function DriverDialog({ storeId, driver, vehicles, open, onClose, onSaved }: {
    storeId: string; driver?: Driver; vehicles: Vehicle[];
    open: boolean; onClose: () => void; onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const empty: Omit<Driver, "id" | "createdAt" | "updatedAt"> = {
        storeId, firstName: "", lastName: "", rut: "", phone: "",
        email: "", licenseNumber: "", licenseCategory: "B", licenseExpiry: Date.now(), isActive: true,
    };
    const [form, setForm] = useState<typeof empty>(driver ? { ...driver } : empty);
    useEffect(() => { setForm(driver ? { ...driver } : empty); }, [driver, open]);

    const f = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));

    const handleSave = async () => {
        if (!form.firstName || !form.rut || !form.licenseNumber) {
            toast.error("Completa los campos obligatorios."); return;
        }
        setSaving(true);
        try {
            const now = Date.now();
            if (driver) {
                await updateDoc(doc(db, "drivers", driver.id), { ...form, updatedAt: now });
                toast.success("Conductor actualizado.");
            } else {
                await addDoc(collection(db, "drivers"), { ...form, storeId, createdAt: now, updatedAt: now });
                toast.success("Conductor agregado.");
            }
            onSaved(); onClose();
        } catch (e) { toast.error("Error al guardar."); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{driver ? "Editar Conductor" : "Agregar Conductor"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Nombre *</Label>
                            <Input value={form.firstName} onChange={e => f("firstName", e.target.value)} placeholder="Juan" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Apellido *</Label>
                            <Input value={form.lastName} onChange={e => f("lastName", e.target.value)} placeholder="Pérez" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>RUT *</Label>
                            <Input value={form.rut} onChange={e => f("rut", e.target.value)} placeholder="12.345.678-9" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Teléfono *</Label>
                            <Input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+56 9 1234 5678" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label>Email</Label>
                            <Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="conductor@tienda.com" />
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos de Licencia</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>N° Licencia *</Label>
                                <Input value={form.licenseNumber} onChange={e => f("licenseNumber", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Categoría</Label>
                                <select value={form.licenseCategory} onChange={e => f("licenseCategory", e.target.value as LicenseCategory)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    {LICENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Vencimiento</Label>
                                <Input type="date" value={new Date(form.licenseExpiry).toISOString().split("T")[0]}
                                    onChange={e => f("licenseExpiry", new Date(e.target.value).getTime())} />
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4 space-y-3">
                        <div className="space-y-1.5">
                            <Label>Vehículo Asignado</Label>
                            <select value={form.vehicleId || ""} onChange={e => f("vehicleId", e.target.value || undefined)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <option value="">Sin asignar</option>
                                {vehicles.filter(v => v.isActive).map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={form.isActive} onCheckedChange={val => f("isActive", val)} />
                            <Label>Conductor activo</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// ZONE DIALOG
// ============================================================
function ZoneDialog({ storeId, zone, open, onClose, onSaved }: {
    storeId: string; zone?: ShippingZone; open: boolean; onClose: () => void; onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const empty: Omit<ShippingZone, "id" | "createdAt" | "updatedAt"> = {
        storeId, name: "", communes: [], basePrice: 2900, pricePerKg: 200, pricePerM3: 0, estimatedDays: 1, isActive: true,
    };
    const [form, setForm] = useState<typeof empty>(zone ? { ...zone } : empty);
    const [communeInput, setCommuneInput] = useState("");
    useEffect(() => { setForm(zone ? { ...zone } : empty); setCommuneInput(""); }, [zone, open]);

    const f = (key: keyof typeof form, val: any) => setForm(p => ({ ...p, [key]: val }));
    const addCommune = () => {
        const t = communeInput.trim();
        if (t && !form.communes.includes(t)) {
            f("communes", [...form.communes, t]);
            setCommuneInput("");
        }
    };

    const handleSave = async () => {
        if (!form.name || form.communes.length === 0) { toast.error("Nombre y al menos una comuna son requeridos."); return; }
        setSaving(true);
        try {
            const now = Date.now();
            if (zone) {
                await updateDoc(doc(db, "shippingZones", zone.id), { ...form, updatedAt: now });
            } else {
                await addDoc(collection(db, "shippingZones"), { ...form, storeId, createdAt: now, updatedAt: now });
            }
            toast.success("Zona guardada.");
            onSaved(); onClose();
        } catch { toast.error("Error al guardar."); }
        finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{zone ? "Editar Zona" : "Nueva Zona de Reparto"}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Nombre de la Zona *</Label>
                        <Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Santiago Centro" />
                    </div>
                    <div className="space-y-2">
                        <Label>Comunas cubiertas *</Label>
                        <div className="flex gap-2">
                            <Input value={communeInput} onChange={e => setCommuneInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCommune(); } }}
                                placeholder="Agregar comuna..." className="flex-1" />
                            <Button type="button" variant="outline" size="sm" onClick={addCommune}>+</Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {form.communes.map((c, i) => (
                                <Badge key={i} variant="secondary" className="pr-1">
                                    {c}
                                    <button type="button" onClick={() => f("communes", form.communes.filter((_, j) => j !== i))} className="ml-1.5 text-muted-foreground hover:text-destructive">×</button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tarifas</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Precio Base ($)</Label>
                                <Input type="number" value={form.basePrice} onChange={e => f("basePrice", +e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>+ por kg ($)</Label>
                                <Input type="number" value={form.pricePerKg} onChange={e => f("pricePerKg", +e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Días estimados</Label>
                                <Input type="number" min="1" value={form.estimatedDays} onChange={e => f("estimatedDays", +e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Peso máx. (opcional kg)</Label>
                                <Input type="number" value={form.maxWeightKg || ""} onChange={e => f("maxWeightKg", e.target.value ? +e.target.value : undefined)} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                        <Switch checked={form.isActive} onCheckedChange={val => f("isActive", val)} />
                        <Label>Zona activa</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// FLEET PAGE
// ============================================================
export default function FleetPage() {
    const { storeId } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);

    const [vehicleDialog, setVehicleDialog] = useState<{ open: boolean; vehicle?: Vehicle }>({ open: false });
    const [driverDialog, setDriverDialog] = useState<{ open: boolean; driver?: Driver }>({ open: false });
    const [zoneDialog, setZoneDialog] = useState<{ open: boolean; zone?: ShippingZone }>({ open: false });

    const load = async () => {
        if (!storeId) return;
        setLoading(true);
        const [vSnap, dSnap, zSnap] = await Promise.all([
            getDocs(query(collection(db, "vehicles"), where("storeId", "==", storeId))),
            getDocs(query(collection(db, "drivers"), where("storeId", "==", storeId))),
            getDocs(query(collection(db, "shippingZones"), where("storeId", "==", storeId))),
        ]);
        setVehicles(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle)));
        setDrivers(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Driver)));
        setZones(zSnap.docs.map(d => ({ id: d.id, ...d.data() } as ShippingZone)));
        setLoading(false);
    };

    useEffect(() => { load(); }, [storeId]);

    const deleteDoc_ = async (col: string, id: string, label: string) => {
        if (!confirm(`¿Eliminar ${label}?`)) return;
        await deleteDoc(doc(db, col, id));
        toast.success(`${label} eliminado.`);
        load();
    };

    const getDriverName = (id?: string) => {
        if (!id) return "—";
        const d = drivers.find(dr => dr.id === id);
        return d ? `${d.firstName} ${d.lastName}` : "—";
    };
    const getVehicleName = (id?: string) => {
        if (!id) return "—";
        const v = vehicles.find(vv => vv.id === id);
        return v ? v.name : "—";
    };

    const isLicenseExpiringSoon = (expiry: number) => expiry - Date.now() < 30 * 24 * 60 * 60 * 1000;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestión de Flota</h1>
                <p className="text-muted-foreground">Administra vehículos, conductores y zonas de reparto propias.</p>
            </div>

            <Tabs defaultValue="vehicles">
                <TabsList>
                    <TabsTrigger value="vehicles" className="gap-2">
                        <Car className="h-4 w-4" /> Vehículos ({vehicles.length})
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="gap-2">
                        <Users className="h-4 w-4" /> Conductores ({drivers.length})
                    </TabsTrigger>
                    <TabsTrigger value="zones" className="gap-2">
                        <MapPin className="h-4 w-4" /> Zonas ({zones.length})
                    </TabsTrigger>
                </TabsList>

                {/* ---- VEHICLES TAB ---- */}
                <TabsContent value="vehicles" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setVehicleDialog({ open: true })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Vehículo
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : vehicles.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">
                            <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No hay vehículos registrados.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setVehicleDialog({ open: true })}>Agregar Primero</Button>
                        </CardContent></Card>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Patente</TableHead>
                                        <TableHead>Capacidad</TableHead>
                                        <TableHead>Conductor</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicles.map(v => {
                                        const cat = VEHICLE_CATEGORIES.find(c => c.value === v.category);
                                        return (
                                            <TableRow key={v.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{cat?.icon}</span>
                                                        <div>
                                                            <p className="font-medium">{v.name}</p>
                                                            <p className="text-xs text-muted-foreground">{v.brand} {v.model} {v.year}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{v.plate}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                                        <div>{v.maxWeightKg} kg</div>
                                                        <div>{v.maxVolumeM3} m³</div>
                                                        <div>{v.maxParcels} paq.</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{getDriverName(v.driverId)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={v.isActive ? "default" : "outline"}>
                                                        {v.isActive ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => setVehicleDialog({ open: true, vehicle: v })}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteDoc_("vehicles", v.id, v.name)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                {/* ---- DRIVERS TAB ---- */}
                <TabsContent value="drivers" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setDriverDialog({ open: true })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Conductor
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : drivers.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No hay conductores registrados.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setDriverDialog({ open: true })}>Agregar Primero</Button>
                        </CardContent></Card>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Conductor</TableHead>
                                        <TableHead>RUT</TableHead>
                                        <TableHead>Licencia</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {drivers.map(d => {
                                        const expiring = isLicenseExpiringSoon(d.licenseExpiry);
                                        return (
                                            <TableRow key={d.id}>
                                                <TableCell>
                                                    <p className="font-medium">{d.firstName} {d.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{d.rut}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs">
                                                        <div className="font-medium">Cat. {d.licenseCategory}</div>
                                                        <div className={`flex items-center gap-1 mt-0.5 ${expiring ? "text-red-500" : "text-muted-foreground"}`}>
                                                            {expiring && <AlertTriangle className="h-3 w-3" />}
                                                            Vence: {new Date(d.licenseExpiry).toLocaleDateString("es-CL")}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{getVehicleName(d.vehicleId)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={d.isActive ? "default" : "outline"}>
                                                        {d.isActive ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => setDriverDialog({ open: true, driver: d })}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteDoc_("drivers", d.id, `${d.firstName} ${d.lastName}`)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                {/* ---- ZONES TAB ---- */}
                <TabsContent value="zones" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setZoneDialog({ open: true })}>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Zona
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : zones.length === 0 ? (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">
                            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No hay zonas de reparto configuradas.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setZoneDialog({ open: true })}>Crear Primera Zona</Button>
                        </CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {zones.map(z => (
                                <Card key={z.id} className={`border-2 ${z.isActive ? "border-primary/30" : "border-muted opacity-60"}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-semibold">{z.name}</p>
                                                <p className="text-xs text-muted-foreground">{z.estimatedDays} día(s) estimado(s)</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setZoneDialog({ open: true, zone: z })}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteDoc_("shippingZones", z.id, z.name)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {z.communes.slice(0, 6).map((c, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                                            ))}
                                            {z.communes.length > 6 && (
                                                <Badge variant="outline" className="text-xs">+{z.communes.length - 6}</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                                            <div className="flex justify-between">
                                                <span>Precio base</span>
                                                <span className="font-medium text-foreground">${z.basePrice.toLocaleString("es-CL")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>+ por kg</span>
                                                <span className="font-medium text-foreground">${z.pricePerKg.toLocaleString("es-CL")}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <VehicleDialog
                storeId={storeId!}
                vehicle={vehicleDialog.vehicle}
                drivers={drivers}
                open={vehicleDialog.open}
                onClose={() => setVehicleDialog({ open: false })}
                onSaved={load}
            />
            <DriverDialog
                storeId={storeId!}
                driver={driverDialog.driver}
                vehicles={vehicles}
                open={driverDialog.open}
                onClose={() => setDriverDialog({ open: false })}
                onSaved={load}
            />
            <ZoneDialog
                storeId={storeId!}
                zone={zoneDialog.zone}
                open={zoneDialog.open}
                onClose={() => setZoneDialog({ open: false })}
                onSaved={load}
            />
        </div>
    );
}
