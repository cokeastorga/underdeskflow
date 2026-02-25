"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp
} from "firebase/firestore";
import {
    Mail,
    MessageSquare,
    Trash2,
    MailForward,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    User,
    Calendar,
    ArrowUpRight,
    ExternalLink,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface StoreMessage {
    id: string;
    storeId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "new" | "read" | "replied";
    createdAt: any;
}

export default function MessagesPage() {
    const { storeId } = useAuth();
    const [messages, setMessages] = useState<StoreMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMessage, setSelectedMessage] = useState<StoreMessage | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!storeId) return;

        const q = query(
            collection(db, "store_messages"),
            where("storeId", "==", storeId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as StoreMessage));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast.error("Error al cargar los mensajes");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const filteredMessages = messages.filter(msg =>
        msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const markAsRead = async (message: StoreMessage) => {
        if (message.status === "new") {
            try {
                await updateDoc(doc(db, "store_messages", message.id), {
                    status: "read"
                });
            } catch (error) {
                console.error("Error updating message status:", error);
            }
        }
    };

    const handleSelectMessage = (msg: StoreMessage) => {
        setSelectedMessage(msg);
        markAsRead(msg);
        setReplyText("");
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de que quieres eliminar este mensaje?")) return;

        setIsDeleting(id);
        try {
            await deleteDoc(doc(db, "store_messages", id));
            toast.success("Mensaje eliminado");
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error("No se pudo eliminar el mensaje");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleSendReply = () => {
        if (!selectedMessage || !replyText.trim()) return;

        const subject = encodeURIComponent(`Re: ${selectedMessage.subject}`);
        const body = encodeURIComponent(replyText);
        const mailtoLink = `mailto:${selectedMessage.email}?subject=${subject}&body=${body}`;

        // Mark as replied in database
        updateDoc(doc(db, "store_messages", selectedMessage.id), {
            status: "replied"
        });

        // Open email client
        window.open(mailtoLink, "_blank");
        toast.success("Abriendo cliente de correo...");
        setSelectedMessage(null);
    };

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return format(d, "d 'de' MMMM, HH:mm", { locale: es });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Centro de Mensajes</h1>
                    <p className="text-muted-foreground mt-1">Gestiona las consultas de tus clientes desde el formulario de contacto.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                        {messages.length} Mensajes totales
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-green-500/10 text-green-600 border-green-500/20">
                        {messages.filter(m => m.status === "new").length} Nuevos
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por nombre, email o asunto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 rounded-xl"
                    />
                </div>
                <Button variant="outline" size="icon" className="rounded-xl">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
                {/* List Column */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-800/50">
                        <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Bandeja de Entrada
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-border">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm font-medium">Cargando mensajes...</p>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-center px-6">
                                <Mail className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-bold text-zinc-500">No hay mensajes</p>
                                <p className="text-xs">Tus consultas aparecerán aquí.</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    className={`p-4 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50 relative group ${selectedMessage?.id === msg.id ? 'bg-zinc-50 dark:bg-zinc-800/50 border-l-4 border-primary' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm font-bold truncate pr-8 ${msg.status === "new" ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                            {msg.name}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>
                                    <div className={`text-xs truncate ${msg.status === "new" ? 'text-zinc-700 dark:text-zinc-300 font-semibold' : 'text-zinc-400'}`}>
                                        {msg.subject}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {msg.status === "new" && <Badge className="bg-primary hover:bg-primary text-[9px] h-4">Nuevo</Badge>}
                                        {msg.status === "replied" && <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-500/5 text-[9px] h-4">Respondido</Badge>}
                                        {msg.status === "read" && <Badge variant="outline" className="text-zinc-400 border-zinc-200 text-[9px] h-4">Leído</Badge>}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"
                                        onClick={(e) => handleDelete(e, msg.id)}
                                        disabled={isDeleting === msg.id}
                                    >
                                        {isDeleting === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm flex flex-col">
                    {selectedMessage ? (
                        <>
                            <div className="p-6 border-b border-border space-y-4">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedMessage(null)} className="rounded-xl">Cerrar</Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-primary">
                                            {selectedMessage.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900 dark:text-white">{selectedMessage.name}</span>
                                            <span className="text-xs">{selectedMessage.email}</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(selectedMessage.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-3xl border border-border italic text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[200px] text-lg">
                                    "{selectedMessage.message}"
                                </div>

                                <div className="mt-12 space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <MailForward className="w-4 h-4" /> Redactar Respuesta Inteligente
                                    </label>
                                    <Textarea
                                        placeholder="Escribe tu respuesta aquí. Al terminar, usaremos tu App de correo para enviarla."
                                        className="min-h-[150px] rounded-2xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 p-6 text-base"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <div className="flex items-center justify-between gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <p className="text-xs text-primary font-medium flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Esto abrirá Outlook, Gmail o tu gestor de correo predeterminado.
                                        </p>
                                        <Button
                                            disabled={!replyText.trim()}
                                            onClick={handleSendReply}
                                            className="px-8 py-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Generar Mailto & Enviar
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-6 p-12 text-center">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-inner">
                                <MessageSquare className="w-10 h-10 opacity-30" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-zinc-500">Selecciona un mensaje</h3>
                                <p className="text-sm max-w-[300px]">Haz clic en una consulta de la lista para leer el contenido y redactar una respuesta.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
