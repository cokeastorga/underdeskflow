import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import {
    AlertTriangle,
    Scale,
    Shield,
    FileText,
    ChevronRight,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { HelpCenterClient } from "@/components/store/HelpCenterClient";
import { HelpItem } from "@/components/store/HelpItem";

async function getStore(storeId: string) {
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Store;
    }
    return null;
}

export default async function HelpCenterPage({ params }: { params: Promise<{ storeId: string }> }) {
    const resolvedParams = await params;
    const store = await getStore(resolvedParams.storeId);

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Tienda no encontrada</div>;
    }

    const storeEmail = store.contactEmail || "soporte@tu-tienda.com";
    const storePhone = store.socialLinks?.whatsapp || store.phoneNumber || "+56 9 1234 5678";

    return (
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            {/* Disclaimer Bar */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 py-3">
                <div className="container mx-auto px-4 flex items-center gap-3 text-xs md:text-sm text-amber-800 dark:text-amber-400 font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <strong>Aviso Legal:</strong> {store.name} opera de forma independiente. UnderDesk Flow™ provee exclusivamente la infraestructura tecnológica y no es responsable de las operaciones, despachos o productos vendidos por este comercio.
                    </span>
                </div>
            </div>

            {/* Client Component for Search, Tracking & Actions */}
            <HelpCenterClient store={store} />

            {/* Sidebar-style Legal Section for the bottom */}
            <section className="py-20 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <div className="container mx-auto px-4 text-center space-y-12">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-3xl font-bold italic">Legal y Responsabilidad</h2>
                        <p className="text-muted-foreground">
                            En {store.name} nos comprometemos con la transparencia. Revisa nuestras políticas legales y la división de responsabilidad con la plataforma.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-8 rounded-[2rem] space-y-6 text-left">
                            <h4 className="font-bold flex items-center gap-2 uppercase tracking-widest text-xs text-zinc-500">
                                <Scale className="w-4 h-4" /> Políticas de {store.name}
                            </h4>
                            <div className="space-y-1 flex flex-col">
                                <HelpItem label="Términos de servicio" storeName={store.name} email={storeEmail} phone={storePhone} />
                                <HelpItem label="Política de privacidad" storeName={store.name} email={storeEmail} phone={storePhone} />
                            </div>
                        </div>

                        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-8 rounded-[2rem] space-y-6 text-left">
                            <h4 className="font-bold flex items-center gap-2 uppercase tracking-widest text-xs text-zinc-500">
                                <ShieldCheck className="w-4 h-4" /> Seguridad
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Utilizamos tecnología SSL de 256 bits para proteger tus datos en todo momento. Todas las transacciones son procesadas de forma segura.
                            </p>
                        </div>

                        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-8 rounded-[2rem] space-y-6 text-left">
                            <h4 className="font-bold flex items-center gap-2 uppercase tracking-widest text-xs text-zinc-500">
                                <AlertTriangle className="w-4 h-4" /> Deslinde
                            </h4>
                            <div className="flex flex-col">
                                <HelpItem label="Responsabilidad de la plataforma" storeName={store.name} email={storeEmail} phone={storePhone} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 text-xs text-zinc-400 font-medium">
                        © {new Date().getFullYear()} {store.name} • Desarrollado por UnderDesk Flow™
                    </div>
                </div>
            </section>
        </div>
    );
}
