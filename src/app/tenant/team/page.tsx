"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { TeamRole, inviteMemberAction } from "./actions";
import { toast } from "sonner";
import { 
    Users, 
    UserPlus, 
    Mail, 
    Shield, 
    Trash2, 
    UserCircle,
    BadgeCheck,
    Clock,
    MoreVertical,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function TeamPage() {
    const { storeId, user } = useAuth();
    const [isInviting, setIsInviting] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        role: "store_manager" as TeamRole
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock team for now until we implement the fetching logic
    const [team, setTeam] = useState([
        { id: user?.uid, email: user?.email, firstName: "Tú", lastName: "(Admin)", role: "tenant_admin", status: "active" }
    ]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) return;

        setIsSubmitting(true);
        try {
            const result = await inviteMemberAction(
                inviteData.email,
                inviteData.firstName,
                inviteData.lastName,
                inviteData.role
            );

            if (result.success) {
                toast.success("¡Invitación enviada exitosamente!");
                setIsInviting(false);
                setInviteData({ email: "", firstName: "", lastName: "", role: "store_manager" });
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "tenant_admin": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
            case "store_manager": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "cashier": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "tenant_admin": return "Administrador";
            case "store_manager": return "Gerente de Tienda";
            case "cashier": return "Cajero / POS";
            default: return role;
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Gestión de Equipo
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Administra los accesos y roles de tus colaboradores.
                    </p>
                </div>

                <Dialog open={isInviting} onOpenChange={setIsInviting}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invitar Miembro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Invitar nuevo miembro</DialogTitle>
                            <DialogDescription>
                                Se enviará un correo con las credenciales temporales. El usuario deberá cambiar su contraseña al entrar.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <Input 
                                        id="firstName" 
                                        placeholder="Ej: Juan" 
                                        required 
                                        value={inviteData.firstName}
                                        onChange={e => setInviteData({...inviteData, firstName: e.target.value})}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input 
                                        id="lastName" 
                                        placeholder="Ej: Pérez" 
                                        required 
                                        value={inviteData.lastName}
                                        onChange={e => setInviteData({...inviteData, lastName: e.target.value})}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="juan@empresa.com" 
                                    required 
                                    value={inviteData.email}
                                    onChange={e => setInviteData({...inviteData, email: e.target.value})}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rol en el Equipo</Label>
                                <Select 
                                    value={inviteData.role} 
                                    onValueChange={(val: TeamRole) => setInviteData({...inviteData, role: val})}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="tenant_admin">Administrador (Acceso Total)</SelectItem>
                                        <SelectItem value="store_manager">Gerente (Gestión Operativa)</SelectItem>
                                        <SelectItem value="cashier">Cajero (Solo POS)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Enviar Invitación
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 rounded-3xl border-none shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Miembros Activos</CardTitle>
                                <CardDescription>Gestiona quién tiene acceso a tu organización.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {team.map((member: any) => (
                                <div key={member.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center font-bold text-gray-600 dark:text-zinc-400">
                                            {member.firstName[0]}{member.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-2">
                                                {member.firstName} {member.lastName}
                                                {member.status === "active" ? (
                                                    <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                                                ) : (
                                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`rounded-lg ${getRoleColor(member.role)}`}>
                                            {getRoleLabel(member.role)}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Shield className="h-32 w-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5" />
                                Roles y Permisos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Administrador</p>
                                <p className="text-sm opacity-90">Acceso total a configuración, pagos y equipo.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Gerente</p>
                                <p className="text-sm opacity-90">Gestión de inventario, productos y órdenes.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Cajero</p>
                                <p className="text-sm opacity-90">Acceso exclusivo a la terminal de ventas (POS).</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-xl border border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Consejo Pro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Mantén a tu equipo organizado asignando el rol de <span className="text-primary font-medium">Cajero</span> a quienes solo operen en tienda física para mayor seguridad.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
